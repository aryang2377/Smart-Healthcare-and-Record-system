import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.db
    .collection("users")
    .find({ role: { $nin: ["admin", "doctor", "receptionist"] } })
    .toArray();

  for (const u of users) {
    const prefix = u.email.split("@")[0];
    const candidates = [
      prefix,
      prefix + "123",
      prefix + "@123",
      prefix + "12",
      prefix + "1",
      prefix + "2",
      prefix + "1234",
      prefix + "@12",
      prefix + "#123",
      prefix + "!",
      "aru",
      "aru1",
      "aru12",
      "aru123",
      "aru@123",
      "write",
      "write1",
      "write12",
      "write123",
      "write@123",
      "writer",
      "123",
      "1234",
      "12345",
      "123456",
      "123123",
      "112233",
      "012345",
      "aryan",
      "aryan123",
      "aryan12",
      "aryan1",
    ];

    let match = null;
    for (const c of candidates) {
      if (await bcrypt.compare(c, u.password)) {
        match = c;
        break;
      }
    }
    console.log(`${u.email} (${u.fullname}) => Password: ${match || "NOT_FOUND"}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(console.error);
