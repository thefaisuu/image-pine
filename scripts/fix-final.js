// fix-final.js — remove the spurious first ToolPageShell block in 4 pages
const fs = require('fs');

function fixPage(dir, firstReturnLine, secondReturnLine) {
  const p = `app/${dir}/page.js`;
  const c = fs.readFileSync(p, 'utf8');
  const lines = c.split('\n');
  
  // Remove lines from firstReturnLine-1 to secondReturnLine-2 (0-indexed)
  // i.e. keep: lines 0 to firstReturnLine-2, then lines secondReturnLine-1 to end
  const before = lines.slice(0, firstReturnLine - 1); // before the bad first return
  const after = lines.slice(secondReturnLine - 1);      // from the good second return
  
  const fixed = [...before, ...after].join('\n');
  fs.writeFileSync(p, fixed, 'utf8');
  
  // Verify
  const newLines = fixed.split('\n');
  const topReturns = newLines.reduce((acc, l, i) => {
    if (/^  return \($/.test(l.trimEnd())) acc.push(i + 1);
    return acc;
  }, []);
  console.log(`${dir}: fixed (${newLines.length} lines, returns at: ${topReturns.join(', ')})`);
}

// bulk-resize: first return at 264, second at 373
fixPage('bulk-resize', 264, 373);

// image-to-pdf: first return at 171, second at 232
fixPage('image-to-pdf', 171, 232);

// jpg-to-pdf: first return at 168, second at 227
fixPage('jpg-to-pdf', 168, 227);

// png-to-pdf: first return at 164, second at 223
fixPage('png-to-pdf', 164, 223);

console.log('\nAll done!');
