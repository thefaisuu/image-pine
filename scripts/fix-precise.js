// fix-precise.js
// Fixes the 4 pages that have:
//   return (
//     <ToolPageShell...>
//   return (                   <-- REMOVE THIS
//     <div className="bg-lightbg..."> <-- KEEP this JSX content (workspace)
//       ...
//     </div>                    <-- KEEP until here
//   );                          <-- REMOVE this old closing
// }
//   </ToolPageShell>            <-- becomes direct child of ToolPageShell
//   );
// }

const fs = require('fs');

const pages = ['bulk-resize', 'image-to-pdf', 'jpg-to-pdf', 'png-to-pdf'];

pages.forEach(dir => {
  const p = `app/${dir}/page.js`;
  let c = fs.readFileSync(p, 'utf8');
  
  // Find the pattern: >\nreturn (\n    <div className="bg-lightbg
  // Replace with: >\n    <div ...
  
  // Pattern: after the ToolPageShell opening >, there's a spurious return (
  // We need to remove "return (\n" and its matching ");\n}\n" near the end before </ToolPageShell>
  
  // Step 1: Remove the spurious 'return (' that appears right after ToolPageShell's >
  // The pattern is:     >\nreturn (\n    <div className="bg-lightbg...
  
  const badReturnPattern = /(\s*>\n)return \(\n(\s*<div[^>]*bg-lightbg[^>]*>)/;
  if (badReturnPattern.test(c)) {
    c = c.replace(badReturnPattern, '$1$2');
    console.log(dir, '✓ Removed spurious return (');
  } else {
    console.log(dir, '⚠ Pattern not found, trying alternative...');
    // Try: >\nreturn (\n    <div  (without bg-lightbg requirement)
    const alt = /(\s*>\n)return \(\n(\s*<div)/;
    if (alt.test(c)) {
      c = c.replace(alt, '$1$2');
      console.log(dir, '✓ Removed via alt pattern');
    }
  }
  
  // Step 2: Remove the old closing ');' and '}' that comes before </ToolPageShell>
  // Pattern: \n      </div>\n    </div>\n  );\n}\n    </ToolPageShell>
  // or:      </div>\n  );\n}\n    </ToolPageShell>
  
  // Find: \n  );\n}\n    </ToolPageShell>
  // Replace with: \n    </ToolPageShell>
  
  const oldClosingPattern = /\n  \);\n\}\n(\s*<\/ToolPageShell>)/;
  if (oldClosingPattern.test(c)) {
    c = c.replace(oldClosingPattern, '\n$1');
    console.log(dir, '✓ Removed old );}');
  } else {
    console.log(dir, '⚠ Closing pattern not found');
    // Check current state
    const idx = c.indexOf('</ToolPageShell>');
    if (idx !== -1) {
      console.log('  Before </ToolPageShell>:', JSON.stringify(c.slice(Math.max(0, idx-60), idx)));
    }
  }
  
  fs.writeFileSync(p, c, 'utf8');
  
  // Verify
  const lines = c.split('\n');
  const topReturns = lines.filter(l => /^  return \($/.test(l.trimEnd())).length;
  console.log(dir, 'now has', topReturns, 'top-level return(s)\n');
});

console.log('Done.');
