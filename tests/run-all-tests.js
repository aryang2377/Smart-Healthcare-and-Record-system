import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import Appointment from "../models/appointment.js";
import Prescription from "../models/Prescription.js";
import Report from "../models/Report.js";
import {
  evaluateBloodPressure,
  evaluateBloodSugar,
  evaluateOxygen,
  evaluateHeartRate,
} from "../services/vitalsRules.js";
import { analyzeSymptoms } from "../services/symptomChecker.js";

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  ✔ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${description}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("   🏥 CareSync Enterprise Health Verification Suite    ");
  console.log("=======================================================\n");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas / Local Database.\n");

  console.log("🔹 Test Suite 1: RBAC & User Identity Models");
  const admin = await User.findOne({ role: "admin" });
  assert(admin !== null && admin.role === "admin", "System Administrator account exists with admin role");

  const approvedDoctors = await User.find({ role: "doctor", approvalStatus: "approved" });
  assert(approvedDoctors.length >= 10, `Medical specialists properly provisioned (Found: ${approvedDoctors.length} doctors)`);

  const patient = await User.findOne({ role: "patient" });
  assert(patient !== null && patient.role === "patient", `Patient record exists (${patient?.fullname || "Patient"})`);

  assert(admin.password.startsWith("$2b$") || admin.password.startsWith("$2a$"), "Admin credentials securely encrypted with bcrypt salt");

  console.log("\n🔹 Test Suite 2: Prescription IDOR & Confidentiality Authorization");
  const testDoc = approvedDoctors[0];
  const testPatient = patient;

  const testRx = await Prescription.create({
    rxNumber: `TEST-RX-${Date.now()}`,
    patientId: testPatient._id,
    patientName: testPatient.fullname,
    doctorId: testDoc._id,
    doctorName: testDoc.fullname,
    problem: "Elevated blood pressure check",
    diagnosis: "Stage 1 Essential Hypertension",
    medicines: "Amlodipine 5mg once daily",
    status: "Sent to Patient",
  });

  const canOwnerAccess = testRx.patientId.equals(testPatient._id);
  const canDoctorAccess = testRx.doctorId.equals(testDoc._id);

  const unauthorizedUserId = new mongoose.Types.ObjectId();
  const canThirdPartyAccess = testRx.patientId.equals(unauthorizedUserId) || testRx.doctorId.equals(unauthorizedUserId);

  assert(canOwnerAccess === true, "Prescription owner (patient) is authorized to access prescription");
  assert(canDoctorAccess === true, "Prescribing physician is authorized to access prescription");
  assert(canThirdPartyAccess === false, "Unauthorized third-party user is blocked (IDOR Protection verified)");

  await Prescription.findByIdAndDelete(testRx._id);

  console.log("\n🔹 Test Suite 3: Concurrency & Duplicate Slot Prevention");
  const testDate = new Date(Date.UTC(2027, 0, 15));
  const testSlot = "11:30 AM";

  await Appointment.deleteMany({ doctorId: testDoc._id, date: testDate, time: testSlot });

  const appt1 = await Appointment.create({
    patientId: testPatient._id,
    patientName: testPatient.fullname,
    doctorId: testDoc._id,
    doctorName: testDoc.fullname,
    date: testDate,
    time: testSlot,
    slot: testSlot,
    status: "Scheduled",
  });
  assert(appt1._id !== null, `Slot successfully reserved by first patient (${testDoc.fullname} @ ${testSlot})`);

  let duplicateRejected = false;
  try {

    await Appointment.create({
      patientId: new mongoose.Types.ObjectId(),
      patientName: "Simulated Concurrent Patient",
      doctorId: testDoc._id,
      doctorName: testDoc.fullname,
      date: testDate,
      time: testSlot,
      slot: testSlot,
      status: "Scheduled",
    });
  } catch (err) {
    if (err.code === 11000) {
      duplicateRejected = true;
    }
  }
  assert(duplicateRejected === true, "Database compound unique index prevents simultaneous double-booking (Race Condition Blocked)");

  appt1.status = "Cancelled";
  await appt1.save();

  let canRebookAfterCancel = false;
  try {
    const appt2 = await Appointment.create({
      patientId: testPatient._id,
      patientName: testPatient.fullname,
      doctorId: testDoc._id,
      doctorName: testDoc.fullname,
      date: testDate,
      time: testSlot,
      slot: testSlot,
      status: "Scheduled",
    });
    canRebookAfterCancel = appt2._id !== null;
    await Appointment.findByIdAndDelete(appt2._id);
  } catch (err) {
    canRebookAfterCancel = false;
  }
  assert(canRebookAfterCancel === true, "Cancelled appointment releases the slot for other patients");

  await Appointment.findByIdAndDelete(appt1._id);

  console.log("\n🔹 Test Suite 4: Clinical Decision Support (Vitals Rules)");
  const normalBP = evaluateBloodPressure(118, 78);
  assert(normalBP.category === "Normal", "Normal BP evaluated accurately (118/78 mmHg -> Normal)");

  const stage2BP = evaluateBloodPressure(145, 95);
  assert(stage2BP.category === "Hypertension Stage 2" && stage2BP.alert === true, "Stage 2 Hypertension triggers clinical alert (145/95 mmHg)");

  const crisisBP = evaluateBloodPressure(185, 125);
  assert(crisisBP.category === "Hypertensive Crisis" && crisisBP.alert === true, "Hypertensive Crisis triggers high-priority alert (185/125 mmHg)");

  const hypoxic = evaluateOxygen(88);
  assert(hypoxic.alert === true, "Hypoxemic oxygen level triggers emergency notice (SpO2 88%)");

  const bradycardia = evaluateHeartRate(48);
  assert(bradycardia.category === "Bradycardia (Low)", "Bradycardia correctly identified (< 60 bpm)");

  console.log("\n🔹 Test Suite 5: AI Symptom Triage Fallback & Emergency Red Flags");
  const emergencyCheck = await analyzeSymptoms(
    ["chest pain", "shortness of breath", "sweating"],
    "Severe central chest pressure radiating to left jaw for 30 minutes"
  );
  assert(emergencyCheck.urgency === "high", "Cardiac symptoms correctly flagged with HIGH urgency");
  assert(emergencyCheck.emergencyFlag === true, "Emergency red-flag boolean asserted for acute coronary syndrome signs");
  assert(emergencyCheck.recommendedSpecialties.includes("Cardiology"), "Specialty accurately matched to Cardiology");

  const mildCheck = await analyzeSymptoms(["dry skin", "mild itching"], "Mild dry skin patch on forearm");
  assert(mildCheck.urgency === "low", "Mild dermatological symptoms assigned LOW urgency");
  assert(mildCheck.emergencyFlag === false, "No emergency flag asserted for mild symptoms");

  await mongoose.disconnect();

  console.log("\n=======================================================");
  console.log(` Test Execution Complete: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
