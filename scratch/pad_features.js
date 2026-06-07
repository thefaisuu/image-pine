const fs = require('fs');
const path = require('path');
const appDir = 'd:/Image Pine/app';

const cards = {
  noWatermarks: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>), title: 'No Watermarks', desc: 'Clean outputs with no added branding.' }`,
  
  instantPreview: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>), title: 'Instant Preview', desc: 'See your changes immediately on screen.' }`,
  
  qualityPreservation: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), title: 'Quality Preserved', desc: 'Retains original resolution and details.' }`,
  
  aspectRatios: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>), title: 'Aspect Ratios', desc: 'Crop using custom or popular preset dimensions.' }`,
  
  qualityControl: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>), title: 'Quality Control', desc: 'Fine-tune output file settings before saving.' }`,
  
  vectorPathing: `{ icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16v16H4zM4 12h16M12 4v16"/></svg>), title: 'Vector Pathing', desc: 'Traces contours to generate vector paths.' }`
};

const paddingMapping = {
  'compress-gif': [cards.instantPreview, cards.noWatermarks],
  'compress-jpg': [cards.noWatermarks],
  'compress-pdf': [cards.noWatermarks],
  'compress-png': [cards.noWatermarks],
  'crop-jpg': [cards.noWatermarks],
  'crop-png': [cards.instantPreview, cards.noWatermarks],
  'crop-webp': [cards.aspectRatios, cards.noWatermarks],
  'gif-converter': [cards.qualityControl, cards.noWatermarks],
  'image-to-pdf': [cards.noWatermarks],
  'jpg-to-pdf': [cards.qualityPreservation, cards.noWatermarks],
  'pdf-converter': [cards.noWatermarks],
  'png-to-pdf': [cards.qualityPreservation, cards.noWatermarks],
  'png-to-svg': [cards.vectorPathing, cards.noWatermarks],
  'resize-jpg': [cards.noWatermarks],
  'resize-png': [cards.noWatermarks],
  'resize-webp': [cards.noWatermarks],
  'svg-converter': [cards.noWatermarks]
};

Object.entries(paddingMapping).forEach(([dir, newCards]) => {
  const p = path.join(appDir, dir, 'page.js');
  if (!fs.existsSync(p)) {
    console.error(`File not found: ${p}`);
    return;
  }

  let code = fs.readFileSync(p, 'utf8');
  
  // Regex to match the entire _FEATURES array
  const featuresRegex = /(const _FEATURES\s*=\s*\[)([\s\S]*?)(\];)/;
  const match = code.match(featuresRegex);
  
  if (!match) {
    console.error(`_FEATURES array not found in ${dir}/page.js`);
    return;
  }
  
  const prefix = match[1];
  let arrayContent = match[2].trim();
  const suffix = match[3];
  
  // Append new cards with commas
  newCards.forEach(card => {
    if (arrayContent.length > 0 && !arrayContent.endsWith(',')) {
      arrayContent += ',';
    }
    arrayContent += `\n  ${card}`;
  });
  
  // Format slightly
  const newFeaturesString = `${prefix}\n  ${arrayContent}\n${suffix}`;
  
  code = code.replace(featuresRegex, newFeaturesString);
  fs.writeFileSync(p, code, 'utf8');
  console.log(`Updated ${dir}/page.js with ${newCards.length} new feature card(s).`);
});
