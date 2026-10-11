import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import ejsMate from "ejs-mate";
import connectDB from "./db/sample.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";

import User from "./models/user.js";
import Appointment from "./models/appointment.js";
import Report from "./models/Report.js";
import Notification from "./models/Notification.js";
import Prescription from "./models/Prescription.js";
import AuditLog from "./models/AuditLog.js";
import Department from "./models/Department.js";
import { seedDefaultUsers } from "./db/seed.js";

dotenv.config({
  path: "./.env",
});

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parsers & static assets
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Ensure private upload directories exist
const uploadDir = path.join(__dirname, "public", "uploads", "reports");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const doctorUploadDir = path.join(__dirname, "public", "uploads", "doctor_docs");
if (!fs.existsSync(doctorUploadDir)) {
  fs.mkdirSync(doctorUploadDir, { recursive: true });
}

// Multer Storages
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${uniqueSuffix}-${cleanName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const doctorDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, doctorUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${uniqueSuffix}-${cleanName}`);
  },
});
const doctorUpload = multer({ storage: doctorDocStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// Audit Logging Utility
const logAudit = async (action, category, actor, target, details, req) => {
  try {
    const ip = req ? (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1") : "127.0.0.1";
    await AuditLog.create({
      action,
      category: category || "SYSTEM",
      actorId: actor?._id,
      actorName: actor?.fullname || "System",
      actorRole: actor?.role || "system",
      target: target || "",
      details: details || "",
      ipAddress: typeof ip === "string" ? ip.split(",")[0].trim() : "127.0.0.1",
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// Global Current User Middleware for Views & Requests
app.use(async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      req.user = user || null;
      res.locals.currentUser = user || null;
    } else {
      req.user = null;
      res.locals.currentUser = null;
    }
  } catch (err) {
    req.user = null;
    res.locals.currentUser = null;
  }
  next();
});

// Authentication & Role-Based Middlewares
const isLoggedIn = async (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
};

const isStaffLoggedIn = async (req, res, next) => {
  if (!req.user || (req.user.role !== "doctor" && req.user.role !== "receptionist" && req.user.role !== "admin")) {
    return res.redirect("/staff/login");
  }

  // Doctors must be approved by hospital administration
  if (req.user.role === "doctor" && req.user.approvalStatus !== "approved") {
    res.clearCookie("token");
    return res.redirect("/staff/login");
  }

  if (req.user.isActive === false) {
    res.clearCookie("token");
    return res.render("users/staff-login", {
      error: "Your staff account has been deactivated. Please contact hospital administration.",
    });
  }

  next();
};

const isDoctorOnly = async (req, res, next) => {
  if (!req.user || ((req.user.role !== "doctor" || req.user.approvalStatus !== "approved") && req.user.role !== "admin")) {
    return res.status(403).render("error", {
      message: "Access Denied: Clinical prescription and consultation actions are restricted to licensed physicians.",
    });
  }
  next();
};

const isAdminLoggedIn = async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.redirect("/admin/login");
  }
  next();
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

app.get("/", (req, res) => {
  res.render("listings/home");
});

// Only verified and active doctors appear on public directory
app.get("/doctors", async (req, res) => {
  try {
    const dbDoctors = await User.find({
      role: "doctor",
      approvalStatus: "approved",
      isActive: { $ne: false },
    }).select("fullname specialization phone email consultationFee workingDays workingHours experience");
    res.render("listings/find doctors", { dbDoctors });
  } catch (err) {
    res.render("listings/find doctors", { dbDoctors: [] });
  }
});

// Symptom Checker: KEEP UNCHANGED
app.get("/symptom", (req, res) => {
  res.render("listings/symptom");
});

// Medical records privacy protection
app.get("/reports", (req, res) => {
  if (!res.locals.currentUser) {
    return res.redirect("/login");
  }
  if (res.locals.currentUser.role === "doctor" || res.locals.currentUser.role === "receptionist") {
    return res.redirect("/staff?tab=upload");
  }
  if (res.locals.currentUser.role === "admin") {
    return res.redirect("/admin");
  }
  return res.redirect("/dashboard?tab=reports");
});

app.get("/appointment", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/forgot", (req, res) => {
  res.render("users/forgot");
});

// ==========================================
// 1. PATIENT AUTHENTICATION ROUTES
// ==========================================

app.get("/login", (req, res) => {
  if (res.locals.currentUser) {
    if (res.locals.currentUser.role === "admin") return res.redirect("/admin");
    if (res.locals.currentUser.role === "doctor" || res.locals.currentUser.role === "receptionist") return res.redirect("/staff");
    return res.redirect("/dashboard");
  }
  res.render("users/login", { error: null });
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).render("users/login", {
        error: "Invalid email address or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("users/login", {
        error: "Invalid email address or password.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit("User Sign In", "AUTH", user, user.email, "Logged in successfully", req);

    if (user.role === "admin") {
      return res.redirect("/admin");
    } else if (user.role === "doctor" || user.role === "receptionist") {
      return res.redirect("/staff");
    } else {
      return res.redirect("/dashboard");
    }
  } catch (err) {
    next(err);
  }
});

app.get("/register", (req, res) => {
  if (res.locals.currentUser) {
    return res.redirect("/dashboard");
  }
  res.render("users/register", { error: null });
});

app.post("/register", async (req, res, next) => {
  try {
    const { fullname, email, password, confirmPassword } = req.body;

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).render("users/register", {
        error: "Password and Confirm Password do not match.",
      });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).render("users/register", {
        error: "This email address is already registered. Please sign in.",
      });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullname: fullname ? fullname.trim() : "Patient",
      email: cleanEmail,
      password: hashPass,
      role: "patient",
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit("Patient Registered", "AUTH", newUser, newUser.email, "New patient account created", req);

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

app.get("/logout", async (req, res) => {
  if (req.user) {
    await logAudit("User Sign Out", "AUTH", req.user, req.user.email, "Signed out of portal", req);
  }
  res.clearCookie("token");
  res.redirect("/");
});

// ==========================================
// 2. UNIFIED HEALTHCARE STAFF PORTAL ROUTES (/staff & /staff/login)
// ==========================================

// Staff Login View (Both Doctors and Receptionists)
app.get("/staff/login", (req, res) => {
  if (res.locals.currentUser && (res.locals.currentUser.role === "doctor" || res.locals.currentUser.role === "receptionist")) {
    if (res.locals.currentUser.role === "doctor" && res.locals.currentUser.approvalStatus !== "approved") {
      res.clearCookie("token");
      return res.render("users/staff-login", {
        error: "Your doctor application is currently pending verification or not approved.",
      });
    }
    return res.redirect("/staff");
  }
  res.render("users/staff-login", { error: null });
});

// Backward-compatibility redirect from /doctor/login to /staff/login
app.get("/doctor/login", (req, res) => {
  res.redirect("/staff/login");
});

app.post(["/staff/login", "/doctor/login"], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).render("users/staff-login", {
        error: "No healthcare staff account found with this institutional email.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("users/staff-login", {
        error: "Invalid email address or security password.",
      });
    }

    if (user.role !== "doctor" && user.role !== "receptionist" && user.role !== "admin") {
      return res.status(403).render("users/staff-login", {
        error: "This is a Patient account. Please log in through Patient Sign In.",
      });
    }

    // Check doctor verification lifecycle
    if (user.role === "doctor") {
      if (user.approvalStatus === "pending") {
        return res.status(403).render("users/staff-login", {
          error: "Your medical application is currently PENDING institutional verification. Hospital administration will review your credentials shortly.",
        });
      }
      if (user.approvalStatus === "needs_info") {
        return res.status(403).render("users/staff-login", {
          error: `Action Required: Hospital administration has requested additional information: "${user.adminNotes || "Please review your verification documents"}". Please contact administration or update your details.`,
        });
      }
      if (user.approvalStatus === "rejected") {
        return res.status(403).render("users/staff-login", {
          error: `Your doctor application was rejected during verification. Admin notes: "${user.adminNotes || "Credentials could not be verified."}"`,
        });
      }
    }

    if (user.isActive === false) {
      return res.status(403).render("users/staff-login", {
        error: "Your staff account has been deactivated. Please contact hospital administration.",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit("Staff Sign In", "AUTH", user, user.email, `Logged into ${user.role.toUpperCase()} Console`, req);

    if (user.role === "admin") {
      return res.redirect("/admin");
    }
    res.redirect("/staff");
  } catch (err) {
    next(err);
  }
});

app.get(["/staff/logout", "/doctor/logout"], (req, res) => {
  res.clearCookie("token");
  res.redirect("/staff/login");
});

// Doctor Multi-Step Onboarding Application (/doctor/apply & /staff/apply)
app.get(["/doctor/apply", "/staff/apply"], (req, res) => {
  res.render("users/doctor-apply", { error: null });
});

app.get(["/doctor/register", "/doctor/signup", "/staff/register", "/staff/signup"], (req, res) => {
  res.redirect("/doctor/apply");
});

app.post(
  ["/doctor/apply", "/staff/apply"],
  doctorUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
    { name: "degreeDoc", maxCount: 1 },
    { name: "idDoc", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const {
        fullname,
        dob,
        gender,
        email,
        phone,
        address,
        specialization,
        qualifications,
        experience,
        consultationFee,
        licenseNumber,
        registrationAuthority,
        currentHospital,
        bio,
        workingDays,
        workingHours,
        appointmentDuration,
        breaks,
        password,
        confirmPassword,
      } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).render("users/doctor-apply", {
          error: "Password and Confirm Password do not match.",
        });
      }

      const cleanEmail = email ? email.trim().toLowerCase() : "";
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).render("users/doctor-apply", {
          error: "An account with this email address already exists. Please login or use another email.",
        });
      }

      const hashPass = await bcrypt.hash(password, 10);

      const files = req.files || {};
      const profilePhoto = files.profilePhoto ? `/uploads/doctor_docs/${files.profilePhoto[0].filename}` : "";
      const licenseDoc = files.licenseDoc ? `/uploads/doctor_docs/${files.licenseDoc[0].filename}` : "";
      const degreeDoc = files.degreeDoc ? `/uploads/doctor_docs/${files.degreeDoc[0].filename}` : "";
      const idDoc = files.idDoc ? `/uploads/doctor_docs/${files.idDoc[0].filename}` : "";

      const formattedName = fullname.trim().startsWith("Dr.") ? fullname.trim() : `Dr. ${fullname.trim()}`;

      const newDoctor = await User.create({
        fullname: formattedName,
        email: cleanEmail,
        password: hashPass,
        role: "doctor",
        approvalStatus: "pending",
        isActive: true,
        dob: dob || "",
        gender: gender || "",
        phone: phone || "",
        profilePhoto,
        address: address || "",
        specialization: specialization || "General Medicine",
        qualifications: qualifications || "MBBS",
        experience: experience || "0",
        consultationFee: Number(consultationFee) || 500,
        licenseNumber: licenseNumber || "MCI-PENDING",
        registrationAuthority: registrationAuthority || "National Medical Commission",
        currentHospital: currentHospital || "CareSync Clinical Center",
        bio: bio || "",
        licenseDoc,
        degreeDoc,
        idDoc,
        workingDays: workingDays || "Mon - Fri",
        workingHours: workingHours || "09:00 AM - 02:00 PM",
        appointmentDuration: appointmentDuration || "20 mins",
        breaks: breaks || "01:00 PM - 02:00 PM",
      });

      await logAudit(
        "Doctor Application Submitted",
        "VERIFICATION",
        newDoctor,
        newDoctor.fullname,
        `Application submitted for ${newDoctor.specialization} faculty review`,
        req
      );

      res.render("users/doctor-pending", { doctor: newDoctor });
    } catch (err) {
      next(err);
    }
  }
);

// Unified Staff Dashboard (/staff with backward-compatible /doctor)
app.get("/doctor", (req, res) => {
  const query = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(`/staff${query}`);
});

app.get("/staff", isStaffLoggedIn, async (req, res) => {
  try {
    let appointmentFilter = {};
    let rxFilter = {};
    let reportFilter = {};

    if (req.user.role === "doctor") {
      appointmentFilter = {
        $or: [{ doctorId: req.user._id }, { doctorName: req.user.fullname }],
      };
      rxFilter = { doctorId: req.user._id };
      reportFilter = {
        $or: [{ doctorId: req.user._id }, { uploadedByRole: "doctor" }],
      };
    }

    const allAppointments = await Appointment.find(appointmentFilter).sort({ date: 1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayQueue = allAppointments.filter(
      (a) => new Date(a.date) >= todayStart && new Date(a.date) <= todayEnd
    );

    const completedConsultations = allAppointments.filter(
      (a) => a.status === "Completed"
    );

    const patientRoster = await User.find({ role: "patient" }).select(
      "fullname email phone createdAt"
    );

    const doctorReports = await Report.find(reportFilter).sort({ createdAt: -1 });
    const doctorPrescriptions = await Prescription.find(rxFilter).sort({ createdAt: -1 });

    const activeDoctors = await User.find({
      role: "doctor",
      approvalStatus: "approved",
      isActive: { $ne: false },
    }).select("fullname specialization consultationFee");

    res.render("listings/doctor-dashboard", {
      allAppointments,
      todayQueue,
      completedConsultations,
      patientRoster,
      doctorReports,
      doctorPrescriptions,
      activeDoctors,
      activeTab: req.query.tab || "queue",
    });
  } catch (err) {
    console.error("Staff Dashboard Error:", err);
    res.render("listings/doctor-dashboard", {
      allAppointments: [],
      todayQueue: [],
      completedConsultations: [],
      patientRoster: [],
      doctorReports: [],
      doctorPrescriptions: [],
      activeDoctors: [],
      activeTab: "queue",
    });
  }
});

// Update appointment status: Check-In, In-Consultation, Complete, Cancel, No-Show
app.post(["/staff/appointments/:id/status", "/doctor/appointments/:id/status"], isStaffLoggedIn, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appt = await Appointment.findById(req.params.id);

    if (appt) {
      // Permission check: only doctors can conduct and conclude consultations
      if ((status === "In-Consultation" || status === "Completed") && req.user.role !== "doctor" && req.user.role !== "admin") {
        return res.status(403).render("error", {
          message: "Only attending doctors have authority to start and conclude clinical consultations.",
        });
      }

      if (status) {
        appt.status = status;
        if (status === "Checked-In") appt.checkedInAt = new Date();
        if (status === "In-Consultation") appt.inConsultationAt = new Date();
        if (status === "Completed") {
          appt.completedAt = new Date();
          if (notes) appt.consultationNotes = notes.trim();
        }
      }
      if (notes) appt.notes = notes.trim();
      await appt.save();

      // Dispatch patient notification
      if (appt.patientId) {
        let msg = `Your appointment status was updated to: ${status}.`;
        if (status === "Checked-In") msg = `You have been checked in by reception. Please wait in the outpatient lounge.`;
        if (status === "In-Consultation") msg = `Dr. ${appt.doctorName} is ready to see you. Please proceed to the consultation room.`;
        if (status === "Completed") msg = `Your consultation with Dr. ${appt.doctorName} is complete. Your records are updated.`;
        await Notification.create({
          userId: appt.patientId,
          message: msg,
          type: "checkin",
        });
      }

      await logAudit(
        `Appointment ${status}`,
        "APPOINTMENT",
        req.user,
        appt.patientName,
        `Status updated to ${status} for appointment with ${appt.doctorName}`,
        req
      );
    }
    res.redirect("/staff?tab=queue");
  } catch (err) {
    console.error("Status update error:", err);
    res.redirect("/staff?tab=queue");
  }
});

// Issue Doctor-Authorized Lab Report
app.post(["/staff/reports/upload", "/doctor/reports/upload"], isStaffLoggedIn, upload.single("reportFile"), async (req, res) => {
  try {
    const { patientId, title, category, notes } = req.body;
    const patientObj = await User.findById(patientId);

    const fileUrl = req.file ? `/uploads/reports/${req.file.filename}` : "";
    const fileName = req.file ? req.file.originalname : "Diagnostic Document";
    const fileSize = req.file ? `${(req.file.size / 1024).toFixed(1)} KB` : "";

    await Report.create({
      patientId: patientObj ? patientObj._id : req.user._id,
      patientName: patientObj ? patientObj.fullname : "Hospital Patient",
      doctorId: req.user._id,
      doctorName: req.user.fullname,
      title: title || "Diagnostic Evaluation",
      category: category || "Lab Report",
      fileUrl,
      fileName,
      fileSize,
      notes: notes || "",
      uploadedByRole: req.user.role,
    });

    if (patientObj) {
      await Notification.create({
        userId: patientObj._id,
        message: `${req.user.fullname} issued a new ${category}: "${title}". Review in your Medical Records.`,
        type: "report",
      });
    }

    await logAudit(
      "Diagnostic Report Uploaded",
      "CONSULTATION",
      req.user,
      patientObj ? patientObj.fullname : "Patient",
      `Uploaded ${category}: "${title}"`,
      req
    );

    res.redirect("/staff?tab=upload");
  } catch (err) {
    console.error("Report upload error:", err);
    res.redirect("/staff?tab=upload");
  }
});

// Doctor Create & Send Digital Prescription directly to Patient (DOCTOR ONLY)
app.post(["/staff/prescriptions/create", "/doctor/prescriptions/create"], isDoctorOnly, async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientAge,
      patientGender,
      problem,
      diagnosis,
      medicines,
      advice,
      testsRecommended,
      followUp,
    } = req.body;

    let patientObj = null;
    if (patientId) {
      patientObj = await User.findById(patientId);
    } else if (patientName && patientName.trim()) {
      const cleanPatName = patientName.trim();
      patientObj = await User.findOne({
        fullname: { $regex: new RegExp(`^${cleanPatName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        role: "patient",
      });
    }

    const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRx = await Prescription.create({
      rxNumber,
      patientId: patientObj ? patientObj._id : undefined,
      patientName: (patientName && patientName.trim()) || (patientObj ? patientObj.fullname : "Patient"),
      patientEmail: patientObj ? patientObj.email : "",
      patientAge: patientAge ? Number(patientAge) : (patientObj ? patientObj.age : undefined),
      patientGender: patientGender || (patientObj ? patientObj.gender : ""),
      doctorId: req.user._id,
      doctorName: req.user.fullname,
      doctorSpecialization: req.user.specialization || "Clinical Medicine",
      doctorPhone: req.user.phone || "",
      problem: problem ? problem.trim() : "Routine consultation complaints",
      diagnosis: diagnosis ? diagnosis.trim() : "Clinical Evaluation",
      medicines: medicines ? medicines.trim() : "Medications as advised",
      advice: advice ? advice.trim() : "",
      testsRecommended: testsRecommended ? testsRecommended.trim() : "",
      followUp: followUp ? followUp.trim() : "Review after 5 days",
      status: "Sent to Patient",
    });

    // Create linked Report for EHR vault
    await Report.create({
      patientId: patientObj ? patientObj._id : req.user._id,
      patientName: (patientName && patientName.trim()) || (patientObj ? patientObj.fullname : "Patient"),
      doctorId: req.user._id,
      doctorName: req.user.fullname,
      title: `Digital Rx: ${diagnosis ? diagnosis.trim() : "Prescription"}`,
      category: "Prescription",
      fileUrl: `/prescriptions/${newRx._id}`,
      fileName: `${rxNumber}.pdf`,
      notes: `Problem: ${problem ? problem.trim() : ""}. Rx: ${medicines ? medicines.trim() : ""}`,
      uploadedByRole: "doctor",
    });

    // Dispatch real-time in-app notification
    if (patientObj) {
      await Notification.create({
        userId: patientObj._id,
        message: `Dr. ${req.user.fullname} issued and dispatched digital prescription "${diagnosis}". Check Prescriptions tab.`,
        type: "report",
      });
    }

    await logAudit(
      "Prescription Dispatched",
      "PRESCRIPTION",
      req.user,
      newRx.patientName,
      `Issued Rx #${rxNumber} for ${newRx.diagnosis}`,
      req
    );

    res.redirect("/staff?tab=prescription");
  } catch (err) {
    console.error("Prescription creation error:", err);
    res.redirect("/staff?tab=prescription");
  }
});

// Doctor Availability Update
app.post("/staff/availability/update", isDoctorOnly, async (req, res) => {
  try {
    const { workingDays, workingHours, appointmentDuration, consultationFee, breaks } = req.body;
    const doc = await User.findById(req.user._id);

    if (doc) {
      if (workingDays) doc.workingDays = workingDays;
      if (workingHours) doc.workingHours = workingHours;
      if (appointmentDuration) doc.appointmentDuration = appointmentDuration;
      if (consultationFee) doc.consultationFee = Number(consultationFee);
      if (breaks) doc.breaks = breaks;
      await doc.save();

      await logAudit("Availability Updated", "STAFF", req.user, doc.fullname, `Updated hours: ${doc.workingHours}, Fee: ₹${doc.consultationFee}`, req);
    }
    res.redirect("/staff?tab=availability");
  } catch (err) {
    console.error("Availability update error:", err);
    res.redirect("/staff?tab=availability");
  }
});

// View & Print Official Digital Prescription
app.get("/prescriptions/:id", async (req, res) => {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) {
      return res.status(404).render("error", {
        message: "Prescription record not found.",
      });
    }
    res.render("listings/prescription-view", { rx });
  } catch (err) {
    res.status(404).render("error", {
      message: "Unable to load prescription.",
    });
  }
});

// ==========================================
// 3. PATIENT DASHBOARD & APPOINTMENTS (/dashboard)
// ==========================================

app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.redirect("/admin");
    }
    if (req.user.role === "doctor" || req.user.role === "receptionist") {
      return res.redirect("/staff");
    }

    const patientAppointments = await Appointment.find({
      $or: [{ patientId: req.user._id }, { patientName: req.user.fullname }],
    }).sort({ date: -1 });

    const patientReports = await Report.find({
      $or: [{ patientId: req.user._id }, { patientName: req.user.fullname }],
    }).sort({ createdAt: -1 });

    const patientPrescriptions = await Prescription.find({
      $or: [{ patientId: req.user._id }, { patientName: req.user.fullname }],
    }).sort({ createdAt: -1 });

    const prescriptions = patientReports.filter(
      (r) => r.category === "Prescription"
    );

    const availableDoctors = await User.find({
      role: "doctor",
      approvalStatus: "approved",
      isActive: { $ne: false },
    }).select("fullname specialization consultationFee workingDays workingHours");

    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 }).limit(10);

    res.render("listings/dashboard", {
      patientAppointments,
      patientReports,
      patientPrescriptions,
      prescriptions,
      availableDoctors,
      notifications,
      activeTab: req.query.tab || "appointments",
    });
  } catch (err) {
    console.error("Patient Dashboard Error:", err);
    res.render("listings/dashboard", {
      patientAppointments: [],
      patientReports: [],
      patientPrescriptions: [],
      prescriptions: [],
      availableDoctors: [],
      notifications: [],
      activeTab: "appointments",
    });
  }
});

// Book Appointment with protected time slot
app.post("/appointments", async (req, res) => {
  try {
    const { patientName, age, gender, date, time, doctorName, notes } = req.body;

    const currentUser = req.user || res.locals.currentUser;
    const patientId = currentUser && currentUser.role === "patient" ? currentUser._id : undefined;
    const finalPatientName = (patientName && patientName.trim()) || (currentUser ? currentUser.fullname : "Patient");

    const cleanDoctorName = doctorName ? doctorName.trim() : "";
    const doctorObj = await User.findOne({
      fullname: { $regex: new RegExp(`^${cleanDoctorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      role: "doctor",
    });

    const parsedDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();

    const appt = await Appointment.create({
      patientId,
      patientName: finalPatientName,
      age: Number(age) || undefined,
      gender: gender || (currentUser ? currentUser.gender : ""),
      date: parsedDate,
      time: time || "10:00 AM",
      slot: time || "10:00 AM",
      doctorName: doctorObj ? doctorObj.fullname : cleanDoctorName,
      doctorId: doctorObj ? doctorObj._id : undefined,
      notes: notes ? notes.trim() : "",
      status: "Scheduled",
    });

    // Notify patient
    if (patientId) {
      await Notification.create({
        userId: patientId,
        message: `Your appointment with ${appt.doctorName} on ${parsedDate.toLocaleDateString()} at ${appt.time} is scheduled.`,
        type: "appointment",
      });
    }

    // Notify doctor
    if (doctorObj) {
      await Notification.create({
        userId: doctorObj._id,
        message: `New consultation booked by ${finalPatientName} on ${parsedDate.toLocaleDateString()} at ${appt.time}.`,
        type: "appointment",
      });
    }

    await logAudit(
      "Appointment Booked",
      "APPOINTMENT",
      currentUser || { fullname: finalPatientName, role: "guest" },
      appt.doctorName,
      `Consultation booked for ${finalPatientName} on ${parsedDate.toLocaleDateString()} at ${appt.time}`,
      req
    );

    if (currentUser && (currentUser.role === "doctor" || currentUser.role === "receptionist")) {
      return res.redirect("/staff?tab=schedule");
    } else if (currentUser && currentUser.role === "admin") {
      return res.redirect("/admin?tab=appointments");
    } else {
      return res.redirect("/dashboard?tab=appointments");
    }
  } catch (err) {
    console.error("Appointment booking error:", err);
    res.redirect("/dashboard");
  }
});

// Patient Cancel Appointment
app.post("/appointments/:id/cancel", isLoggedIn, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.redirect("/dashboard");
    }

    const isOwner = appt.patientId && appt.patientId.toString() === req.user._id.toString();
    const isNameMatch = appt.patientName && appt.patientName.toLowerCase() === req.user.fullname.toLowerCase();
    const isPrivileged = req.user.role === "admin" || req.user.role === "doctor" || req.user.role === "receptionist";

    if (!isOwner && !isNameMatch && !isPrivileged) {
      return res.status(403).render("error", {
        message: "You are not authorized to cancel this appointment.",
      });
    }

    appt.status = "Cancelled";
    await appt.save();

    if (appt.patientId) {
      await Notification.create({
        userId: appt.patientId,
        message: `Your appointment with ${appt.doctorName} on ${new Date(appt.date).toLocaleDateString()} has been cancelled.`,
        type: "appointment",
      });
    }

    if (appt.doctorId) {
      await Notification.create({
        userId: appt.doctorId,
        message: `Patient ${appt.patientName} cancelled their consultation scheduled for ${new Date(appt.date).toLocaleDateString()} at ${appt.time}.`,
        type: "appointment",
      });
    }

    await logAudit(
      "Appointment Cancelled",
      "APPOINTMENT",
      req.user,
      appt.patientName,
      `Cancelled visit with ${appt.doctorName}`,
      req
    );

    if (req.user.role === "admin") return res.redirect("/admin?tab=appointments");
    if (req.user.role === "doctor" || req.user.role === "receptionist") return res.redirect("/staff?tab=schedule");
    res.redirect("/dashboard?tab=appointments");
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res.redirect("/dashboard?tab=appointments");
  }
});

// ==========================================
// 4. ADMIN PORTAL ROUTES (/admin)
// ==========================================

app.get("/admin/login", (req, res) => {
  if (res.locals.currentUser && res.locals.currentUser.role === "admin") {
    return res.redirect("/admin");
  }
  res.render("users/admin-login", { error: null });
});

app.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const adminUser = await User.findOne({ email: cleanEmail, role: "admin" });

    if (!adminUser) {
      return res.status(401).render("users/admin-login", {
        error: "Invalid administrator credentials or access unauthorized.",
      });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(401).render("users/admin-login", {
        error: "Invalid administrator credentials.",
      });
    }

    const token = jwt.sign(
      { id: adminUser._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit("Admin Sign In", "AUTH", adminUser, adminUser.email, "Logged into Admin Console", req);

    res.redirect("/admin");
  } catch (err) {
    next(err);
  }
});

app.get("/admin/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/admin/login");
});

// Admin Console Dashboard
app.get("/admin", isAdminLoggedIn, async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor", approvalStatus: "approved" });
    const totalReceptionists = await User.countDocuments({ role: "receptionist" });
    const totalAppointments = await Appointment.countDocuments();
    const totalReports = await Report.countDocuments();

    const pendingDoctors = await User.find({
      role: "doctor",
      approvalStatus: { $in: ["pending", "needs_info"] },
    }).sort({ createdAt: -1 });

    const doctorsList = await User.find({
      role: "doctor",
      approvalStatus: { $ne: "pending" },
    }).sort({ createdAt: -1 });

    const receptionistsList = await User.find({
      role: "receptionist",
    }).sort({ createdAt: -1 });

    const patientsList = await User.find({ role: "patient" }).sort({ createdAt: -1 });
    const masterAppointments = await Appointment.find().sort({ date: -1 }).limit(40);
    const departmentsList = await Department.find().sort({ name: 1 });
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);

    res.render("listings/admin-dashboard", {
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalAppointments,
      totalReports,
      pendingDoctors,
      doctorsList,
      receptionistsList,
      patientsList,
      masterAppointments,
      departmentsList,
      auditLogs,
      activeTab: req.query.tab || "overview",
    });
  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.render("listings/admin-dashboard", {
      totalPatients: 0,
      totalDoctors: 0,
      totalReceptionists: 0,
      totalAppointments: 0,
      totalReports: 0,
      pendingDoctors: [],
      doctorsList: [],
      receptionistsList: [],
      patientsList: [],
      masterAppointments: [],
      departmentsList: [],
      auditLogs: [],
      activeTab: "overview",
    });
  }
});

// Admin Approve Doctor Application
app.post("/admin/doctors/:id/approve", isAdminLoggedIn, async (req, res) => {
  try {
    const doc = await User.findById(req.params.id);
    if (doc) {
      doc.approvalStatus = "approved";
      doc.isActive = true;
      doc.adminNotes = "";
      await doc.save();

      await Notification.create({
        userId: doc._id,
        message: `Congratulations Dr. ${doc.fullname}! Your medical application has been APPROVED by hospital administration. You can now access your Healthcare Staff Portal.`,
        type: "approval",
      });

      await logAudit("Doctor Approved", "VERIFICATION", req.user, doc.fullname, `Approved credentials for Dr. ${doc.fullname} (${doc.specialization})`, req);
    }
    res.redirect("/admin?tab=verification");
  } catch (err) {
    console.error("Doctor approval error:", err);
    res.redirect("/admin?tab=verification");
  }
});

// Admin Request More Information from Doctor
app.post("/admin/doctors/:id/request-info", isAdminLoggedIn, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const doc = await User.findById(req.params.id);
    if (doc) {
      doc.approvalStatus = "needs_info";
      doc.adminNotes = adminNotes ? adminNotes.trim() : "Additional documentation requested.";
      await doc.save();

      await Notification.create({
        userId: doc._id,
        message: `Action Required: Hospital administration requested additional verification info: "${doc.adminNotes}".`,
        type: "alert",
      });

      await logAudit("Doctor Info Requested", "VERIFICATION", req.user, doc.fullname, `Requested info: ${doc.adminNotes}`, req);
    }
    res.redirect("/admin?tab=verification");
  } catch (err) {
    console.error("Request info error:", err);
    res.redirect("/admin?tab=verification");
  }
});

// Admin Reject Doctor Application
app.post("/admin/doctors/:id/reject", isAdminLoggedIn, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const doc = await User.findById(req.params.id);
    if (doc) {
      doc.approvalStatus = "rejected";
      doc.adminNotes = adminNotes ? adminNotes.trim() : "Credentials could not be verified.";
      await doc.save();

      await Notification.create({
        userId: doc._id,
        message: `Your medical credentials application was reviewed and rejected. Reason: ${doc.adminNotes}`,
        type: "rejection",
      });

      await logAudit("Doctor Rejected", "VERIFICATION", req.user, doc.fullname, `Rejected application: ${doc.adminNotes}`, req);
    }
    res.redirect("/admin?tab=verification");
  } catch (err) {
    console.error("Doctor rejection error:", err);
    res.redirect("/admin?tab=verification");
  }
});

// Admin Add / Provision Doctor or Receptionist
app.post("/admin/staff/add", isAdminLoggedIn, async (req, res) => {
  try {
    const { fullname, email, password, specialization, phone, role } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(400).render("error", {
        message: "A staff member or user with this email address already exists.",
      });
    }

    const hashPass = await bcrypt.hash(password || "Staff123#", 10);
    const assignedRole = role === "receptionist" ? "receptionist" : "doctor";
    const formattedName = assignedRole === "doctor" && !fullname.startsWith("Dr.") ? `Dr. ${fullname.trim()}` : fullname.trim();

    const newStaff = await User.create({
      fullname: formattedName,
      email: cleanEmail,
      password: hashPass,
      role: assignedRole,
      approvalStatus: "approved",
      isActive: true,
      specialization: specialization || (assignedRole === "doctor" ? "General Medicine" : "Front Desk Operations"),
      phone: phone || "",
      consultationFee: assignedRole === "doctor" ? 500 : undefined,
    });

    await logAudit(
      "Staff Provisioned",
      "STAFF",
      req.user,
      newStaff.fullname,
      `Created ${assignedRole.toUpperCase()} account for ${newStaff.email}`,
      req
    );

    res.redirect("/admin?tab=staff");
  } catch (err) {
    console.error("Admin add staff error:", err);
    res.redirect("/admin?tab=staff");
  }
});

// Admin Toggle Staff Active State
app.post("/admin/staff/:id/toggle-active", isAdminLoggedIn, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (staff) {
      staff.isActive = staff.isActive === false ? true : false;
      await staff.save();
      await logAudit("Staff Status Toggled", "STAFF", req.user, staff.fullname, `Account set to ${staff.isActive ? "ACTIVE" : "INACTIVE"}`, req);
    }
    res.redirect("/admin?tab=staff");
  } catch (err) {
    console.error("Toggle active error:", err);
    res.redirect("/admin?tab=staff");
  }
});

// Admin Delete Staff
app.post("/admin/staff/:id/delete", isAdminLoggedIn, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (staff) {
      const name = staff.fullname;
      await User.findByIdAndDelete(req.params.id);
      await logAudit("Staff Deleted", "STAFF", req.user, name, `Removed staff account`, req);
    }
    res.redirect("/admin?tab=staff");
  } catch (err) {
    console.error("Admin delete staff error:", err);
    res.redirect("/admin?tab=staff");
  }
});

// Admin Add Department
app.post("/admin/departments/add", isAdminLoggedIn, async (req, res) => {
  try {
    const { name, code, floor, headDoctor, description } = req.body;
    if (name) {
      await Department.create({
        name: name.trim(),
        code: (code && code.trim().toUpperCase()) || name.substring(0, 4).toUpperCase(),
        floor: floor || "Outpatient Block",
        headDoctor: headDoctor || "Consultant In-Charge",
        description: description || "",
      });
      await logAudit("Department Created", "SYSTEM", req.user, name, `Added ${name} clinical department`, req);
    }
    res.redirect("/admin?tab=departments");
  } catch (err) {
    console.error("Add department error:", err);
    res.redirect("/admin?tab=departments");
  }
});

// Admin Delete Department
app.post("/admin/departments/:id/delete", isAdminLoggedIn, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (dept) {
      const dName = dept.name;
      await Department.findByIdAndDelete(req.params.id);
      await logAudit("Department Deleted", "SYSTEM", req.user, dName, `Deleted clinical department`, req);
    }
    res.redirect("/admin?tab=departments");
  } catch (err) {
    console.error("Delete department error:", err);
    res.redirect("/admin?tab=departments");
  }
});

// Admin Update Appointment Status
app.post("/admin/appointments/:id/status", isAdminLoggedIn, async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findById(req.params.id);
    if (appt && status) {
      appt.status = status;
      await appt.save();
      await logAudit("Appointment Status Changed", "APPOINTMENT", req.user, appt.patientName, `Admin updated status to ${status}`, req);
    }
    res.redirect("/admin?tab=appointments");
  } catch (err) {
    console.error("Admin appointment status error:", err);
    res.redirect("/admin?tab=appointments");
  }
});

// ==========================================
// 404 & GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    message: "The requested clinical page or medical resource could not be found.",
  });
});

// Centralized Express Error Handler
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).render("error", {
    message: err.message || "An unexpected internal server error occurred while processing your clinical request.",
  });
});

// ==========================================
// SERVER INITIALIZATION & AUTO-SEED
// ==========================================

connectDB()
  .then(async () => {
    // Seed default admin, doctor, receptionist credentials & departments
    await seedDefaultUsers();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`CareSync Clinical Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });

export { app };
export default app;