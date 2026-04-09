import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const app = express();

dotenv.config({
    path: "./.env"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running at http://localhost:4000`);
});
