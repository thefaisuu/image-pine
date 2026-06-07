// fix-remaining.js — fix pages with double return statements
const fs = require('fs');

const pages = ['bulk-resize', 'image-to-pdf', 'jpg-to-pdf', 'png-to-pdf'];
pages.forEach(dir => {
  const p = `app/${dir}/page.js`;
  let c = fs.readFileSync(p, 'utf8');
  const lines = c.split('\n');
  
  // Find all top-level return lines
  const returnLineNums = [];
  lines.forEach((l, i) => {
    if (/^  return \($/.test(l.trimEnd())) returnLineNums.push(i);
  });
  
  console.log(dir, '→ return lines at:', returnLineNums.map(n => n+1));
  
  if (returnLineNums.length <= 1) {
    console.log('  Already OK');
    return;
  }
  
  // The SECOND return is the old/bad one — it starts after a closing '}'
  // We want to keep only the FIRST return block (which wraps ToolPageShell)
  // and discard everything after the closing brace of the function that follows it.
  
  // Find the first '}' that closes the function at the second return's level
  // Strategy: find where the SECOND return starts, then track back to find
  // the position where the FIRST return's block ends (just before second return)
  
  const secondReturnLine = returnLineNums[1];
  
  // Work backwards from the second return to find '}\n\n  return (' pattern
  // The correct file should end at the line before the second 'return ('
  // But we need the closing brace + ); of the FIRST return
  
  // Look for the pattern: the FIRST return should close with:
  //   );
  // }
  // Then empty lines, then the SECOND return starts
  
  // Find the line just before secondReturnLine that has meaningful content
  let cutLine = secondReturnLine;
  // Walk backwards to find a blank line or the end of first return
  // The structure should be: ... ); \n}\n\nreturn(... OR ... );\n}\n\nreturn(
  
  // Simple approach: everything from line 0 to (secondReturnLine - 1) that is
  // the first clean return, but we need to verify it's properly closed.
  // Look for the pattern '  );\n}\n' before the second return
  
  const beforeSecond = lines.slice(0, secondReturnLine).join('\n');
  const afterSecond = lines.slice(secondReturnLine).join('\n');
  
  // The beforeSecond should already be a complete valid file if the first return is complete
  // Check if beforeSecond ends with proper closing
  const trimmed = beforeSecond.trimEnd();
  if (trimmed.endsWith('}')) {
    // Good - first return block is complete
    fs.writeFileSync(p, trimmed + '\n', 'utf8');
    console.log('  Fixed! Truncated at line', secondReturnLine);
  } else {
    console.log('  Warning: first block does not end with }, ends with:', trimmed.slice(-30));
    // Try to find the closing pattern
    const lastBrace = trimmed.lastIndexOf('\n}');
    if (lastBrace !== -1) {
      fs.writeFileSync(p, trimmed.slice(0, lastBrace + 2) + '\n', 'utf8');
      console.log('  Fixed via lastBrace');
    }
  }
});

console.log('\nDone.');
