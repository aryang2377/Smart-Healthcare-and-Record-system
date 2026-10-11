import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  doctorName: {
    type: String,
    default: "CareSync Diagnostic Lab",
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Lab Report", "Prescription", "Radiology", "Clinical Summary"],
    default: "Lab Report",
  },
  fileUrl: {
    type: String,
    default: "",
  },
  fileName: {
    type: String,
    default: "",
  },
  fileSize: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  uploadedByRole: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "doctor",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
