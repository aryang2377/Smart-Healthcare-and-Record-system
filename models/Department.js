import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "fa-stethoscope",
  },
  description: {
    type: String,
    default: "",
  },
  headDoctor: {
    type: String,
    default: "Senior Consultant",
  },
  floor: {
    type: String,
    default: "Block A, Level 2",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Department = mongoose.model("Department", departmentSchema);

export default Department;
