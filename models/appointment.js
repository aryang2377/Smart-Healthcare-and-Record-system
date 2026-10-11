import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  patientName: {
    type: String,
    required: true,
  },

  age: {
    type: Number,
  },

  gender: {
    type: String,
  },

  doctorName: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  time: {
    type: String,
    required: true,
  },

  slot: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: [
      "Scheduled",
      "Confirmed",
      "Checked-In",
      "In-Consultation",
      "Completed",
      "Cancelled",
      "No-Show",
    ],
    default: "Scheduled",
  },

  notes: {
    type: String,
    default: "",
  },

  consultationNotes: {
    type: String,
    default: "",
  },

  checkedInAt: {
    type: Date,
  },

  inConsultationAt: {
    type: Date,
  },

  completedAt: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;