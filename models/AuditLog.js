import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["AUTH", "VERIFICATION", "APPOINTMENT", "CONSULTATION", "PRESCRIPTION", "STAFF", "SYSTEM"],
    default: "SYSTEM",
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  actorName: {
    type: String,
    required: true,
  },
  actorRole: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    default: "",
  },
  details: {
    type: String,
    default: "",
  },
  ipAddress: {
    type: String,
    default: "127.0.0.1",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
