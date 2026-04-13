import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const app = express();
import ejsMate from "ejs-mate";
import connectDB from "./db/sample.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "./models/user.js";

dotenv.config({
    path: "./.env"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/",(req,res)=>{
    res.render("listings/home");
}
)

app.get("/doctors",(req,res)=>{
    res.render("listings/find doctors");
})

app.get("/dashboard",(req,res)=>{
    res.render("listings/dashboard");
})

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.get("/symptom",(req,res)=>{
  res.render("listings/symptom");
})
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .render("error", { message: "Invalid email or password" });
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res
        .status(401)
        .render("error", { message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

app.post("/register", async (req, res, next) => {
  try {
    const { fullname, email,  password} =
      req.body;
    const hashPass = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullname,
      email,
      password: hashPass,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running at http://localhost:4000`);
});
})
.catch((err)=>{
    console.log("MONGO DB connection failed",err);
});
