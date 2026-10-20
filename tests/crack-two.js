import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

async function crackTwo() {
  await mongoose.connect(process.env.MONGODB_URI);
  const uAru = await mongoose.connection.db.collection("users").findOne({ email: "aru@gmail.com" });
  const uWrite = await mongoose.connection.db.collection("users").findOne({ email: "write@gmail.com" });

  const wordlist = [
    "aru", "arun", "arun123", "arugupta", "aru@123", "aru321", "arush", "arush123",
    "aryan", "aryan123", "aryan@123", "aryan1234", "aryang", "aryang123",
    "write", "writer", "writing", "write123", "write@123", "write321", "writes",
    "test", "test123", "test@123", "testing", "testing123",
    "secret", "secret123", "admin", "admin123", "admin@123",
    "123456", "1234567", "12345678", "123456789", "1234567890",
    "password", "pass123", "pass@123", "password123",
    "qwerty", "qwerty123", "asdfgh", "zxcvbn",
    "gupta", "gupta123", "gupta@123", "caresync", "caresync123"
  ];

  for (const w of wordlist) {
    if (await bcrypt.compare(w, uAru.password)) {
      console.log("MATCH FOR aru@gmail.com:", w);
      break;
    }
  }

  for (const w of wordlist) {
    if (await bcrypt.compare(w, uWrite.password)) {
      console.log("MATCH FOR write@gmail.com:", w);
      break;
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

crackTwo().catch(console.error);
