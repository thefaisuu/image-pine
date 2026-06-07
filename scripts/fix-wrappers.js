// fix-wrappers.js — remove the legacy bg-lightbg and max-w-6xl wrapper divs from the 4 pages
const fs = require('fs');

const pages = ['image-to-pdf', 'jpg-to-pdf', 'png-to-pdf', 'bulk-resize'];

pages.forEach(dir => {
  const p = `app/${dir}/page.js`;
  let c = fs.readFileSync(p, 'utf8');
  
  // Remove the outer wrapper: 
  //   <div className="bg-lightbg min-h-screen ...">
  //     <div className="max-w-6xl mx-auto flex flex-col gap-6">
  // And its closing:
  //       </div>
  //     </div>
  // right before </ToolPageShell>
  
  // Step 1: Remove the opening bg-lightbg div and its inner max-w-6xl div
  // Pattern: >\n    <div className="bg-lightbg...\n      <div className="max-w-6xl...
  
  c = c.replace(
    />\n\s*<div className="bg-lightbg[^"]*">\n\s*<div className="max-w-6xl[^"]*">\s*\n/g,
    '>\n'
  );
  
  // Step 2: Remove the optional header title div (if still there from old structure)
  // Pattern: {/* Header Title */}\n        <div className="text-center mb-6...\n ...\n        </div>
  // This is tool-specific, skip for now
  
  // Step 3: Remove the closing </div>\n      </div> just before </ToolPageShell>
  c = c.replace(
    /\n\s*<\/div>\n\s*<\/div>\n(\s*<\/ToolPageShell>)/g,
    '\n$1'
  );
  
  fs.writeFileSync(p, c, 'utf8');
  console.log(`${dir}: cleaned wrapper divs`);
  
  // Verify structure
  const lines = c.split('\n');
  const shellClose = lines.findIndex(l => l.includes('</ToolPageShell>'));
  if (shellClose !== -1) {
    console.log(`  </ToolPageShell> at line ${shellClose + 1}`);
    console.log(`  lines before it: ${JSON.stringify(lines.slice(Math.max(0, shellClose-3), shellClose).join('\\n'))}`);
  }
  console.log();
});

console.log('Done!');
