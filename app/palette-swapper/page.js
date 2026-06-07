"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1010 10"/></svg>), title: 'Quantization Extraction', desc: 'Identify and isolate the 5 most visually dominant color tones automatically.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v18M3 12h18"/></svg>), title: 'Luminance Preservation', desc: 'Recolor hues in HSL space, preserving highlights and textures cleanly.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7l7 5z"/></svg>), title: 'Dual-Palette Swapping', desc: 'Upload a reference image to extract and clone its palette onto your photo.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8h16M4 16h16"/></svg>), title: 'Tolerance Controls', desc: 'Fine-tune threshold sliders to expand or constrict target match zones.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>), title: 'Preset Filters', desc: 'Quickly style with premium themes like Cyberpunk, Autumn, or Retro Pastel.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: '100% Client-Side', desc: 'Secure local processing. Your images are recolored completely inside your browser.' }
];

const _STEPS = [
  { n: '1', title: 'Upload Image', desc: 'Select any digital illustration or photograph.' },
  { n: '2', title: 'Swap Color Tones', desc: 'Adjust color swatches or apply pre-built themes.' },
  { n: '3', title: 'Download Output', desc: 'Download high-quality JPEG/PNG copies locally.' }
];

const _FAQS = [
  { q: 'How does the Swapper preserve highlights and shadows?', a: 'Instead of coloring pixels with a solid flat hex code, our engine converts pixels from RGB to HSL color space. It modifies only the Hue and Saturation while leaving the original Lightness (texture, shade, and luminosity) untouched.' },
  { q: 'What does the Tolerance slider do?', a: 'The tolerance slider expands the color distance range (measured via Euclidean distance). Higher tolerance recolors a wider range of similar shades, while lower tolerance matches only identical pixel colors.' },
  { q: 'Can I copy a palette from another photo?', a: 'Yes! Simply use the "Load Reference Palette" option, select any image, and its dominant color tones will automatically map as target replacement options.' }
];

// Helper functions for HSL <-> RGB
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export default function PaletteSwapperPage() {
  const [file, setFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [colors, setColors] = useState([]);
  const [tolerance, setTolerance] = useState(50);
  const [fuzziness, setFuzziness] = useState(25);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previewCanvasRef = useRef(null);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      const selected = selectedList[0];
      setFile(selected);
      setColors([]);
      setErrorMsg('');

      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        extractPalette(img);
      };
      img.src = selected.preview || URL.createObjectURL(selected);
    } else {
      setFile(null);
      setImageObj(null);
      setColors([]);
    }
  };

  const extractPalette = (img) => {
    try {
      const canvas = document.createElement('canvas');
      const size = 64; // downsample to speed up
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size).data;

      const colorCounts = {};
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 128) continue;

        const qr = Math.round(r / 12) * 12;
        const qg = Math.round(g / 12) * 12;
        const qb = Math.round(b / 12) * 12;

        const key = `${qr},${qg},${qb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .map(([key, count]) => {
          const [r, g, b] = key.split(',').map(Number);
          return { r, g, b, count };
        })
        .sort((a, b) => b.count - a.count);

      const palette = [];
      const threshold = 40;

      for (const candidate of sortedColors) {
        if (palette.length >= 5) break;

        let isDistinct = true;
        for (const selected of palette) {
          const distance = Math.hypot(
            candidate.r - selected.r,
            candidate.g - selected.g,
            candidate.b - selected.b
          );
          if (distance < threshold) {
            isDistinct = false;
            break;
          }
        }

        if (isDistinct) {
          palette.push(candidate);
        }
      }

      // Fill up if needed
      if (palette.length < 5) {
        for (const candidate of sortedColors) {
          if (palette.length >= 5) break;
          if (!palette.some(p => p.r === candidate.r && p.g === candidate.g && p.b === candidate.b)) {
            palette.push(candidate);
          }
        }
      }

      setColors(palette.map((c, i) => {
        const hex = toHex(c.r, c.g, c.b);
        return {
          id: i,
          r: c.r,
          g: c.g,
          b: c.b,
          originalHex: hex,
          targetHex: hex
        };
      }));
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to analyze image colors.');
    }
  };

  // Extract from Reference Image
  const handleReferenceSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const refFile = e.target.files[0];
    const img = new Image();
    img.onload = () => {
      // Extract up to 5 colors from the reference image
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts = {};
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i]; const g = imgData[i + 1]; const b = imgData[i + 2]; const a = imgData[i + 3];
          if (a < 128) continue;
          const key = `${Math.round(r/15)*15},${Math.round(g/15)*15},${Math.round(b/15)*15}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts)
          .map(([k, c]) => { const [r,g,b]=k.split(',').map(Number); return { r, g, b, count: c }; })
          .sort((a,b)=>b.count - a.count);
        
        // Select distinct colors
        const refPalette = [];
        for (const candidate of sorted) {
          if (refPalette.length >= colors.length) break;
          let ok = true;
          for (const s of refPalette) {
            if (Math.hypot(candidate.r-s.r, candidate.g-s.g, candidate.b-s.b) < 45) { ok = false; break; }
          }
          if (ok) refPalette.push(candidate);
        }

        // Apply to targets
        setColors(prev => prev.map((item, idx) => {
          if (refPalette[idx]) {
            return { ...item, targetHex: toHex(refPalette[idx].r, refPalette[idx].g, refPalette[idx].b) };
          }
          return item;
        }));
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to process reference image.');
      }
    };
    img.src = URL.createObjectURL(refFile);
  };

  const updateTargetColor = (id, newHex) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, targetHex: newHex } : c));
  };

  const applyPreset = (presetName) => {
    const presets = {
      cyberpunk: ['#FF0055', '#00FFCC', '#9900FF', '#FFFF00', '#001122'],
      autumn: ['#E65C00', '#F9D423', '#8A0F14', '#D4A373', '#3F2305'],
      pastel: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'],
      grayscale: ['#FFFFFF', '#D1D1E4', '#9898B5', '#4E4E6A', '#111128'],
    };

    const targetList = presets[presetName];
    if (targetList) {
      setColors(prev => prev.map((c, i) => ({
        ...c,
        targetHex: targetList[i % targetList.length]
      })));
    }
  };

  const resetColors = () => {
    setColors(prev => prev.map(c => ({ ...c, targetHex: c.originalHex })));
  };

  // Recoloring core loop
  const recolorImageData = (srcData, dstData, swaps, tol, fuzz) => {
    const parsedSwaps = swaps.map(s => {
      const srcHsl = rgbToHsl(s.src.r, s.src.g, s.src.b);
      const dstHsl = rgbToHsl(s.dst.r, s.dst.g, s.dst.b);
      return {
        src: s.src,
        dst: s.dst,
        srcHsl,
        dstHsl
      };
    });

    for (let i = 0; i < srcData.length; i += 4) {
      const r = srcData[i];
      const g = srcData[i + 1];
      const b = srcData[i + 2];
      const a = srcData[i + 3];

      dstData[i] = r;
      dstData[i + 1] = g;
      dstData[i + 2] = b;
      dstData[i + 3] = a;

      if (a < 10) continue;

      // Find closest swap
      let minDist = Infinity;
      let closestSwap = null;

      for (const swap of parsedSwaps) {
        const dist = Math.hypot(r - swap.src.r, g - swap.src.g, b - swap.src.b);
        if (dist < minDist) {
          minDist = dist;
          closestSwap = swap;
        }
      }

      if (closestSwap && minDist < tol + fuzz) {
        let blendFactor = 1.0;
        if (minDist > tol && fuzz > 0) {
          blendFactor = 1.0 - (minDist - tol) / fuzz;
        }

        // Preserve original pixel HSL Lightness (Luminosity)
        const origHsl = rgbToHsl(r, g, b);
        
        // Target HSL
        const targetH = closestSwap.dstHsl.h;
        const targetS = closestSwap.dstHsl.s;

        // Interpolate H/S based on blendFactor
        const finalH = origHsl.h + (targetH - origHsl.h) * blendFactor;
        const finalS = origHsl.s + (targetS - origHsl.s) * blendFactor;

        const newRgb = hslToRgb(finalH, finalS, origHsl.l);

        dstData[i] = newRgb.r;
        dstData[i + 1] = newRgb.g;
        dstData[i + 2] = newRgb.b;
      }
    }
  };

  // Render preview canvas (runs on downsampled/optimized boundaries for speed)
  useEffect(() => {
    if (!imageObj || !colors.length || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = imageObj.naturalWidth || imageObj.width;
    const h = imageObj.naturalHeight || imageObj.height;

    // Downscale preview size for instant rendering
    const maxD = 720;
    let pW = w, pH = h;
    if (w > maxD || h > maxD) {
      if (w >= h) {
        pW = maxD;
        pH = Math.round(maxD * h / w);
      } else {
        pH = maxD;
        pW = Math.round(maxD * w / h);
      }
    }

    canvas.width = pW;
    canvas.height = pH;

    ctx.drawImage(imageObj, 0, 0, pW, pH);
    const imgDataObj = ctx.getImageData(0, 0, pW, pH);
    const dstDataObj = ctx.createImageData(pW, pH);

    const swaps = colors.map(c => ({
      src: { r: c.r, g: c.g, b: c.b },
      dst: hexToRgb(c.targetHex)
    }));

    recolorImageData(imgDataObj.data, dstDataObj.data, swaps, tolerance, fuzziness);
    ctx.putImageData(dstDataObj, 0, 0);
  }, [colors, tolerance, fuzziness, imageObj]);

  const handleDownload = () => {
    if (!imageObj || !colors.length) return;

    setIsProcessing(true);
    setErrorMsg('');

    // Wait a brief tick to let UI loader show
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create high-resolution rendering context.');

        ctx.drawImage(imageObj, 0, 0);
        const imgDataObj = ctx.getImageData(0, 0, w, h);
        const dstDataObj = ctx.createImageData(w, h);

        const swaps = colors.map(c => ({
          src: { r: c.r, g: c.g, b: c.b },
          dst: hexToRgb(c.targetHex)
        }));

        recolorImageData(imgDataObj.data, dstDataObj.data, swaps, tolerance, fuzziness);
        ctx.putImageData(dstDataObj, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newName = `${baseName}_recolored.png`;
            saveAs(blob, newName);
            saveHistory('Palette Swapper', newName);
          } else {
            setErrorMsg('Export failed.');
          }
          setIsProcessing(false);
        }, 'image/png');
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Error processing high-resolution image.');
        setIsProcessing(false);
      }
    }, 100);
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #E4E4EF',
    borderRadius: 20,
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    height: 'fit-content'
  };

  return (
    <ToolPageShell
      title="Color Swapper & Image Recolorer"
      subtitle="Identify the dominant colors in any photo and replace them with custom shades instantly. Uses texture-protecting HSL logic."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free browser-based color swapper recoloring tool. Extract dominant colors, replace image background colors or accents, and preserve texture depth locally."
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox
              onFileSelect={handleFileSelect}
              acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
              multiple={false}
              buttonLabel="Upload Image to Recolor"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
            {/* Left: Swapping Controls */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* Presets Card */}
              <div style={cardStyle}>
                <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider mb-3">Color Themes</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => applyPreset('cyberpunk')} className="py-2 text-[10px] font-bold rounded-lg border border-bordercolor bg-lightbg/10 text-textmain hover:bg-lightbg/20 transition-all">Cyberpunk</button>
                  <button onClick={() => applyPreset('autumn')} className="py-2 text-[10px] font-bold rounded-lg border border-bordercolor bg-lightbg/10 text-textmain hover:bg-lightbg/20 transition-all">Autumn</button>
                  <button onClick={() => applyPreset('pastel')} className="py-2 text-[10px] font-bold rounded-lg border border-bordercolor bg-lightbg/10 text-textmain hover:bg-lightbg/20 transition-all">Retro Pastel</button>
                  <button onClick={() => applyPreset('grayscale')} className="py-2 text-[10px] font-bold rounded-lg border border-bordercolor bg-lightbg/10 text-textmain hover:bg-lightbg/20 transition-all">Grayscale</button>
                </div>
              </div>

              {/* Swaps Swatches List */}
              <div style={cardStyle}>
                <div className="flex justify-between items-center pb-2 border-b border-bordercolor mb-4">
                  <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Color Mapping</h3>
                  <button onClick={resetColors} className="text-[10px] font-extrabold text-red-500 hover:underline">Reset</button>
                </div>

                <div className="flex flex-col gap-3">
                  {colors.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 bg-lightbg/10 border border-bordercolor/40 p-2.5 rounded-xl">
                      {/* Source Swatch */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div style={{ backgroundColor: c.originalHex, width: 26, height: 26, borderRadius: 6, border: '1px solid #E4E4EF' }} />
                        <span className="text-[11px] font-bold text-gray-500 font-mono">{c.originalHex}</span>
                      </div>

                      {/* Arrow divider */}
                      <span className="text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                      </span>

                      {/* Target Swatch / Picker */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <input
                          type="color"
                          value={c.targetHex}
                          onChange={(e) => updateTargetColor(c.id, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-bordercolor bg-none p-0"
                        />
                        <span className="text-[11px] font-bold text-primary font-mono">{c.targetHex}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reference upload */}
                <div className="mt-4 pt-4 border-t border-bordercolor/60">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Clone Palette from Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceSelect}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#EDEDFB] file:text-primary file:hover:bg-[#D8D8F5] cursor-pointer"
                  />
                </div>
              </div>

              {/* Fine tuning controls */}
              <div style={cardStyle}>
                <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider mb-4">Threshold Fine-Tuning</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Color Tolerance</span>
                      <span>{tolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      value={tolerance}
                      onChange={(e) => setTolerance(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Edge Fuzziness</span>
                      <span>{fuzziness}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={fuzziness}
                      onChange={(e) => setFuzziness(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Preview & Download */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="flex justify-between items-center pb-2 border-b border-bordercolor">
                  <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Recolored Preview</h4>
                  <button onClick={() => { setFile(null); setImageObj(null); setColors([]); }} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                </div>

                <div style={{ border: "1.5px solid #E4E4EF", borderRadius: 14, padding: 12, minHeight: 380, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px" }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      maxHeight: 460,
                      maxWidth: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                      display: "block"
                    }}
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-500 font-bold leading-relaxed">{errorMsg}</p>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleDownload}
                    style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(22,163,74,0.38)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.28)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {isProcessing ? 'Generating Recolor...' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Download Recolored PNG
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
