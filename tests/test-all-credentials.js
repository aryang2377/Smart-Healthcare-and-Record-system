import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.js";

async function verifyAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const allAccounts = [
    // 1. System Admin
    { role: "admin", email: "admin@caresync.health", pass: "AdminCareSync@2026", name: "System Administrator" },

    // 2. 14 Specialists
    { role: "doctor", email: "doctor@caresync.health", pass: "Cardio#Sharma26", name: "Dr. Rajesh Sharma (Cardiology)" },
    { role: "doctor", email: "dr.priya@caresync.health", pass: "Derma#Mehta26", name: "Dr. Priya Mehta (Dermatology)" },
    { role: "doctor", email: "dr.verma@caresync.health", pass: "GenMed#Verma26", name: "Dr. Amit Verma (General Medicine)" },
    { role: "doctor", email: "dr.kapoor@caresync.health", pass: "Pedia#Kapoor26", name: "Dr. Neha Kapoor (Pediatrics)" },
    { role: "doctor", email: "dr.singh@caresync.health", pass: "Neuro#Singh26", name: "Dr. Rahul Singh (Neurology)" },
    { role: "doctor", email: "dr.malhotra@caresync.health", pass: "Ortho#Malhotra26", name: "Dr. Karan Malhotra (Orthopedics)" },
    { role: "doctor", email: "dr.ananya@caresync.health", pass: "Gynec#Gupta26", name: "Dr. Ananya Gupta (Gynecology)" },
    { role: "doctor", email: "dr.nair@caresync.health", pass: "Ent#Nair26", name: "Dr. Vikram Nair (ENT)" },
    { role: "doctor", email: "dr.bansal@caresync.health", pass: "Gastro#Bansal26", name: "Dr. Alok Bansal (Gastroenterology)" },
    { role: "doctor", email: "dr.saxena@caresync.health", pass: "Pulmo#Saxena26", name: "Dr. Ritu Saxena (Pulmonology)" },
    { role: "doctor", email: "dr.joshi@caresync.health", pass: "Psych#Joshi26", name: "Dr. Sameer Joshi (Psychiatry)" },
    { role: "doctor", email: "dr.sundaram@caresync.health", pass: "Eye#Sundaram26", name: "Dr. Meenakshi Sundaram (Ophthalmology)" },
    { role: "doctor", email: "dr.deshmukh@caresync.health", pass: "Endo#Deshmukh26", name: "Dr. Sanjay Deshmukh (Endocrinology)" },
    { role: "doctor", email: "dr.aggarwal@caresync.health", pass: "Uro#Aggarwal26", name: "Dr. Deepak Aggarwal (Urology)" },

    // 3. 2 Receptionists
    { role: "receptionist", email: "receptionist@caresync.health", pass: "Staff#Sarah26", name: "Sarah Jenkins (Day Shift)" },
    { role: "receptionist", email: "reception@caresync.health", pass: "Staff#David26", name: "David Miller (Evening Shift)" },

    // 4. Patients (Only John Doe per explicit request)
    { role: "patient", email: "john@gmail.com", pass: "john12", name: "john doe" },
  ];

  let allPass = true;
  console.log(`\nVerifying all ${allAccounts.length} user credentials against database...\n`);

  for (const acc of allAccounts) {
    const user = await User.findOne({ email: acc.email });
    if (!user) {
      console.error(`[FAIL] User not found in DB: ${acc.email}`);
      allPass = false;
      continue;
    }

    const isMatch = await bcrypt.compare(acc.pass, user.password);
    if (!isMatch) {
      console.error(`[FAIL] Password mismatch for: ${acc.email} (${acc.name})`);
      allPass = false;
    } else {
      console.log(`[PASS] ${acc.role.toUpperCase().padEnd(12)} | ${acc.email.padEnd(28)} | PW: ${acc.pass.padEnd(18)} | ${acc.name}`);
    }
  }

  await mongoose.disconnect();
  if (!allPass) {
    console.error("\nSOME CREDENTIALS FAILED VERIFICATION!");
    process.exit(1);
  }
  console.log(`\nALL ${allAccounts.length} ACCOUNTS VERIFIED WITH 100% SUCCESS!`);
  process.exit(0);
}

verifyAll().catch(e => {
  console.error(e);
  process.exit(1);
});
