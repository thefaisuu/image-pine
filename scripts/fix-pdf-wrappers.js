// fix-pdf-wrappers.js
const fs = require('fs');

['jpg-to-pdf', 'png-to-pdf'].forEach(dir => {
  let c = fs.readFileSync(`app/${dir}/page.js`, 'utf8');
  
  // Find the ToolPageShell closing > and then the immediate content
  // Pattern: "    >\n        <div className=\"text-center..."
  // We need to wrap all content inside ToolPageShell with a single div
  
  // Insert opening wrapper div after ToolPageShell >
  const toolShellOpenEnd = c.indexOf('    >\n        <div className="text-center');
  if (toolShellOpenEnd !== -1) {
    const insertPoint = toolShellOpenEnd + '    >\n'.length;
    c = c.slice(0, insertPoint) + '      <div className="flex flex-col gap-6">\n' + c.slice(insertPoint);
    
    // Now add closing wrapper before </ToolPageShell>
    c = c.replace('        )}\n    </ToolPageShell>', '        )}\n      </div>\n    </ToolPageShell>');
    
    fs.writeFileSync(`app/${dir}/page.js`, c, 'utf8');
    console.log(dir, 'fixed. Has wrapper:', c.includes('flex flex-col gap-6'));
  } else {
    // Maybe already wrapped
    console.log(dir, '- pattern not found');
    const idx = c.indexOf('</ToolPageShell>');
    if (idx !== -1) {
      console.log('  Before shell close:', JSON.stringify(c.slice(Math.max(0,idx-80),idx)));
    }
  }
});
console.log('Done.');
