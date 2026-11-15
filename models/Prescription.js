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

  problem: {
    type: String,
    required: true,
  },

  diagnosis: {
    type: String,
    required: true,
  },

  medicines: {
    type: String,
    required: true,
  },

  advice: {
    type: String,
    default: "",
  },

  testsRecommended: {
    type: String,
    default: "",
  },

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
