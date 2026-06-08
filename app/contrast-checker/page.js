"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import ToolPageShell from '@/components/ToolPageShell';
import { saveHistory } from '@/lib/storage';

const _FEATURES = [
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Precision Color Picker',
    desc: 'Pick precise pixel colors from any uploaded image using our custom floating magnifier eyedropper.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'WCAG 2.1 Compliance Checks',
    desc: 'Real-time contrast ratio checks for Normal Text, Large Text, and UI Components (AA and AAA compliant).'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m9.9 9.9l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Smart Color Auto-Tuning',
    desc: 'If contrast fails, the tool automatically suggests compliant foreground variations that satisfy WCAG rules.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
    title: 'Dominant Color Extraction',
    desc: 'Automatically extracts the primary color palette of your mockup so you can test color pairs quickly.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: '100% Private & Local',
    desc: 'Color contrast calculations and eyedropper logic are executed locally inside your browser.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M8 12h8m-8 4h6" />
      </svg>
    ),
    title: 'Copy Code Snippets',
    desc: 'One-click copy of foreground and background colors in HEX or CSS format ready for code integration.'
  }
];

const _STEPS = [
  { n: '1', title: 'Upload Mockup', desc: 'Select or drag and drop a design screenshot or site mockup.' },
  { n: '2', title: 'Pick Color Slots', desc: 'Use the magnifying eyedropper to select foreground and background colors.' },
  { n: '3', title: 'Check WCAG Scores', desc: 'View your contrast score, compliance thresholds, and adjust to suggestions.' }
];

const _FAQS = [
  { q: 'What are the WCAG 2.1 compliance requirements?', a: 'Under WCAG 2.1, Level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. Level AAA requires at least 7:1 for normal text and 4.5:1 for large text.' },
  { q: 'How is the contrast ratio calculated?', a: 'It computes the relative luminance of both colors using the WCAG formula (weighting red, green, and blue components based on human eye sensitivity) and divides the lighter luminance by the darker luminance.' },
  { q: 'What does the Auto-Tuner suggest?', a: 'If your color combination fails WCAG compliance, the auto-tuner alters the lightness (L) of the foreground color while keeping the Hue (H) and Saturation (S) identical until a compliant ratio is hit.' }
];

export default function ContrastCheckerPage() {
  const [file, setFile] = useState(null);
  const [foregroundColor, setForegroundColor] = useState('#7342E6');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [activeSlot, setActiveSlot] = useState('fg'); // 'fg' | 'bg'
  const [hoverColor, setHoverColor] = useState('#000000');
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, show: false });
  const [palette, setPalette] = useState([]);
  const [copiedText, setCopiedText] = useState('');

  const imageCanvasRef = useRef(null);
  const magnifierCanvasRef = useRef(null);
  const originalImageRef = useRef(null);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
    } else {
      setFile(null);
      setPalette([]);
    }
  };

  const getRelativeLuminance = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const a = [rgb.r, rgb.g, rgb.b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const calculateContrastRatio = (fg, bg) => {
    const l1 = getRelativeLuminance(fg);
    const l2 = getRelativeLuminance(bg);
    const bright = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return (bright + 0.05) / (dark + 0.05);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return rgbToHex(r, g, b);
  };

  const suggestCompliantColor = (fgHex, bgHex, targetRatio) => {
    const fgRgb = hexToRgb(fgHex);
    if (!fgRgb) return fgHex;
    const fgHsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgL = getRelativeLuminance(bgHex);
    const fgL = getRelativeLuminance(fgHex);

    // If fg is darker than bg, we make it darker. If fg is lighter, we make it lighter.
    const isFgDarker = fgL < bgL;
    let bestHex = fgHex;
    let closestRatioDiff = Infinity;

    for (let l = 0; l <= 100; l += 0.5) {
      const testHex = hslToHex(fgHsl.h, fgHsl.s, l);
      const testRatio = calculateContrastRatio(testHex, bgHex);
      if (testRatio >= targetRatio) {
        const testL = getRelativeLuminance(testHex);
        // Ensure we preserve the relative darkness/lightness direction
        if ((isFgDarker && testL < bgL) || (!isFgDarker && testL > bgL)) {
          const diff = Math.abs(testRatio - targetRatio);
          if (diff < closestRatioDiff) {
            closestRatioDiff = diff;
            bestHex = testHex;
          }
        }
      }
    }
    return bestHex;
  };

  const handleCanvasMouseMove = (e) => {
    if (!imageCanvasRef.current || !magnifierCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const magCanvas = magnifierCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const magCtx = magCanvas.getContext('2d');
    if (!ctx || !magCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Set magnifier position relative to viewport
    setMagnifierPos({
      x: e.clientX - rect.left - 50,
      y: e.clientY - rect.top - 50,
      show: true
    });

    // Inspect pixel color under mouse
    try {
      const p = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = rgbToHex(p[0], p[1], p[2]);
      setHoverColor(hex);

      // Draw zoomed region on magnifier canvas
      const size = 15; // 15x15 source pixels
      const zoom = 6.6; // magnification scale
      magCanvas.width = size * zoom;
      magCanvas.height = size * zoom;

      magCtx.imageSmoothingEnabled = false;
      magCtx.clearRect(0, 0, magCanvas.width, magCanvas.height);

      // Copy source pixels to magnifier canvas
      magCtx.drawImage(
        canvas,
        Math.floor(x) - Math.floor(size / 2),
        Math.floor(y) - Math.floor(size / 2),
        size,
        size,
        0,
        0,
        magCanvas.width,
        magCanvas.height
      );

      // Draw central pixel border highlight
      magCtx.strokeStyle = '#FFFFFF';
      magCtx.lineWidth = 1.5;
      magCtx.strokeRect(
        Math.floor(size / 2) * zoom,
        Math.floor(size / 2) * zoom,
        zoom,
        zoom
      );
      magCtx.strokeStyle = '#000000';
      magCtx.lineWidth = 0.8;
      magCtx.strokeRect(
        Math.floor(size / 2) * zoom - 0.5,
        Math.floor(size / 2) * zoom - 0.5,
        zoom + 1,
        zoom + 1
      );
    } catch (err) {
      // Out of bounds
    }
  };

  const handleCanvasMouseLeave = () => {
    setMagnifierPos(prev => ({ ...prev, show: false }));
  };

  const handleCanvasClick = () => {
    if (activeSlot === 'fg') {
      setForegroundColor(hoverColor);
    } else {
      setBackgroundColor(hoverColor);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Canvas initializer
  useEffect(() => {
    if (!file || !imageCanvasRef.current) return;
    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      originalImageRef.current = img;
      // Cap size to avoid sluggish rendering on massive mockups
      const maxD = 900;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxD || h > maxD) {
        if (w >= h) {
          h = Math.round(maxD * h / w);
          w = maxD;
        } else {
          w = Math.round(maxD * w / h);
          h = maxD;
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      // Extract dominant color palette automatically
      try {
        const paletteCanvas = document.createElement('canvas');
        paletteCanvas.width = 16;
        paletteCanvas.height = 16;
        const pCtx = paletteCanvas.getContext('2d');
        if (pCtx) {
          pCtx.drawImage(img, 0, 0, 16, 16);
          const pData = pCtx.getImageData(0, 0, 16, 16).data;
          const colorsSet = new Set();
          for (let i = 0; i < pData.length; i += 4) {
            const r = pData[i], g = pData[i+1], b = pData[i+2];
            colorsSet.add(rgbToHex(r, g, b));
            if (colorsSet.size >= 8) break;
          }
          setPalette(Array.from(colorsSet));
        }
      } catch (err) {
        console.error(err);
      }
    };
    img.src = file.preview;
  }, [file]);

  const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
  const aaNormal = contrastRatio >= 4.5;
  const aaLarge = contrastRatio >= 3.0;
  const aaaNormal = contrastRatio >= 7.0;
  const aaaLarge = contrastRatio >= 4.5;
  const uiRatio = contrastRatio >= 3.0;

  // Compliant suggestions
  const suggestionAA = suggestCompliantColor(foregroundColor, backgroundColor, 4.5);
  const suggestionAAA = suggestCompliantColor(foregroundColor, backgroundColor, 7.0);

  const cardStyle = {
    background: '#fff',
    border: '1px solid #E4E4EF',
    borderRadius: 20,
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    height: 'fit-content'
  };

  return (
    <ToolPageShell
      title="Color Contrast Checker"
      subtitle="Verify that your mockup elements satisfy standard WCAG 2.1 accessibility criteria local-first."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Inspect contrast ratios of image assets locally. Magnified pixel eyedropper with real-time WCAG accessibility checks and Compliant color suggestions."
    >
      {!file ? (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <UploadBox
            onFileSelect={handleFileSelect}
            acceptedFormats={['.jpg', '.jpeg', '.png']}
            multiple={false}
            buttonLabel="Select Design Screenshot"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
          {/* Left panel: slots & stats */}
          <div className="col-span-1 lg:col-span-5" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F1F7', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111128', margin: 0 }}>Contrast Analysis</h3>
              <button
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Mockup
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Color slots toggler */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  onClick={() => setActiveSlot('fg')}
                  style={{
                    padding: 12, borderRadius: 12, border: `2px solid ${activeSlot === 'fg' ? '#7342E6' : '#E4E4EF'}`,
                    background: activeSlot === 'fg' ? '#F4F0FF' : '#ffffff', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>Foreground</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: foregroundColor, border: '1px solid #E4E4EF', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#111128' }}>{foregroundColor}</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSlot('bg')}
                  style={{
                    padding: 12, borderRadius: 12, border: `2px solid ${activeSlot === 'bg' ? '#7342E6' : '#E4E4EF'}`,
                    background: activeSlot === 'bg' ? '#F4F0FF' : '#ffffff', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>Background</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: backgroundColor, border: '1px solid #E4E4EF', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#111128' }}>{backgroundColor}</span>
                  </div>
                </div>
              </div>

              {/* Direct Hex pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <input type="color" value={foregroundColor} onChange={e => setForegroundColor(e.target.value.toUpperCase())} style={{ width: '100%', height: 32, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                </div>
                <div>
                  <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value.toUpperCase())} style={{ width: '100%', height: 32, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                </div>
              </div>

              {/* Contrast Score Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, background: contrastRatio >= 4.5 ? '#F0FDF4' : '#FFF5F5', border: `1px solid ${contrastRatio >= 4.5 ? '#BBF7D0' : '#FECACA'}`, transition: 'all 0.2s' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: contrastRatio >= 4.5 ? '#16A34A' : '#EF4444', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>Contrast Ratio</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#111128' }}>{contrastRatio.toFixed(2)}:1</span>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 8, background: contrastRatio >= 4.5 ? '#16A34A' : '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                  {contrastRatio >= 7.0 ? 'AAA Pass' : contrastRatio >= 4.5 ? 'AA Pass' : 'Contrast Fail'}
                </div>
              </div>

              {/* WCAG details grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F7F7FB', padding: 14, borderRadius: 14, border: '1px solid #E4E4EF' }}>
                <span style={{ fontSize: 10, fontWeight: 850, color: '#9898B5', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Compliance Standards</span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ fontWeight: 650, color: '#4E4E6D' }}>Normal Text (AA) - 4.5:1</span>
                  <span style={{ fontWeight: 700, color: aaNormal ? '#16A34A' : '#EF4444' }}>{aaNormal ? 'PASS ✓' : 'FAIL ✗'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid #E4E4EF', paddingTop: 8 }}>
                  <span style={{ fontWeight: 650, color: '#4E4E6D' }}>Large Text (AA) - 3.0:1</span>
                  <span style={{ fontWeight: 700, color: aaLarge ? '#16A34A' : '#EF4444' }}>{aaLarge ? 'PASS ✓' : 'FAIL ✗'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid #E4E4EF', paddingTop: 8 }}>
                  <span style={{ fontWeight: 650, color: '#4E4E6D' }}>Normal Text (AAA) - 7.0:1</span>
                  <span style={{ fontWeight: 700, color: aaaNormal ? '#16A34A' : '#EF4444' }}>{aaaNormal ? 'PASS ✓' : 'FAIL ✗'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid #E4E4EF', paddingTop: 8 }}>
                  <span style={{ fontWeight: 650, color: '#4E4E6D' }}>Large Text (AAA) - 4.5:1</span>
                  <span style={{ fontWeight: 700, color: aaaLarge ? '#16A34A' : '#EF4444' }}>{aaaLarge ? 'PASS ✓' : 'FAIL ✗'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid #E4E4EF', paddingTop: 8 }}>
                  <span style={{ fontWeight: 650, color: '#4E4E6D' }}>UI Controls / Icons - 3.0:1</span>
                  <span style={{ fontWeight: 700, color: uiRatio ? '#16A34A' : '#EF4444' }}>{uiRatio ? 'PASS ✓' : 'FAIL ✗'}</span>
                </div>
              </div>

              {/* Color suggestions */}
              {contrastRatio < 7.0 && (
                <div style={{ borderTop: '1px solid #F1F1F7', paddingTop: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Accessibility Suggestions</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contrastRatio < 4.5 && suggestionAA && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA', border: '1px solid #E4E4EF', padding: 8, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4E4E6D' }}>To Pass AA (4.5:1):</span>
                        <button
                          type="button"
                          onClick={() => setForegroundColor(suggestionAA)}
                          style={{ border: 'none', background: '#7342E6', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Use {suggestionAA}
                        </button>
                      </div>
                    )}
                    {suggestionAAA && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA', border: '1px solid #E4E4EF', padding: 8, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4E4E6D' }}>To Pass AAA (7.0:1):</span>
                        <button
                          type="button"
                          onClick={() => setForegroundColor(suggestionAAA)}
                          style={{ border: 'none', background: '#7342E6', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Use {suggestionAAA}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Mockup palette */}
              {palette.length > 0 && (
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Mockup Palette Tones</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {palette.map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          if (activeSlot === 'fg') setForegroundColor(hex);
                          else setBackgroundColor(hex);
                        }}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: hex, border: '1.5px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', cursor: 'pointer' }}
                        title={`Select ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: canvas & picker */}
          <div className="col-span-1 lg:col-span-7" style={{ ...cardStyle, position: 'relative', background: '#F7F7FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start', marginBottom: 12 }}>
              Inspect Mockup (Hover to Magnify, Click to select)
            </span>

            {/* Canvas viewport container */}
            <div style={{ position: 'relative', cursor: 'crosshair', maxWidth: '100%', borderRadius: 12, border: '1px solid #E4E4EF', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <canvas
                ref={imageCanvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick}
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />

              {/* Floating Magnifier Circle */}
              {magnifierPos.show && (
                <div
                  style={{
                    position: 'absolute',
                    left: magnifierPos.x,
                    top: magnifierPos.y,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: '3px solid #7342E6',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    background: '#fff'
                  }}
                >
                  <canvas ref={magnifierCanvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
                </div>
              )}
            </div>

            {/* Hover color bar helper */}
            {magnifierPos.show && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: '#fff', border: '1px solid #E4E4EF', padding: '6px 12px', borderRadius: 9, alignSelf: 'flex-start' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: hoverColor, border: '1px solid #C4C4D9', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4E4E6D' }}>Hover Color:</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#111128' }}>{hoverColor}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
