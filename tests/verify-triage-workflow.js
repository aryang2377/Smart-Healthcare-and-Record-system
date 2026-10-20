import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";
import SymptomTriage from "../models/SymptomTriage.js";
import Notification from "../models/Notification.js";

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Test 1: Verify strictly 1 doctor per specialization
  const doctors = await User.find({ role: "doctor", approvalStatus: "approved", isActive: true });
  console.log(`\n--- Test 1: Checking Doctor Specializations (Total: ${doctors.length}) ---`);
  const specCounts = {};
  for (const doc of doctors) {
    specCounts[doc.specialization] = (specCounts[doc.specialization] || 0) + 1;
  }
  let hasDuplicates = false;
  for (const [spec, count] of Object.entries(specCounts)) {
    if (count > 1) {
      console.error(`[FAIL] Duplicate found for ${spec}: ${count} doctors`);
      hasDuplicates = true;
    } else {
      console.log(`[PASS] ${spec}: exactly 1 doctor (${doctors.find(d => d.specialization === spec).fullname})`);
    }
  }
  if (hasDuplicates) {
    throw new Error("Found duplicate doctors for a specialization!");
  }

  // Test 2: Create a sample triage inquiry matching Cardiology (Dr. Rajesh Sharma)
  console.log("\n--- Test 2: Simulating AI Symptom Triage for Cardiology ---");
  const cardioDoc = await User.findOne({ specialization: "Cardiology", role: "doctor" });
  if (!cardioDoc) throw new Error("Cardiology doctor not found!");

  const newTriage = await SymptomTriage.create({
    patientName: "Jane Doe (Test Patient)",
    patientEmail: "jane.doe@example.com",
    patientPhone: "+91 98765 00112",
    symptoms: ["Chest Pain", "Shortness of Breath", "Palpitations"],
    description: "Sudden onset of chest tightness and fluttering sensation.",
    urgency: "high",
    emergencyFlag: true,
    emergencyReason: "Acute chest discomfort requiring urgent cardiovascular assessment",
    primaryConditions: ["Angina Pectoris", "Cardiac Arrhythmia"],
    recommendedSpecialties: ["Cardiology"],
    summary: "Urgent cardiovascular evaluation recommended due to acute chest discomfort.",
    suggestedDoctors: [cardioDoc._id],
    suggestedDoctorNames: [cardioDoc.fullname],
  });
  console.log("[PASS] SymptomTriage created with ID:", newTriage._id);

  // Test 3: Doctor dashboard inquiry matching
  console.log("\n--- Test 3: Checking Doctor Dashboard Query Matching ---");
  const specPattern = (cardioDoc.specialization || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const doctorLeads = await SymptomTriage.find({
    $or: [
      { suggestedDoctors: cardioDoc._id },
      { suggestedDoctorNames: cardioDoc.fullname },
      ...(specPattern ? [{ recommendedSpecialties: new RegExp(`\\b${specPattern}\\b`, "i") }] : []),
    ],
  }).sort({ createdAt: -1 });

  const foundLead = doctorLeads.find(l => l._id.toString() === newTriage._id.toString());
  if (!foundLead) {
    throw new Error("Doctor dashboard query failed to match the triage lead!");
  }
  console.log(`[PASS] Doctor (${cardioDoc.fullname}) received triage lead successfully! Lead urgency: ${foundLead.urgency}`);

  // Test 4: Admin dashboard query matching
  console.log("\n--- Test 4: Checking Admin Dashboard Query Matching ---");
  const allTriage = await SymptomTriage.find().sort({ createdAt: -1 });
  const adminFound = allTriage.find(l => l._id.toString() === newTriage._id.toString());
  if (!adminFound) {
    throw new Error("Admin query failed to find the triage log!");
  }
  console.log(`[PASS] Admin dashboard query retrieved triage log successfully! Total logs: ${allTriage.length}`);

  // Clean up the test triage
  await SymptomTriage.findByIdAndDelete(newTriage._id);
  console.log("[PASS] Test triage lead cleaned up successfully.");

  await mongoose.disconnect();
  console.log("\nALL TESTS PASSED SUCCESSFULLY! 100% READY.");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
