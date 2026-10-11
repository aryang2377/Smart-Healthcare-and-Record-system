import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  rxNumber: {
    type: String,
    required: true,
    unique: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  patientName: {
    type: String,
    required: true,
  },
  patientEmail: {
    type: String,
    default: "",
  },
  patientAge: {
    type: Number,
    default: null,
  },
  patientGender: {
    type: String,
    default: "",
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  doctorSpecialization: {
    type: String,
    default: "General Medicine",
  },
  doctorPhone: {
    type: String,
    default: "",
  },
  // Patient's problem / symptoms told to doctor
  problem: {
    type: String,
    required: true,
  },
  // Doctor's clinical diagnosis
  diagnosis: {
    type: String,
    required: true,
  },
  // Prescribed medicines
  medicines: {
    type: String,
    required: true,
  },
  // Doctor's advice, diet, instructions
  advice: {
    type: String,
    default: "",
  },
  // Recommended diagnostic tests
  testsRecommended: {
    type: String,
    default: "",
  },
  // Follow-up consultation date
  followUp: {
    type: String,
    default: "As needed / 5 days",
  },
  status: {
    type: String,
    enum: ["Sent to Patient", "Draft", "Completed"],
    default: "Sent to Patient",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
