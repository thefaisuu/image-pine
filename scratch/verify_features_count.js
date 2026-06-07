const fs = require('fs');
const path = require('path');
const appDir = 'd:/Image Pine/app';
const dirs = fs.readdirSync(appDir).filter(d => fs.statSync(path.join(appDir, d)).isDirectory());

let errorCount = 0;

dirs.forEach(dir => {
  const p = path.join(appDir, dir, 'page.js');
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    const featuresMatch = code.match(/const _FEATURES\s*=\s*\[([\s\S]*?)\];/);
    if (featuresMatch) {
      const content = featuresMatch[1];
      const items = content.split('icon:').length - 1;
      if (items !== 3 && items !== 6) {
        console.error(`ERROR: ${dir} has ${items} features! Expected 3 or 6.`);
        errorCount++;
      } else {
        console.log(`OK: ${dir} has ${items} features.`);
      }
    }
  }
});

if (errorCount === 0) {
  console.log('SUCCESS: All pages verified and have clean, symmetrical features counts (3 or 6)!');
} else {
  console.error(`FAILED: Found ${errorCount} pages with incorrect features count.`);
  process.exit(1);
}
