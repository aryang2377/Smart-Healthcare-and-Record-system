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
app.use(express.static(path.join(__dirname, "public")));

app.get("/",(req,res)=>{
    res.render("listings/home");
}
)

app.get("/doctors",(req,res)=>{
    res.render("listings/find doctors");
})

app.get("dashboard",(req,res)=>{
    res.render("listings/dashboard");
})

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post("/register", (req, res) => {
  const { fullname, email, password } = req.body;
  res.send("User Registered");
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