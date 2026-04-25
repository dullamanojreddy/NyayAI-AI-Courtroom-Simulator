const fs = require('fs');
const path = require('path');

function stripSourceMapRef(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const raw = fs.readFileSync(filePath, 'utf8');
  const updated = raw.replace(/^\s*\/\/# sourceMappingURL=.*$/gm, '').trimEnd() + '\n';
  if (updated === raw) return false;
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function run() {
  const target = path.join(__dirname, '..', 'node_modules', 'pdfmake', 'build', 'pdfmake.js');
  const changed = stripSourceMapRef(target);
  if (changed) {
    console.log('pdfmake sourcemap reference removed from build/pdfmake.js');
  } else {
    console.log('pdfmake sourcemap fix skipped (already clean or file not found).');
  }
}

run();
