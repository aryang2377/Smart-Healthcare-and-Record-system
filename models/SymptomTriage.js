import mongoose from "mongoose";

const symptomTriageSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  patientName: {
    type: String,
    default: "Anonymous Visitor",
  },
  patientEmail: {
    type: String,
    default: "",
  },
  patientPhone: {
    type: String,
    default: "",
  },
  symptoms: [{
    type: String,
  }],
  description: {
    type: String,
    default: "",
  },
  urgency: {
    type: String,
    enum: ["high", "moderate", "low"],
    default: "moderate",
  },
  emergencyFlag: {
    type: Boolean,
    default: false,
  },
  emergencyReason: {
    type: String,
    default: "",
  },
  primaryConditions: [{
    type: String,
  }],
  recommendedSpecialties: [{
    type: String,
  }],
  summary: {
    type: String,
    default: "",
  },
  homeRemedyNote: {
    type: String,
    default: "",
  },
  suggestedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  suggestedDoctorNames: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ["New", "Reviewed", "Archived"],
    default: "New",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SymptomTriage = mongoose.model("SymptomTriage", symptomTriageSchema);
export default SymptomTriage;
