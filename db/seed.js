import bcrypt from "bcrypt";
import User from "../models/user.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";

export const seedDefaultUsers = async () => {
  try {
    // 1. Seed or sync Single System Administrator from .env
    const adminEmail = process.env.ADMIN_EMAIL || "admin@caresync.health";
    const adminPass = process.env.ADMIN_PASSWORD || "AdminCareSync@2026";
    const adminName = process.env.ADMIN_NAME || "Hospital Administrator";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashPass = await bcrypt.hash(adminPass, 10);
      await User.create({
        fullname: adminName,
        email: adminEmail,
        password: hashPass,
        role: "admin",
        specialization: "Hospital Administration",
        phone: "+91 98765 43210",
        approvalStatus: "approved",
      });
      console.log(`[Seed] System Administrator initialized from .env: ${adminEmail}`);
    } else {
      const isMatch = await bcrypt.compare(adminPass, existingAdmin.password);
      if (!isMatch) {
        existingAdmin.password = await bcrypt.hash(adminPass, 10);
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log(`[Seed] System Administrator password synced with .env: ${adminEmail}`);
      }
    }

    // 2. Seed or sync Sample Verified Doctor
    const docEmail = "doctor@caresync.health";
    const docPass = "Doctor123#";
    const docName = "Dr. Rajesh Sharma";

    const existingDoc = await User.findOne({ email: docEmail });
    if (!existingDoc) {
      const hashDocPass = await bcrypt.hash(docPass, 10);
      await User.create({
        fullname: docName,
        email: docEmail,
        password: hashDocPass,
        role: "doctor",
        approvalStatus: "approved",
        specialization: "Cardiology",
        qualifications: "MBBS, MD (Cardiology)",
        experience: "12",
        consultationFee: 800,
        licenseNumber: "MCI-2024-8849",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43210",
        workingDays: "Mon - Fri",
        workingHours: "09:00 AM - 02:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      });
      console.log(`[Seed] Sample Doctor initialized: ${docEmail}`);
    } else {
      existingDoc.approvalStatus = "approved";
      existingDoc.role = "doctor";
      existingDoc.password = await bcrypt.hash(docPass, 10);
      existingDoc.consultationFee = 800;
      existingDoc.specialization = "Cardiology";
      await existingDoc.save();
      console.log(`[Seed] Sample Doctor verified & synced: ${docEmail}`);
    }

    // 3. Seed or sync Sample Receptionist for Staff Portal operational testing
    const recepEmail = "receptionist@caresync.health";
    const recepPass = "Staff123#";
    const recepName = "Sarah Jenkins (Front Desk)";

    const existingRecep = await User.findOne({ email: recepEmail });
    if (!existingRecep) {
      const hashRecepPass = await bcrypt.hash(recepPass, 10);
      await User.create({
        fullname: recepName,
        email: recepEmail,
        password: hashRecepPass,
        role: "receptionist",
        approvalStatus: "approved",
        specialization: "Clinical Operations",
        phone: "+91 98765 11223",
        workingDays: "Mon - Sat",
        workingHours: "08:00 AM - 04:00 PM",
      });
      console.log(`[Seed] Sample Receptionist initialized: ${recepEmail}`);
    } else {
      existingRecep.role = "receptionist";
      existingRecep.approvalStatus = "approved";
      existingRecep.password = await bcrypt.hash(recepPass, 10);
      await existingRecep.save();
      console.log(`[Seed] Sample Receptionist verified & synced: ${recepEmail}`);
    }

    // 4. Seed Hospital Departments if empty
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const defaultDepartments = [
        { name: "Cardiology", code: "CARD", icon: "fa-heartbeat", description: "Comprehensive cardiovascular diagnostics, ECG, echocardiography, and hypertension clinics.", headDoctor: "Dr. Rajesh Sharma", floor: "Wing A, 2nd Floor" },
        { name: "Dermatology", code: "DERM", icon: "fa-allergies", description: "Clinical skin evaluations, allergy management, and medical dermatological therapies.", headDoctor: "Dr. Priya Mehta", floor: "Wing B, 1st Floor" },
        { name: "General Medicine", code: "GENMED", icon: "fa-user-md", description: "Primary healthcare, preventive evaluations, infection control, and routine outpatient consultations.", headDoctor: "Dr. Amit Verma", floor: "Outpatient Block, Ground Floor" },
        { name: "Pediatrics", code: "PED", icon: "fa-baby", description: "Child wellness, developmental screenings, pediatric infectious disease management.", headDoctor: "Dr. Neha Kapoor", floor: "Wing C, 1st Floor" },
        { name: "Neurology", code: "NEUR", icon: "fa-brain", description: "Neurological evaluations, headache disorders, stroke prevention, and neurological rehabilitation.", headDoctor: "Dr. Rahul Singh", floor: "Wing A, 3rd Floor" },
        { name: "Orthopedics", code: "ORTH", icon: "fa-bone", description: "Musculoskeletal trauma, arthritis management, joint care, and physical mobility support.", headDoctor: "Dr. K. Malhotra", floor: "Wing B, Ground Floor" },
        { name: "Gynecology & Obstetrics", code: "OBGYN", icon: "fa-female", description: "Maternal care, women's health wellness, prenatal screenings, and reproductive health.", headDoctor: "Dr. Sunita Rao", floor: "Maternity Block, 2nd Floor" },
        { name: "ENT (Otolaryngology)", code: "ENT", icon: "fa-head-side-cough", description: "Ear, nose, throat diagnostics, audiology screening, and sinus disease clinics.", headDoctor: "Dr. V. Nair", floor: "Wing C, 2nd Floor" },
      ];
      await Department.insertMany(defaultDepartments);
      console.log("[Seed] Standard Hospital Departments seeded.");
    }

    // 5. Seed initial Audit Log if empty
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      await AuditLog.create({
        action: "System Initialization",
        category: "SYSTEM",
        actorName: "System Core",
        actorRole: "system",
        target: "CareSync Multispecialty Portal",
        details: "Clinical database initialized with active medical faculty, departments, and security policies.",
      });
    }

    console.log("[Seed] Environment, staff credentials & departments synchronization complete.");
  } catch (err) {
    console.error("[Seed] Error verifying system users:", err.message);
  }
};
