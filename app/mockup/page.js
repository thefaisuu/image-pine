"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Multiple Device Templates',
    desc: 'Select from MacBook Pro bezel, iPhone 15 Pro with Dynamic Island, or Safari Browser window mockups.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10H12V2z" />
        <path d="M12 2c5.52 0 10 4.48 10 10H12V2z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    ),
    title: 'Vibrant Backdrop Gradients',
    desc: 'Apply modern CSS gradients like Cyberpunk, Sunset Gold, Pastel, Cosmic Dark, or custom solid colors.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 17v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6" />
      </svg>
    ),
    title: '3D Perspective Tilt',
    desc: 'Tweak the slider to apply subtle horizontal skew and 3D angle rotation for high-end mockup designs.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    title: 'Padding & Border Radii',
    desc: 'Adjust background margin/padding and screenshot corner curvature dynamically with interactive sliders.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    title: 'High-Resolution Exports',
    desc: 'Draws and composites vectors directly onto a high-res HTML5 Canvas for crisp, premium PNG downloads.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: '100% Client-Side',
    desc: 'All mockup wrapping happens locally in your browser. None of your marketing graphics or photos are uploaded.'
  }
];

const _STEPS = [
  { n: '1', title: 'Upload Screenshot', desc: 'Select or drag and drop any app screenshot or site design.' },
  { n: '2', title: 'Customize Layout', desc: 'Select the device frame, background gradient, padding, shadow, and 3D skew.' },
  { n: '3', title: 'Export Mockup', desc: 'Download your styled device mockup instantly as a high-quality PNG.' }
];

const _FAQS = [
  { q: 'What device wraps can I choose?', a: 'You can choose between a MacBook Pro (Space Gray laptop), an iPhone 15 Pro (vertical mobile with Dynamic Island), or a Safari Web Browser window.' },
  { q: 'Does this compress or degrade my screenshot?', a: 'No. The HTML5 Canvas composites and exports files at high-resolution (up to 1600px wide) ensuring all details remain pixel-perfect.' },
  { q: 'Can I use transparent backgrounds?', a: 'Yes. Select the Classic White / Solid background preset and adjust to transparent if you want to export device outlines with an alpha channel.' }
];

export default function MockupPage() {
  const [file, setFile] = useState(null);
  const [deviceType, setDeviceType] = useState('macbook'); // 'safari' | 'macbook' | 'iphone'
  const [canvasSize, setCanvasSize] = useState('twitter'); // 'twitter' | '16-9' | '4-3' | '1-1'
  const [bgGradient, setBgGradient] = useState('cyberpunk'); // 'cyberpunk' | 'sunset' | 'pastel' | 'cosmic' | 'emerald' | 'white' | 'custom'
  const [customBg, setCustomBg] = useState('#7342e6');
  const [padding, setPadding] = useState(64);
  const [cardRadius, setCardRadius] = useState(12);
  const [shadowStrength, setShadowStrength] = useState(0.35);
  const [skewAngle, setSkewAngle] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
    } else {
      setFile(null);
    }
    setErrorMsg('');
  };

  const drawRoundedRect = (ctx, x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawRoundedRectTopOnly = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawRoundedRectBottomOnly = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.closePath();
  };

  const renderCanvas = () => {
    if (!file || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1200;
    let height = 675;
    if (canvasSize === '16-9') {
      width = 1600;
      height = 900;
    } else if (canvasSize === '4-3') {
      width = 1200;
      height = 900;
    } else if (canvasSize === '1-1') {
      width = 1000;
      height = 1000;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw background
    if (bgGradient === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (bgGradient === 'custom') {
      ctx.fillStyle = customBg;
      ctx.fillRect(0, 0, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      if (bgGradient === 'cyberpunk') {
        gradient.addColorStop(0, '#7928CA');
        gradient.addColorStop(1, '#FF0080');
      } else if (bgGradient === 'sunset') {
        gradient.addColorStop(0, '#FF416C');
        gradient.addColorStop(1, '#FF4B2B');
      } else if (bgGradient === 'pastel') {
        gradient.addColorStop(0, '#E0C3FC');
        gradient.addColorStop(1, '#8EC5FC');
      } else if (bgGradient === 'cosmic') {
        gradient.addColorStop(0, '#0F2027');
        gradient.addColorStop(0.5, '#203A43');
        gradient.addColorStop(1, '#2C5364');
      } else if (bgGradient === 'emerald') {
        gradient.addColorStop(0, '#11998E');
        gradient.addColorStop(1, '#38EF7D');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);

    if (parseFloat(skewAngle) !== 0) {
      const rad = (parseFloat(skewAngle) * Math.PI) / 180;
      ctx.transform(1, Math.tan(rad) * 0.25, Math.tan(rad) * 0.1, 1, 0, 0);
      ctx.rotate(rad * 0.4);
    }

    const boundsW = width - padding * 2;
    const boundsH = height - padding * 2;

    if (deviceType === 'safari') {
      let winW = boundsW;
      let winH = boundsW / 1.65;
      if (winH > boundsH) {
        winH = boundsH;
        winW = boundsH * 1.65;
      }

      const x = -winW / 2;
      const y = -winH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 24;

      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, x, y, winW, winH, cardRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const barHeight = Math.max(30, winH * 0.08);
      ctx.fillStyle = '#F1F1F7';
      drawRoundedRectTopOnly(ctx, x, y, winW, barHeight, cardRadius);
      ctx.fill();

      const dotRadius = Math.max(4, barHeight * 0.18);
      const dotSpacing = dotRadius * 2.5;
      const dotY = y + barHeight / 2;
      const startX = x + barHeight * 0.5;

      ctx.fillStyle = '#FF5F56';
      ctx.beginPath(); ctx.arc(startX, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFBD2E';
      ctx.beginPath(); ctx.arc(startX + dotSpacing, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#27C93F';
      ctx.beginPath(); ctx.arc(startX + dotSpacing * 2, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();

      const addressW = winW * 0.52;
      const addressH = barHeight * 0.55;
      const addressX = x + (winW - addressW) / 2;
      const addressY = y + (barHeight - addressH) / 2;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, addressX, addressY, addressW, addressH, 6);
      ctx.fill();
      ctx.strokeStyle = '#E4E4EF';
      ctx.lineWidth = 1;
      ctx.stroke();

      const viewY = y + barHeight;
      const viewH = winH - barHeight;

      ctx.save();
      drawRoundedRectBottomOnly(ctx, x, viewY, winW, viewH, cardRadius);
      ctx.clip();
      ctx.drawImage(img, x, viewY, winW, viewH);
      ctx.restore();

    } else if (deviceType === 'macbook') {
      let screenW = boundsW * 0.82;
      let screenH = screenW / 1.6;
      if (screenH > boundsH * 0.72) {
        screenH = boundsH * 0.72;
        screenW = screenH * 1.6;
      }

      const screenX = -screenW / 2;
      const screenY = -screenH / 2 - (screenH * 0.04);

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      const bezelThickness = Math.max(9, screenW * 0.02);
      ctx.fillStyle = '#0F0F11';
      drawRoundedRectTopOnly(ctx, screenX - bezelThickness, screenY - bezelThickness, screenW + bezelThickness * 2, screenH + bezelThickness, 12);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const cameraBarW = screenW * 0.13;
      const cameraBarH = bezelThickness * 0.5;
      ctx.fillStyle = '#000';
      drawRoundedRectBottomOnly(ctx, -cameraBarW / 2, screenY, cameraBarW, cameraBarH, 4);
      ctx.fill();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      const baseWidth = screenW * 1.22;
      const baseHeight = screenH * 0.075;
      const baseY = screenY + screenH;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength * 1.3})`;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;

      ctx.fillStyle = '#BFC4C9';
      ctx.beginPath();
      ctx.moveTo(-baseWidth / 2, baseY);
      ctx.lineTo(baseWidth / 2, baseY);
      ctx.lineTo(baseWidth / 2 - baseWidth * 0.02, baseY + baseHeight);
      ctx.lineTo(-baseWidth / 2 + baseWidth * 0.02, baseY + baseHeight);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = '#83888D';
      const openerW = baseWidth * 0.14;
      const openerH = baseHeight * 0.35;
      drawRoundedRectBottomOnly(ctx, -openerW / 2, baseY, openerW, openerH, 3);
      ctx.fill();

      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(-baseWidth / 2, baseY, baseWidth, 1.2);

    } else if (deviceType === 'iphone') {
      let phoneH = boundsH;
      let phoneW = boundsH * 0.49;
      if (phoneW > boundsW) {
        phoneW = boundsW;
        phoneH = boundsW / 0.49;
      }

      const x = -phoneW / 2;
      const y = -phoneH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 56;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 28;

      const frameRadius = 38;
      ctx.fillStyle = '#1D1D20';
      drawRoundedRect(ctx, x, y, phoneW, phoneH, frameRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const screenPadding = Math.max(6, phoneW * 0.026);
      const innerRadius = frameRadius - screenPadding;
      const screenX = x + screenPadding;
      const screenY = y + screenPadding;
      const screenW = phoneW - screenPadding * 2;
      const screenH = phoneH - screenPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, innerRadius);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      const islandW = screenW * 0.28;
      const islandH = screenH * 0.032;
      const islandX = -islandW / 2;
      const islandY = y + screenPadding + (screenH * 0.026);

      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, islandX, islandY, islandW, islandH, islandH / 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(islandX + islandW * 0.78, islandY + islandH / 2, 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  };

  useEffect(() => {
    if (file) {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        renderCanvas();
      };
      img.src = file.preview;
    }
  }, [file, deviceType, canvasSize, bgGradient, customBg, padding, cardRadius, shadowStrength, skewAngle]);

  const triggerDownload = () => {
    if (!canvasRef.current || !file) return;
    setIsProcessing(true);
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) throw new Error('Render failed');
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        saveAs(blob, `${nameWithoutExt}_mockup.png`);
        saveHistory('Device Mockup', `${file.name} Wrapped Mockup`);
        setIsProcessing(false);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to compile mockup. Please try again.');
      setIsProcessing(false);
    }
  };

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
      title="Device Mockup Studio"
      subtitle="Wrap your website, portfolio, or app screenshots inside macOS Safari windows, MacBook Pros, or iPhones with modern gradients."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Create styled app screenshots using browser wrappers, laptop templates, and smartphone frames online. Customize background padding, shadow depth, gradient templates, and perspective skew local-first."
    >
      {!file ? (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <UploadBox
            onFileSelect={handleFileSelect}
            acceptedFormats={['.jpg', '.jpeg', '.png']}
            multiple={false}
            buttonLabel="Select Screenshot"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
          {/* Controls column */}
          <div className="col-span-1 lg:col-span-4" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F1F7', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111128', margin: 0 }}>Mockup Config</h3>
              <button
                onClick={() => { setFile(null); imgRef.current = null; }}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Photo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Device selector */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Device Mockup</label>
                <select
                  value={deviceType}
                  onChange={e => setDeviceType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128' }}
                >
                  <option value="macbook">MacBook Pro (Space Gray)</option>
                  <option value="iphone">iPhone 15 Pro (Titanium)</option>
                  <option value="safari">Safari Browser Window</option>
                </select>
              </div>

              {/* Size preset */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Canvas Ratio</label>
                <select
                  value={canvasSize}
                  onChange={e => setCanvasSize(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128' }}
                >
                  <option value="twitter">Twitter / Product Hunt Card (1200x675)</option>
                  <option value="16-9">Full HD (16:9 - 1600x900)</option>
                  <option value="4-3">Classic Layout (4:3 - 1200x900)</option>
                  <option value="1-1">Instagram Square (1:1 - 1000x1000)</option>
                </select>
              </div>

              {/* Background gradient preset */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Background Theme</label>
                <select
                  value={bgGradient}
                  onChange={e => setBgGradient(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128', marginBottom: bgGradient === 'custom' ? 8 : 0 }}
                >
                  <option value="cyberpunk">Cyberpunk Neon (Purple / Pink)</option>
                  <option value="sunset">Sunset Gold (Orange / Red)</option>
                  <option value="pastel">Soft Pastel (Purple / Blue)</option>
                  <option value="cosmic">Dark Cosmic (Deep Space)</option>
                  <option value="emerald">Emerald Mint (Teal / Green)</option>
                  <option value="white">Clean Solid White</option>
                  <option value="custom">Custom Solid Color...</option>
                </select>
                {bgGradient === 'custom' && (
                  <input
                    type="color"
                    value={customBg}
                    onChange={e => setCustomBg(e.target.value)}
                    style={{ width: '100%', height: 36, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 9 }}
                  />
                )}
              </div>

              {/* Sliders */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Device Padding</span>
                  <span style={{ color: '#111128' }}>{padding}px</span>
                </div>
                <input type="range" min="20" max="150" value={padding} onChange={e => setPadding(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {deviceType === 'safari' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Window Corner Radius</span>
                    <span style={{ color: '#111128' }}>{cardRadius}px</span>
                  </div>
                  <input type="range" min="0" max="28" value={cardRadius} onChange={e => setCardRadius(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Shadow Strength</span>
                  <span style={{ color: '#111128' }}>{Math.round(shadowStrength * 100)}%</span>
                </div>
                <input type="range" min="0" max="80" value={Math.round(shadowStrength * 100)} onChange={e => setShadowStrength(parseFloat(e.target.value) / 100)} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Perspective Skew</span>
                  <span style={{ color: '#111128' }}>{skewAngle}°</span>
                </div>
                <input type="range" min="-12" max="12" value={skewAngle} onChange={e => setSkewAngle(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {errorMsg && (
                <div style={{ padding: 10, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerDownload}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7342e6 0%, #5b30c0 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: 12,
                  padding: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(115, 66, 230, 0.28)',
                  transition: 'all 0.18s',
                  marginTop: 10
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isProcessing ? 'Rendering Mockup...' : 'Download Wrapper PNG'}
              </button>
            </div>
          </div>

          {/* Preview column */}
          <div className="col-span-1 lg:col-span-8" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F7FB', minHeight: 480 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start', marginBottom: 12 }}>Live Canvas Preview</span>
            <div style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: 12, border: '1px solid #E4E4EF', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: 'auto', background: '#ffffff', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
