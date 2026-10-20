import fs from "fs";
import path from "path";
import ejs from "ejs";

const viewsDir = path.resolve("views");

function getAllEjsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllEjsFiles(fullPath));
    } else if (file.endsWith(".ejs")) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllEjsFiles(viewsDir);
let allPass = true;

console.log(`Checking ${files.length} EJS templates for compilation errors...`);

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  try {
    ejs.compile(content, { filename: file });
    console.log(`[PASS] ${path.relative(viewsDir, file)}`);
  } catch (err) {
    console.error(`[FAIL] ${path.relative(viewsDir, file)}:`, err.message);
    allPass = false;
  }
}

if (!allPass) {
  console.error("Some templates failed compilation!");
  process.exit(1);
} else {
  console.log("\nALL EJS TEMPLATES COMPILED SUCCESSFULLY!");
  process.exit(0);
}
