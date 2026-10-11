import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "receptionist", "admin"],
    default: "patient",
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", "needs_info"],
    default: "approved",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Step 1: Personal Information
  dob: {
    type: String,
    default: "",
  },
  gender: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  profilePhoto: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },

  // Step 2: Professional Information
  specialization: {
    type: String,
    default: "",
  },
  qualifications: {
    type: String,
    default: "",
  },
  experience: {
    type: String,
    default: "",
  },
  licenseNumber: {
    type: String,
    default: "",
  },
  registrationAuthority: {
    type: String,
    default: "",
  },
  currentHospital: {
    type: String,
    default: "",
  },
  consultationFee: {
    type: Number,
    default: 500,
  },
  bio: {
    type: String,
    default: "",
  },

  // Step 3: Verification Documents
  licenseDoc: {
    type: String,
    default: "",
  },
  degreeDoc: {
    type: String,
    default: "",
  },
  idDoc: {
    type: String,
    default: "",
  },

  // Step 4: Availability
  workingDays: {
    type: String,
    default: "Mon - Fri",
  },
  workingHours: {
    type: String,
    default: "09:00 AM - 02:00 PM",
  },
  appointmentDuration: {
    type: String,
    default: "20 mins",
  },
  breaks: {
    type: String,
    default: "01:00 PM - 02:00 PM",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
