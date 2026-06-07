// fix-bulk-resize.js - wrap ToolPageShell children in bulk-resize
const fs = require('fs');

let c = fs.readFileSync('app/bulk-resize/page.js', 'utf8');

// Find the ToolPageShell closing > and then the immediate content
const toolShellOpenEnd = c.indexOf('    >\n        {/* Header Title */}');
if (toolShellOpenEnd !== -1) {
  const insertPoint = toolShellOpenEnd + '    >\n'.length;
  c = c.slice(0, insertPoint) + '      <div className="flex flex-col gap-6">\n' + c.slice(insertPoint);
  
  // Add closing wrapper before </ToolPageShell>
  c = c.replace('        )}\n    </ToolPageShell>', '        )}\n      </div>\n    </ToolPageShell>');
  
  fs.writeFileSync('app/bulk-resize/page.js', c, 'utf8');
  console.log('bulk-resize fixed. Has wrapper:', c.includes('flex flex-col gap-6'));
} else {
  console.log('Pattern not found');
  // Try without the header comment
  const idx2 = c.indexOf('    >\n        <div className="text-center');
  console.log('Alt pattern at:', idx2);
  const idx3 = c.indexOf('    >\n\n        {/* Header');
  console.log('Alt pattern 2 at:', idx3);
  // Show what comes right after >
  const toolShellIdx = c.lastIndexOf('    >');
  console.log('toolShell > at:', toolShellIdx);
  console.log('After >:', JSON.stringify(c.slice(toolShellIdx, toolShellIdx + 100)));
}
