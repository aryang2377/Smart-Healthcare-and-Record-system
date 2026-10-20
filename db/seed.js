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
    } else {
      const isMatch = await bcrypt.compare(adminPass, existingAdmin.password);
      if (!isMatch) {
        existingAdmin.password = await bcrypt.hash(adminPass, 10);
        existingAdmin.role = "admin";
        await existingAdmin.save();
      }
    }

    // 2. Seed or sync Verified Medical Specialists across all major departments
    const defaultDoctors = [
      {
        fullname: "Dr. Rajesh Sharma",
        email: "doctor@caresync.health",
        password: "Cardio#Sharma26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Cardiology",
        qualifications: "MBBS, MD (Cardiology), FACC",
        experience: "14",
        consultationFee: 800,
        licenseNumber: "MCI-CARD-2024-8849",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43210",
        workingDays: "Mon - Fri",
        workingHours: "09:00 AM - 02:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Priya Mehta",
        email: "dr.priya@caresync.health",
        password: "Derma#Mehta26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Dermatology",
        qualifications: "MBBS, MD (Dermatology & Venereology)",
        experience: "10",
        consultationFee: 600,
        licenseNumber: "MCI-DERM-2023-4102",
        registrationAuthority: "Delhi Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43211",
        workingDays: "Mon - Sat",
        workingHours: "10:00 AM - 04:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Amit Verma",
        email: "dr.verma@caresync.health",
        password: "GenMed#Verma26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "General Medicine",
        qualifications: "MBBS, MD (Internal Medicine)",
        experience: "15",
        consultationFee: 500,
        licenseNumber: "MCI-GENMED-2022-1984",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43212",
        workingDays: "Mon - Sat",
        workingHours: "08:30 AM - 03:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Neha Kapoor",
        email: "dr.kapoor@caresync.health",
        password: "Pedia#Kapoor26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Pediatrics",
        qualifications: "MBBS, MD (Pediatrics), DCH",
        experience: "9",
        consultationFee: 650,
        licenseNumber: "MCI-PED-2024-6721",
        registrationAuthority: "Maharashtra Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43213",
        workingDays: "Mon - Fri",
        workingHours: "09:30 AM - 02:30 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Rahul Singh",
        email: "dr.singh@caresync.health",
        password: "Neuro#Singh26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Neurology",
        qualifications: "MBBS, DM (Neurology)",
        experience: "12",
        consultationFee: 900,
        licenseNumber: "MCI-NEUR-2021-3310",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43214",
        workingDays: "Mon - Thu",
        workingHours: "10:00 AM - 03:30 PM",
        appointmentDuration: "30 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Karan Malhotra",
        email: "dr.malhotra@caresync.health",
        password: "Ortho#Malhotra26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Orthopedics",
        qualifications: "MBBS, MS (Orthopedic Surgery), MCh",
        experience: "16",
        consultationFee: 750,
        licenseNumber: "MCI-ORTH-2020-5542",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43215",
        workingDays: "Mon - Sat",
        workingHours: "09:00 AM - 02:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Ananya Gupta",
        email: "dr.ananya@caresync.health",
        password: "Gynec#Gupta26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Gynecology",
        qualifications: "MBBS, MS (Obstetrics & Gynecology), DGO",
        experience: "11",
        consultationFee: 700,
        licenseNumber: "MCI-GYN-2023-7891",
        registrationAuthority: "Delhi Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43216",
        workingDays: "Mon - Fri",
        workingHours: "10:00 AM - 04:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Vikram Nair",
        email: "dr.nair@caresync.health",
        password: "Ent#Nair26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "ENT",
        qualifications: "MBBS, MS (ENT / Otorhinolaryngology)",
        experience: "13",
        consultationFee: 600,
        licenseNumber: "MCI-ENT-2022-9012",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43217",
        workingDays: "Mon - Sat",
        workingHours: "11:00 AM - 05:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Alok Bansal",
        email: "dr.bansal@caresync.health",
        password: "Gastro#Bansal26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Gastroenterology",
        qualifications: "MBBS, MD (Medicine), DM (Gastroenterology)",
        experience: "14",
        consultationFee: 850,
        licenseNumber: "MCI-GASTRO-2021-4478",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43218",
        workingDays: "Mon - Fri",
        workingHours: "09:00 AM - 03:00 PM",
        appointmentDuration: "25 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Ritu Saxena",
        email: "dr.saxena@caresync.health",
        password: "Pulmo#Saxena26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Pulmonology",
        qualifications: "MBBS, MD (Pulmonary Medicine), FCCP",
        experience: "12",
        consultationFee: 750,
        licenseNumber: "MCI-PULM-2023-2289",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43219",
        workingDays: "Mon - Fri",
        workingHours: "10:00 AM - 04:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Sameer Joshi",
        email: "dr.joshi@caresync.health",
        password: "Psych#Joshi26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Psychiatry",
        qualifications: "MBBS, MD (Psychiatry), DPM",
        experience: "10",
        consultationFee: 800,
        licenseNumber: "MCI-PSYCH-2024-1134",
        registrationAuthority: "National Medical Commission",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43220",
        workingDays: "Mon - Sat",
        workingHours: "12:00 PM - 06:00 PM",
        appointmentDuration: "30 mins",
        breaks: "02:00 PM - 03:00 PM",
      },
      {
        fullname: "Dr. Meenakshi Sundaram",
        email: "dr.sundaram@caresync.health",
        password: "Eye#Sundaram26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Ophthalmology",
        qualifications: "MBBS, MS (Ophthalmology), FICO",
        experience: "15",
        consultationFee: 650,
        licenseNumber: "MCI-OPHTH-2020-6677",
        registrationAuthority: "Tamil Nadu Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43221",
        workingDays: "Mon - Sat",
        workingHours: "09:00 AM - 02:00 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Sanjay Deshmukh",
        email: "dr.deshmukh@caresync.health",
        password: "Endo#Deshmukh26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Endocrinology",
        qualifications: "MBBS, MD (Medicine), DM (Endocrinology)",
        experience: "13",
        consultationFee: 850,
        licenseNumber: "MCI-ENDO-2022-8820",
        registrationAuthority: "Maharashtra Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43222",
        workingDays: "Tue - Sat",
        workingHours: "10:00 AM - 03:30 PM",
        appointmentDuration: "20 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
      {
        fullname: "Dr. Deepak Aggarwal",
        email: "dr.aggarwal@caresync.health",
        password: "Uro#Aggarwal26",
        role: "doctor",
        approvalStatus: "approved",
        isActive: true,
        specialization: "Urology",
        qualifications: "MBBS, MS (Surgery), MCh (Urology)",
        experience: "16",
        consultationFee: 900,
        licenseNumber: "MCI-UROL-2021-3901",
        registrationAuthority: "Delhi Medical Council",
        currentHospital: "CareSync Multispecialty Center",
        phone: "+91 98765 43223",
        workingDays: "Mon - Fri",
        workingHours: "09:30 AM - 03:30 PM",
        appointmentDuration: "25 mins",
        breaks: "01:00 PM - 02:00 PM",
      },
    ];

    for (const docData of defaultDoctors) {
      const existingDoc = await User.findOne({
        $or: [
          { email: docData.email },
          { fullname: docData.fullname }
        ]
      });

      if (!existingDoc) {
        const hashDocPass = await bcrypt.hash(docData.password, 10);
        await User.create({
          ...docData,
          password: hashDocPass,
        });
      } else {
        existingDoc.approvalStatus = "approved";
        existingDoc.role = "doctor";
        existingDoc.isActive = true;
        existingDoc.password = await bcrypt.hash(docData.password, 10);
        existingDoc.specialization = docData.specialization;
        existingDoc.consultationFee = docData.consultationFee;
        existingDoc.qualifications = docData.qualifications;
        existingDoc.workingDays = docData.workingDays;
        existingDoc.workingHours = docData.workingHours;
        existingDoc.experience = docData.experience;
        await existingDoc.save();
      }

      // Strictly enforce ONE doctor per specialization (cleanup any extraneous duplicates)
      await User.deleteMany({
        role: "doctor",
        specialization: docData.specialization,
        email: { $ne: docData.email },
      });
    }

    // 3. Seed or sync 2 Front-Desk Receptionists with distinct credentials
    const defaultReceptionists = [
      {
        fullname: "Sarah Jenkins (Front Desk)",
        email: "receptionist@caresync.health",
        password: "Staff#Sarah26",
        role: "receptionist",
        approvalStatus: "approved",
        specialization: "Clinical Admissions & Check-in",
        phone: "+91 98765 11223",
        workingDays: "Mon - Sat",
        workingHours: "08:00 AM - 03:00 PM",
      },
      {
        fullname: "David Miller (Front Desk)",
        email: "reception@caresync.health",
        password: "Staff#David26",
        role: "receptionist",
        approvalStatus: "approved",
        specialization: "Outpatient Queue & Triage Desk",
        phone: "+91 98666 77788",
        workingDays: "Mon - Sat",
        workingHours: "02:00 PM - 09:00 PM",
      },
    ];

    for (const recepData of defaultReceptionists) {
      const existingRecep = await User.findOne({
        $or: [
          { email: recepData.email },
          { fullname: recepData.fullname }
        ]
      });

      if (!existingRecep) {
        const hashRecepPass = await bcrypt.hash(recepData.password, 10);
        await User.create({
          ...recepData,
          password: hashRecepPass,
        });
      } else {
        existingRecep.role = "receptionist";
        existingRecep.approvalStatus = "approved";
        existingRecep.password = await bcrypt.hash(recepData.password, 10);
        existingRecep.specialization = recepData.specialization;
        existingRecep.workingHours = recepData.workingHours;
        await existingRecep.save();
      }
    }

    // 4. Ensure single demo patient John Doe is active and clean
    const johnEmail = "john@gmail.com";
    const existingJohn = await User.findOne({ email: johnEmail });
    if (!existingJohn) {
      const hashJohn = await bcrypt.hash("john12", 10);
      await User.create({
        fullname: "John Doe",
        email: johnEmail,
        password: hashJohn,
        role: "patient",
        phone: "+91 98765 00001",
      });
    } else {
      existingJohn.role = "patient";
      existingJohn.password = await bcrypt.hash("john12", 10);
      await existingJohn.save();
    }

    // 4. Seed or sync Hospital Departments across all clinical specialties
    const defaultDepartments = [
      { name: "Cardiology", code: "CARD", icon: "fa-heartbeat", description: "Comprehensive cardiovascular diagnostics, ECG, echocardiography, and hypertension clinics.", headDoctor: "Dr. Rajesh Sharma", floor: "Wing A, 2nd Floor" },
      { name: "Dermatology", code: "DERM", icon: "fa-allergies", description: "Clinical skin evaluations, allergy management, and medical dermatological therapies.", headDoctor: "Dr. Priya Mehta", floor: "Wing B, 1st Floor" },
      { name: "General Medicine", code: "GENMED", icon: "fa-user-md", description: "Primary healthcare, preventive evaluations, infection control, and routine outpatient consultations.", headDoctor: "Dr. Amit Verma", floor: "Outpatient Block, Ground Floor" },
      { name: "Pediatrics", code: "PED", icon: "fa-baby", description: "Child wellness, developmental screenings, pediatric infectious disease management.", headDoctor: "Dr. Neha Kapoor", floor: "Wing C, 1st Floor" },
      { name: "Neurology", code: "NEUR", icon: "fa-brain", description: "Neurological evaluations, headache disorders, stroke prevention, and neurological rehabilitation.", headDoctor: "Dr. Rahul Singh", floor: "Wing A, 3rd Floor" },
      { name: "Orthopedics", code: "ORTH", icon: "fa-bone", description: "Musculoskeletal trauma, arthritis management, joint care, and physical mobility support.", headDoctor: "Dr. Karan Malhotra", floor: "Wing B, Ground Floor" },
      { name: "Gynecology & Obstetrics", code: "OBGYN", icon: "fa-female", description: "Maternal care, women's health wellness, prenatal screenings, and reproductive health.", headDoctor: "Dr. Ananya Gupta", floor: "Maternity Block, 2nd Floor" },
      { name: "ENT (Otolaryngology)", code: "ENT", icon: "fa-head-side-cough", description: "Ear, nose, throat diagnostics, audiology screening, and sinus disease clinics.", headDoctor: "Dr. Vikram Nair", floor: "Wing C, 2nd Floor" },
      { name: "Gastroenterology", code: "GASTRO", icon: "fa-stethoscope", description: "Digestive health, liver disorders, endoscopy, acid peptic diseases, and colon wellness.", headDoctor: "Dr. Alok Bansal", floor: "Wing D, 1st Floor" },
      { name: "Pulmonology", code: "PULM", icon: "fa-lungs", description: "Respiratory health, asthma management, COPD therapies, and pulmonary function testing.", headDoctor: "Dr. Ritu Saxena", floor: "Wing D, 2nd Floor" },
      { name: "Psychiatry", code: "PSYCH", icon: "fa-brain", description: "Behavioral health, anxiety management, mood disorders, and psychiatric counseling.", headDoctor: "Dr. Sameer Joshi", floor: "Wing E, 3rd Floor" },
      { name: "Ophthalmology", code: "OPHTH", icon: "fa-eye", description: "Comprehensive vision testing, retinal evaluation, corneal health, and ocular medicine.", headDoctor: "Dr. Meenakshi Sundaram", floor: "Wing A, Ground Floor" },
      { name: "Endocrinology", code: "ENDO", icon: "fa-dna", description: "Diabetology, thyroid dysfunctions, endocrine hormone balance, and metabolic health.", headDoctor: "Dr. Sanjay Deshmukh", floor: "Wing B, 2nd Floor" },
      { name: "Urology", code: "UROL", icon: "fa-droplet", description: "Urinary system disorders, renal calculi evaluation, prostate clinics, and bladder health.", headDoctor: "Dr. Deepak Aggarwal", floor: "Wing C, Ground Floor" },
    ];

    for (const dept of defaultDepartments) {
      const existingDept = await Department.findOne({ code: dept.code });
      if (!existingDept) {
        await Department.create(dept);
      } else {
        existingDept.name = dept.name;
        existingDept.headDoctor = dept.headDoctor;
        existingDept.description = dept.description;
        existingDept.floor = dept.floor;
        await existingDept.save();
      }
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
  } catch (err) {
    console.error("[Seed] Error verifying system users:", err.message);
  }
};
