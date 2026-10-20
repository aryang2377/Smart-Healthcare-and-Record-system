import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import mongoose from "mongoose";

async function testHttp() {
  await mongoose.connect(process.env.MONGODB_URI);
  const doc = await User.findOne({ role: "doctor", specialization: "Cardiology" });
  const admin = await User.findOne({ role: "admin" });
  const recep = await User.findOne({ role: "receptionist" });

  const docToken = jwt.sign({ id: doc._id, role: "doctor" }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET);
  const recepToken = jwt.sign({ id: recep._id, role: "receptionist" }, process.env.JWT_SECRET);

  await mongoose.disconnect();

  // 1. Test public /symptom
  const res1 = await fetch("http://localhost:4000/symptom");
  const text1 = await res1.text();
  console.log("Public /symptom status:", res1.status, "Has content:", text1.includes("Clinical AI Symptom Checker"));

  // 2. Test receptionist visiting /symptom (should redirect to /staff)
  const res2 = await fetch("http://localhost:4000/symptom", {
    headers: { Cookie: `token=${recepToken}` },
    redirect: "manual",
  });
  console.log("Receptionist /symptom status (should be 302):", res2.status, "Location:", res2.headers.get("location"));

  // 2b. Test doctor visiting /symptom (allowed to run symptom checks)
  const resDocSymptom = await fetch("http://localhost:4000/symptom", {
    headers: { Cookie: `token=${docToken}` },
  });
  console.log("Doctor /symptom status:", resDocSymptom.status);

  // 2c. Test admin visiting /symptom (allowed to run symptom checks)
  const resAdminSymptom = await fetch("http://localhost:4000/symptom", {
    headers: { Cookie: `token=${adminToken}` },
  });
  console.log("Admin /symptom status:", resAdminSymptom.status);

  // 3. Test doctor /staff?tab=triage
  const res3 = await fetch("http://localhost:4000/staff?tab=triage", {
    headers: { Cookie: `token=${docToken}` },
  });
  const text3 = await res3.text();
  console.log("Doctor /staff?tab=triage status:", res3.status, "Has AI Symptom Triage:", text3.includes("AI Symptom Triage"));

  // 4. Test admin /admin?tab=triage
  const res4 = await fetch("http://localhost:4000/admin?tab=triage", {
    headers: { Cookie: `token=${adminToken}` },
  });
  const text4 = await res4.text();
  console.log("Admin /admin?tab=triage status:", res4.status, "Has Admin Triage tab:", text4.includes("tab-triage"));

  process.exit(0);
}

testHttp().catch(e => {
  console.error("HTTP test error:", e);
  process.exit(1);
});
