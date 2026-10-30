import mongoose from "mongoose";

const vitalSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recordedByName: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  systolic: {
    type: Number,
    min: 40,
    max: 260,
  },
  diastolic: {
    type: Number,
    min: 30,
    max: 160,
  },
  bloodSugar: {
    type: Number,
    min: 20,
    max: 600,
  },
  sugarType: {
    type: String,
    enum: ["Fasting", "Post-Meal", "Random"],
    default: "Fasting",
  },
  heartRate: {
    type: Number,
    min: 30,
    max: 250,
  },
  temperature: {
    type: Number,
    min: 90,
    max: 110,
  },
  weight: {
    type: Number,
    min: 2,
    max: 300,
  },
  height: {
    type: Number,
    min: 40,
    max: 250,
  },
  bmi: {
    type: Number,
  },
  oxygenLevel: {
    type: Number,
    min: 50,
    max: 100,
  },
  bpCategory: {
    type: String,
    default: "Unrecorded",
  },
  bpBadge: {
    type: String,
    default: "secondary",
  },
  sugarCategory: {
    type: String,
    default: "Unrecorded",
  },
  sugarBadge: {
    type: String,
    default: "secondary",
  },
  pulseCategory: {
    type: String,
    default: "Unrecorded",
  },
  pulseBadge: {
    type: String,
    default: "secondary",
  },
  bmiCategory: {
    type: String,
    default: "Unrecorded",
  },
  bmiBadge: {
    type: String,
    default: "secondary",
  },
  oxygenCategory: {
    type: String,
    default: "Unrecorded",
  },
  oxygenBadge: {
    type: String,
    default: "secondary",
  },
  tempCategory: {
    type: String,
    default: "Unrecorded",
  },
  hasAlert: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Vital = mongoose.model("Vital", vitalSchema);

export default Vital;
