import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const app = express();
import ejsMate from "ejs-mate";

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

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running at http://localhost:4000`);
});
