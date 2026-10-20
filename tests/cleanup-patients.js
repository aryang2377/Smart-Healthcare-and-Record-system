import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";
import Appointment from "../models/appointment.js";
import Report from "../models/Report.js";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";

async function inspectAndCleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all patients except john doe (john@gmail.com)
  const usersToDelete = await User.find({
    role: { $nin: ["admin", "doctor", "receptionist"] },
    email: { $ne: "john@gmail.com" },
  });

  console.log(`Found ${usersToDelete.length} patients to delete:`);
  const deleteIds = usersToDelete.map((u) => u._id);
  const deleteNames = usersToDelete.map((u) => u.fullname);

  for (const u of usersToDelete) {
    console.log(` - ${u.fullname} (${u.email}) [ID: ${u._id}]`);
  }

  // Delete appointments belonging to these patients
  const apptResult = await Appointment.deleteMany({
    $or: [{ patientId: { $in: deleteIds } }, { patientName: { $in: deleteNames } }],
  });
  console.log(`Deleted ${apptResult.deletedCount} appointments associated with removed patients.`);

  // Delete reports belonging to these patients
  const repResult = await Report.deleteMany({
    $or: [{ patientId: { $in: deleteIds } }, { patientName: { $in: deleteNames } }],
  });
  console.log(`Deleted ${repResult.deletedCount} reports associated with removed patients.`);

  // Delete prescriptions belonging to these patients
  const rxResult = await Prescription.deleteMany({
    $or: [{ patientId: { $in: deleteIds } }, { patientName: { $in: deleteNames } }],
  });
  console.log(`Deleted ${rxResult.deletedCount} prescriptions associated with removed patients.`);

  // Delete notifications belonging to these patients
  const notifResult = await Notification.deleteMany({
    userId: { $in: deleteIds },
  });
  console.log(`Deleted ${notifResult.deletedCount} notifications associated with removed patients.`);

  // Finally, delete the patient user accounts
  const userResult = await User.deleteMany({
    _id: { $in: deleteIds },
  });
  console.log(`Deleted ${userResult.deletedCount} patient user accounts.`);

  // Verify John Doe
  const john = await User.findOne({ email: "john@gmail.com" });
  if (john) {
    john.role = "patient";
    await john.save();
    console.log(`\nVerified John Doe is active: ${john.fullname} (${john.email}) [Role: ${john.role}]`);
  }

  // List remaining patients
  const remainingPatients = await User.find({ role: "patient" });
  console.log(`Remaining patients in database: ${remainingPatients.length}`);
  remainingPatients.forEach((p) => console.log(` - ${p.fullname} (${p.email})`));

  await mongoose.disconnect();
  process.exit(0);
}

inspectAndCleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});
