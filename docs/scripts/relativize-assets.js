const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "..", "build");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function relativize(contents) {
  return contents
    .replaceAll('"/assets/', '"assets/')
    .replaceAll("'/assets/", "'assets/")
    .replaceAll('"/img/', '"img/')
    .replaceAll("'/img/", "'img/")
    .replaceAll('="/assets/', '="assets/')
    .replaceAll("='/assets/", "='assets/")
    .replaceAll('="/img/', '="img/')
    .replaceAll("='/img/", "='img/")
    .replaceAll("=__webpack_require__.p+", "=__webpack_require__.p+")
    .replaceAll('r.p="/"', 'r.p="./"')
    .replaceAll('r.p="/assets/"', 'r.p="assets/"');
}

for (const filePath of walk(buildDir)) {
  if (!/\.(html|js|css)$/.test(filePath)) {
    continue;
  }
  const original = fs.readFileSync(filePath, "utf8");
  const updated = relativize(original);
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
  }
}
