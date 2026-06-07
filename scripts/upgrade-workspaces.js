/**
 * upgrade-workspaces.js
 * Upgrades the upload box container and workspace card styling
 * across all tool pages to match the premium design.
 */
const fs = require('fs');
const path = require('path');

const appDir = 'app';
const dirs = fs.readdirSync(appDir).filter(d => {
  try { return fs.statSync(path.join(appDir, d)).isDirectory(); } catch { return false; }
});

let upgraded = 0, skipped = 0;

dirs.forEach(dir => {
  const filePath = path.join(appDir, dir, 'page.js');
  if (!fs.existsSync(filePath)) { skipped++; return; }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // ── 1. Upgrade upload-only container: small cramped card → wider centered card
  // Old pattern: className="bg-white rounded-2xl border border-bordercolor p-8 shadow-sm max-w-xl mx-auto w-full"
  // New: wider, more padding, centered
  if (content.includes('max-w-xl mx-auto w-full')) {
    content = content.replaceAll(
      'className="bg-white rounded-2xl border border-bordercolor p-8 shadow-sm max-w-xl mx-auto w-full"',
      'style={{ maxWidth: 680, margin: "0 auto", background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "48px 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}'
    );
    changed = true;
  }

  // ── 2. Upgrade workspace cards: className="bg-white rounded-2xl border border-bordercolor p-5 shadow-sm h-fit flex flex-col gap-4"
  // → premium style card
  if (content.includes('className="bg-white rounded-2xl border border-bordercolor p-5 shadow-sm h-fit flex flex-col gap-4"')) {
    content = content.replaceAll(
      'className="bg-white rounded-2xl border border-bordercolor p-5 shadow-sm h-fit flex flex-col gap-4"',
      'style={{ background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", height: "fit-content", display: "flex", flexDirection: "column", gap: 16 }}'
    );
    changed = true;
  }

  // ── 3. Upgrade main workspace (right/col-span-2) cards
  if (content.includes('className="lg:col-span-2 bg-white rounded-2xl border border-bordercolor p-6 shadow-sm flex flex-col gap-6"')) {
    content = content.replaceAll(
      'className="lg:col-span-2 bg-white rounded-2xl border border-bordercolor p-6 shadow-sm flex flex-col gap-6"',
      'style={{ gridColumn: "span 2 / span 2", background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 22 }}'
    );
    changed = true;
  }

  // ── 4. Upgrade section labels: className="text-xs font-bold uppercase tracking-wider text-gray-400"
  // Make them proper uppercase labels
  if (content.includes('className="text-xs font-bold uppercase tracking-wider text-gray-400"')) {
    content = content.replaceAll(
      'className="text-xs font-bold uppercase tracking-wider text-gray-400"',
      'style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}'
    );
    changed = true;
  }

  // ── 5. Upgrade action primary button
  const oldPrimaryBtn = 'className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"';
  if (content.includes(oldPrimaryBtn)) {
    content = content.replaceAll(
      oldPrimaryBtn,
      'style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(91,91,214,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}'
    );
    changed = true;
  }

  // ── 6. Upgrade download/success button
  const oldSuccessBtn = 'className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 animate-bounce"';
  if (content.includes(oldSuccessBtn)) {
    content = content.replaceAll(
      oldSuccessBtn,
      'style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}'
    );
    changed = true;
  }

  // ── 7. Upgrade preview box
  const oldPreview = 'className="border border-bordercolor rounded-xl p-4 bg-lightbg/60 min-h-[220px] flex items-center justify-center relative overflow-hidden"';
  if (content.includes(oldPreview)) {
    content = content.replaceAll(
      oldPreview,
      'style={{ border: "1.5px solid #E4E4EF", borderRadius: 14, padding: 16, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px" }}'
    );
    changed = true;
  }

  // ── 8. Upgrade alternate preview box variant
  const oldPreview2 = 'className="border border-bordercolor rounded-xl p-4 bg-lightbg/60 min-h-[220px] flex items-center justify-center relative overflow-hidden group"';
  if (content.includes(oldPreview2)) {
    content = content.replaceAll(
      oldPreview2,
      'style={{ border: "1.5px solid #E4E4EF", borderRadius: 14, padding: 16, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px" }}'
    );
    changed = true;
  }

  // ── 9. Remove the duplicate "use client" at the top (leftover from previous script)
  if (content.startsWith('"use client";\n\n"use client";')) {
    content = content.replace('"use client";\n\n"use client";', '"use client";');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Upgraded: ${dir}`);
    upgraded++;
  } else {
    console.log(`○ Skipped (already updated or different pattern): ${dir}`);
    skipped++;
  }
});

console.log(`\nDone! Upgraded: ${upgraded}, Skipped: ${skipped}`);
