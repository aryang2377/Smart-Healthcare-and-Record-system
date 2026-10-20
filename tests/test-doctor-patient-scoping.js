import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";
import Appointment from "../models/appointment.js";

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Test 1: Verify only John Doe exists as patient
  const patients = await User.find({ role: "patient" });
  console.log(`\n--- Test 1: Verify Only John Doe Exists (Found: ${patients.length}) ---`);
  if (patients.length !== 1 || patients[0].email !== "john@gmail.com") {
    throw new Error(`Expected only john@gmail.com, found ${patients.map(p => p.email).join(", ")}`);
  }
  console.log(`[PASS] Only John Doe (${patients[0].email}) exists in patient registry.`);

  // Test 2: Doctor without appointment has empty patientRoster
  console.log("\n--- Test 2: Scoping - Doctor Without Appointments ---");
  const docCardio = await User.findOne({ specialization: "Cardiology", role: "doctor" });
  const docDerma = await User.findOne({ specialization: "Dermatology", role: "doctor" });

  // Clean any old appointments for docCardio & docDerma
  await Appointment.deleteMany({
    $or: [{ doctorId: docCardio._id }, { doctorId: docDerma._id }],
  });

  // Query docCardio appointments
  const cardioAppts = await Appointment.find({
    $or: [{ doctorId: docCardio._id }, { doctorName: docCardio.fullname }],
  });
  console.log(`Cardio doc appointments count: ${cardioAppts.length}`);

  let cardioRoster = [];
  if (cardioAppts.length > 0) {
    const pIds = cardioAppts.map(a => a.patientId).filter(Boolean);
    const pNames = cardioAppts.map(a => a.patientName).filter(Boolean);
    cardioRoster = await User.find({
      role: "patient",
      $or: [{ _id: { $in: pIds } }, { fullname: { $in: pNames } }],
    });
  }
  if (cardioRoster.length !== 0) {
    throw new Error(`Expected 0 patients for doctor without appointments, found: ${cardioRoster.length}`);
  }
  console.log("[PASS] Doctor with 0 appointments sees 0 patients in their roster.");

  // Test 3: Create appointment for docCardio with John Doe
  console.log("\n--- Test 3: Doctor With Appointment Sees Their Patient ---");
  const testAppt = await Appointment.create({
    patientId: patients[0]._id,
    patientName: patients[0].fullname,
    doctorId: docCardio._id,
    doctorName: docCardio.fullname,
    specialization: docCardio.specialization,
    date: new Date(),
    time: "10:00 AM",
    status: "Confirmed",
  });
  console.log(`Created test appointment: ${testAppt._id} for ${docCardio.fullname} with ${patients[0].fullname}`);

  // Re-run query for docCardio
  const updatedCardioAppts = await Appointment.find({
    $or: [{ doctorId: docCardio._id }, { doctorName: docCardio.fullname }],
  });
  const updatedIds = updatedCardioAppts.map(a => a.patientId).filter(Boolean);
  const updatedNames = updatedCardioAppts.map(a => a.patientName).filter(Boolean);
  const updatedCardioRoster = await User.find({
    role: "patient",
    $or: [{ _id: { $in: updatedIds } }, { fullname: { $in: updatedNames } }],
  });

  if (updatedCardioRoster.length !== 1 || updatedCardioRoster[0].email !== "john@gmail.com") {
    throw new Error(`Expected John Doe in cardio doctor roster, found: ${updatedCardioRoster.map(p => p.email).join(", ")}`);
  }
  console.log(`[PASS] Doctor (${docCardio.fullname}) now sees John Doe (${updatedCardioRoster[0].fullname})!`);

  // Test 4: Other doctor (Derma) STILL has 0 patients
  console.log("\n--- Test 4: Other Doctor Does NOT See John Doe ---");
  const dermaAppts = await Appointment.find({
    $or: [{ doctorId: docDerma._id }, { doctorName: docDerma.fullname }],
  });
  let dermaRoster = [];
  if (dermaAppts.length > 0) {
    const dIds = dermaAppts.map(a => a.patientId).filter(Boolean);
    const dNames = dermaAppts.map(a => a.patientName).filter(Boolean);
    dermaRoster = await User.find({
      role: "patient",
      $or: [{ _id: { $in: dIds } }, { fullname: { $in: dNames } }],
    });
  }
  if (dermaRoster.length !== 0) {
    throw new Error(`Doctor without appointments should see 0 patients, but found: ${dermaRoster.length}`);
  }
  console.log(`[PASS] Other doctor (${docDerma.fullname}) sees 0 patients (John Doe is NOT visible to them).`);

  // Cleanup test appointment
  await Appointment.findByIdAndDelete(testAppt._id);
  console.log("[PASS] Test appointment cleaned up.");

  await mongoose.disconnect();
  console.log("\nALL PATIENT SCOPING TESTS PASSED 100%!");
  process.exit(0);
}

runTest().catch((e) => {
  console.error("Test failure:", e);
  process.exit(1);
});
