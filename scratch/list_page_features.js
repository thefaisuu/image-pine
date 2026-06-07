const fs = require('fs');
const path = require('path');
const appDir = 'd:/Image Pine/app';
const dirs = fs.readdirSync(appDir).filter(d => fs.statSync(path.join(appDir, d)).isDirectory());

dirs.forEach(dir => {
  const p = path.join(appDir, dir, 'page.js');
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    const featuresMatch = code.match(/const _FEATURES\s*=\s*\[([\s\S]*?)\];/);
    if (featuresMatch) {
      const content = featuresMatch[1];
      const items = content.split('icon:').length - 1;
      if (items < 6) {
        const titles = [];
        const regex = /title:\s*['"](.*?)['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          titles.push(match[1]);
        }
        console.log(`${dir} (${items}): ${titles.join(' | ')}`);
      }
    }
  }
});
