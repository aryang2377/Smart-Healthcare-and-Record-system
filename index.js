import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import ejsMate from "ejs-mate";
import connectDB from "./db/sample.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

import User from "./models/user.js";
import Appointment from "./models/Appointment.js";

dotenv.config({
  path: "./.env"
});

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const isLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {
    return res.redirect("/login");
  }
};

app.use(async(req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      const user = await User.findById(decoded.id);

      res.locals.currentUser = user;

    } else {
      res.locals.currentUser = null;
    }

  } catch (err) {
    res.locals.currentUser = null;
  }

  next();
});

app.get("/", (req, res) => {
  res.render("listings/home");
});

app.get("/doctors", (req, res) => {
  res.render("listings/find doctors");
});

app.get("/symptom", (req, res) => {
  res.render("listings/symptom");
});

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {

    const now = new Date();

    const totalAppointments =
      await Appointment.countDocuments();

    const nextAppointment =
      await Appointment.findOne({
        date: { $gte: now }
      }).sort({ date: 1 });

    const lastVisit =
      await Appointment.findOne({
        date: { $lt: now }
      }).sort({ date: -1 });

    const todaysSchedule =
      await Appointment.find({
        date: {
          $gte: new Date().setHours(0,0,0,0),
          $lte: new Date().setHours(23,59,59,999)
        }
      }).sort({ date: 1 });

    res.render("listings/dashboard", {
      totalAppointments,
      nextAppointment,
      lastVisit,
      todaysSchedule
    });

  } catch (err) {

    console.log(err);

    res.render("listings/dashboard", {
      totalAppointments: 0,
      nextAppointment: null,
      lastVisit: null,
      todaysSchedule: []
    });

  }
});

app.post("/appointments", async (req, res) => {
  try {

    const {
      patientName,
      age,
      gender,
      date,
      time,
      doctorName
    } = req.body;

    await Appointment.create({
      patientName,
      age,
      gender,
      date,
      time,
      doctorName,
      status: "Scheduled"
    });

    res.redirect("/dashboard");

  } catch (err) {

    console.log(err);
    res.redirect("/dashboard");

  }
});

app.post("/login", async (req, res, next) => {
  try {

    const { email, password } =
      req.body;

    const user =
      await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .render("error", {
          message:
            "Invalid email or password"
        });
    }

    const ismatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!ismatch) {
      return res
        .status(401)
        .render("error", {
          message:
            "Invalid email or password"
        });
    }

    const token =
      jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
      );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge:
        7 * 24 * 60 * 60 * 1000
    });

    res.redirect("/dashboard");

  } catch (err) {
    next(err);
  }
});

app.post("/register", async (req, res, next) => {
  try {

    const {
      fullname,
      email,
      password
    } = req.body;

    const hashPass =
      await bcrypt.hash(
        password,
        10
      );

    const newUser =
      new User({
        fullname,
        email,
        password: hashPass
      });

    await newUser.save();

    const token =
      jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
      );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge:
        7 * 24 * 60 * 60 * 1000
    });

    res.redirect("/dashboard");

  } catch (err) {
    next(err);
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

connectDB()
  .then(() => {

    app.listen(
      process.env.PORT || 4000,
      () => {
        console.log(
          "Server running at http://localhost:4000"
        );
      }
    );

  })
  .catch((err) => {
    console.log(
      "MONGO DB connection failed",
      err
    );
  });