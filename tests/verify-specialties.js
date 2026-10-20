import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const testSpecialties = [
    "Cardiology",
    "Neurology",
    "Dermatology",
    "Orthopedics",
    "Gastroenterology",
    "Pulmonology",
    "Psychiatry",
    "ENT",
    "Ophthalmology",
    "Gynecology",
    "Urology",
    "Endocrinology",
    "General Medicine",
    "Pediatrics",
  ];

  const specialtyAliases = {
    "General Medicine": ["General Medicine", "General Physician", "Internal Medicine", "Physician"],
    "ENT": ["ENT", "Otolaryngology", "Ear Nose Throat", "Otorhinolaryngology"],
    "Gynecology": ["Gynecology", "Obstetrics", "OBGYN", "Gynecologist"],
    "Orthopedics": ["Orthopedics", "Orthopedic", "Orthopedist"],
    "Pulmonology": ["Pulmonology", "Pulmonary", "Respiratory", "Chest"],
    "Gastroenterology": ["Gastroenterology", "Gastro", "Gastrologist"],
    "Psychiatry": ["Psychiatry", "Psychiatrist", "Mental Health"],
    "Ophthalmology": ["Ophthalmology", "Ophthalmologist", "Eye"],
    "Endocrinology": ["Endocrinology", "Endocrinologist", "Diabetology"],
    "Urology": ["Urology", "Urologist", "Urinary"],
    "Neurology": ["Neurology", "Neurologist"],
    "Dermatology": ["Dermatology", "Dermatologist"],
    "Cardiology": ["Cardiology", "Cardiologist"],
    "Pediatrics": ["Pediatrics", "Pediatrician", "Child"],
  };

  let allPassed = true;

  for (const spec of testSpecialties) {
    const searchTerms = [spec, ...(specialtyAliases[spec] || [])];
    const specialtyRegexes = [...new Set(searchTerms)].map(
      (s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    );

    const docs = await User.find({
      role: "doctor",
      approvalStatus: "approved",
      isActive: { $ne: false },
      specialization: { $in: specialtyRegexes },
    }).select("fullname specialization consultationFee");

    if (docs.length === 0) {
      console.error(`FAILED for ${spec}: No matching doctors found.`);
      allPassed = false;
    } else {
      console.log(`[PASS] ${spec.padEnd(18)} => Matched: ${docs.map(d => `${d.fullname} (₹${d.consultationFee})`).join(", ")}`);
    }
  }

  await mongoose.disconnect();
  if (!allPassed) {
    process.exit(1);
  }
  console.log("\nALL 14 CLINICAL SPECIALTIES MATCHED DOCTORS SUCCESSFULLY!");
  process.exit(0);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
