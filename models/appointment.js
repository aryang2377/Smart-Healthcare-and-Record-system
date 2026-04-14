import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({

  patientName: {
    type: String,
    required: true,
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

  status: {
    type: String,
    default: "Scheduled",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;