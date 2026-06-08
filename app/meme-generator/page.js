"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>), title: 'Classic Meme Style', desc: 'Render captions in the iconic Impact font with bold outlines.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M19 8l-7 7-3-3"/></svg>), title: 'Draggable Text', desc: 'Click and drag text directly on the canvas to place it perfectly.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>), title: '100% Private', desc: 'All meme rendering happens client-side. Your photos are safe.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4"/></svg>), title: 'High-Res Export', desc: 'Export memes at full resolution with no compression loss.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v18M3 12h18"/></svg>), title: 'Customized Outlines', desc: 'Adjust text size, outline color, and shadow styling to make captions pop.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>), title: 'Multi-Image Templates', desc: 'Upload any custom photo or layout template as the canvas backdrop.' }
];

const _STEPS = [
  { n: '1', title: 'Choose base image', desc: 'Select a popular template from our grid or upload your own.' },
  { n: '2', title: 'Edit captions', desc: 'Type directly in the text boxes on-screen and drag them.' },
  { n: '3', title: 'Download', desc: 'Generate and download your meme instantly.' }
];

const _FAQS = [
  { q: 'Can I upload my own image?', a: 'Yes! Click "Upload Custom Image" or the first card in the grid to load any local JPEG, PNG, or WebP file.' },
  { q: 'How do I edit or move the text?', a: 'You can type directly into the text fields overlaid on the image, and drag them anywhere using the circular handle on top of each box.' },
  { q: 'Is there a watermark on exported memes?', a: 'No. ImagePine is completely free and does not add any watermarks to your creations.' },
  { q: 'Does it work with transparent PNG files?', a: 'Yes. PNG transparency is preserved in the final generated meme.' }
];

export default function MemeGeneratorPage() {
  const [file, setFile] = useState(null);
  const [topText, setTopText] = useState('TOP CAPTION');
  const [bottomText, setBottomText] = useState('BOTTOM CAPTION');
  const [fontSize, setFontSize] = useState(40);
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [allCaps, setAllCaps] = useState(true);
  
  // Custom font size settings per text
  const [topFontSize, setTopFontSize] = useState(44);
  const [bottomFontSize, setBottomFontSize] = useState(44);

  // Dragging states
  const [topPos, setTopPos] = useState({ x: 0.5, y: 0.12 }); // relative (0 to 1)
  const [bottomPos, setBottomPos] = useState({ x: 0.5, y: 0.88 }); // relative (0 to 1)
  const [draggingItem, setDraggingItem] = useState(null); // 'top' | 'bottom' | null

  // Templates states
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch templates on mount
  useEffect(() => {
    setLoadingTemplates(true);
    fetch('https://api.imgflip.com/get_memes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.data.memes);
        }
      })
      .catch(err => console.error('Error fetching templates:', err))
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Handle file select
  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
      setTopPos({ x: 0.5, y: 0.12 });
      setBottomPos({ x: 0.5, y: 0.88 });
    } else {
      setFile(null);
      setTopPos({ x: 0.5, y: 0.12 });
      setBottomPos({ x: 0.5, y: 0.88 });
    }
    setErrorMsg('');
  };

  const selectTemplate = (template) => {
    setFile({
      preview: template.url,
      name: template.name,
      type: 'image/jpeg',
      size: 0,
      isTemplate: true
    });
    setTopPos({ x: 0.5, y: 0.12 });
    setBottomPos({ x: 0.5, y: 0.88 });
    setErrorMsg('');
  };

  // Re-draw canvas whenever variables change
  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Support external template images without tainting canvas
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setImageSize({ width: w, height: h });
      canvas.width = w;
      canvas.height = h;

      // Draw background image
      ctx.drawImage(img, 0, 0);

      // Set font styles
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineJoin = 'round';

      const tText = allCaps ? topText.toUpperCase() : topText;
      const bText = allCaps ? bottomText.toUpperCase() : bottomText;

      // Draw Top Text
      if (tText) {
        const topSize = Math.round(w * (topFontSize / 500));
        ctx.font = `900 ${topSize}px Impact, Arial Black, sans-serif`;
        ctx.lineWidth = Math.max(2, Math.round(topSize * (strokeWidth / 40)));
        
        const tx = topPos.x !== null ? topPos.x * w : w / 2;
        const ty = topPos.y !== null ? topPos.y * h : h * 0.15;
        
        ctx.strokeText(tText, tx, ty);
        ctx.fillText(tText, tx, ty);
      }

      // Draw Bottom Text
      if (bText) {
        const bottomSize = Math.round(w * (bottomFontSize / 500));
        ctx.font = `900 ${bottomSize}px Impact, Arial Black, sans-serif`;
        ctx.lineWidth = Math.max(2, Math.round(bottomSize * (strokeWidth / 40)));

        const bx = bottomPos.x !== null ? bottomPos.x * w : w / 2;
        const by = bottomPos.y !== null ? bottomPos.y * h : h * 0.85;

        ctx.strokeText(bText, bx, by);
        ctx.fillText(bText, bx, by);
      }
    };
    img.src = file.preview || URL.createObjectURL(file);
  }, [file, topText, bottomText, topFontSize, bottomFontSize, strokeWidth, allCaps, topPos, bottomPos]);

  // Handle Drag & Drop on canvas
  const getCanvasMousePos = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Support touches
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width);
    const y = ((clientY - rect.top) / rect.height);
    return { x, y };
  };

  const handleMouseMove = (e) => {
    if (!draggingItem || !file) return;
    const { x, y } = getCanvasMousePos(e);
    
    // Clamp to bounds
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    if (draggingItem === 'top') {
      setTopPos({ x: clampedX, y: clampedY });
    } else if (draggingItem === 'bottom') {
      setBottomPos({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
  };

  const downloadMeme = () => {
    if (!canvasRef.current || !file) return;
    setIsProcessing(true);
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const ext = file.isTemplate ? 'jpg' : (file.name.split('.').pop() || 'jpg');
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const newName = `${baseName}_meme.${ext}`;
        saveAs(blob, newName);
        saveHistory('Meme Generator', newName);
      } else {
        setErrorMsg('Could not export canvas.');
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.95);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <ToolPageShell
      title="Meme Generator"
      subtitle="Create custom memes instantly in your browser. Add draggable text, type directly on the screen, and download in high quality."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free browser-based Meme Generator. Add bold text to images, drag captions, edit inline on screen, and export with zero watermarks. Private and fast."
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Search and upload bar */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #E4E4EF', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
                <input
                  type="text"
                  placeholder="Search popular meme templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px 10px 38px',
                    background: '#F7F7FB', border: '1px solid #E4E4EF',
                    borderRadius: 10, fontSize: 13, fontWeight: 600,
                    outline: 'none', color: '#111128'
                  }}
                />
                <svg style={{ position: 'absolute', left: 12, top: 12, color: '#9898B5' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => document.querySelector('input[type="file"]')?.click()}
                style={{
                  background: 'linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)',
                  color: '#fff', fontWeight: 800, fontSize: 13, padding: '11px 22px',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(91,91,214,0.25)', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Upload Custom Image
              </button>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) handleFileSelect(files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Grid of templates */}
            {loadingTemplates ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <svg style={{ animation: 'spin 1s linear infinite', width: 28, height: 28, color: '#5B5BD6' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                {/* Upload box card trigger */}
                <div
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  style={{
                    border: '2.5px dashed #D1D1E4', borderRadius: 16, padding: 20,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 12, cursor: 'pointer', background: '#fff', minHeight: 200, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B5BD6'; e.currentTarget.style.background = '#EDEDFB'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D1E4'; e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EDEDFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B5BD6' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#5B5BD6', textAlign: 'center' }}>Upload Custom Image</span>
                </div>

                {/* Templates from Imgflip */}
                {templates
                  .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 47)
                  .map(meme => (
                    <div
                      key={meme.id}
                      onClick={() => selectTemplate(meme)}
                      style={{
                        background: '#fff', border: '1px solid #E4E4EF', borderRadius: 16,
                        padding: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)', transition: 'all 0.18s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B5BD6'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4EF'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ width: '100%', height: 140, overflow: 'hidden', borderRadius: 12, background: '#F7F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={meme.url} alt={meme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#111128', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }} title={meme.name}>
                        {meme.name}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Image Info */}
            <div className="lg:col-span-3" style={{ background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", height: "fit-content", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="flex justify-between items-center pb-2 border-b border-bordercolor">
                <h3 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Meme Template
                </h3>
                <button onClick={() => handleFileSelect([])} className="text-xs font-bold text-red-500 hover:underline">
                  Remove
                </button>
              </div>

              <div className="p-3 bg-lightbg/45 border border-bordercolor/60 rounded-xl flex items-center gap-3">
                {file.preview && (
                  <img
                    src={file.preview}
                    alt="Template"
                    className="w-12 h-12 object-cover rounded-lg border border-bordercolor"
                  />
                )}
                <div className="min-w-0 flex-grow">
                  <p className="text-xs font-bold text-textmain truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {file.isTemplate ? 'Meme Template' : formatSize(file.size)} · {imageSize.width} × {imageSize.height}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-bordercolor/40">
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                  💡 <strong>Tip:</strong> Click directly on the text overlay on screen to edit captions. Use the circular handle (✥) above each text block to drag them around!
                </p>
              </div>
            </div>

            {/* Middle Column: Meme Canvas */}
            <div className="lg:col-span-6" style={{ background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="flex justify-between items-center">
                <h4 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Live Editor
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    id="allCaps"
                    checked={allCaps}
                    onChange={(e) => setAllCaps(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#5B5BD6' }}
                  />
                  <label htmlFor="allCaps" className="text-xs font-bold text-textmain select-none cursor-pointer">
                    ALL CAPS
                  </label>
                </div>
              </div>

              <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                style={{ 
                  border: "1.5px solid #E4E4EF", 
                  borderRadius: 14, 
                  padding: 12, 
                  minHeight: 380, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  position: "relative", 
                  overflow: "hidden", 
                  background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                  cursor: draggingItem ? 'grabbing' : 'auto'
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <canvas
                    ref={canvasRef}
                    style={{ 
                      maxHeight: 480, 
                      maxWidth: "100%", 
                      objectFit: "contain", 
                      borderRadius: 8, 
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
                      display: "block" 
                    }}
                  />
                  {/* Interactive Text Overlay */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    
                    {/* Top Caption Input */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(topPos.x ?? 0.5) * 100}%`,
                        top: `${(topPos.y ?? 0.15) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10
                      }}
                    >
                      {/* Drag Handle */}
                      <div
                        style={{
                          cursor: 'grab',
                          background: '#5B5BD6',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          marginBottom: 4,
                          opacity: 0.9,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingItem('top'); }}
                        onTouchStart={(e) => { e.stopPropagation(); setDraggingItem('top'); }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={topText}
                        onChange={(e) => setTopText(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: '1.5px dashed rgba(255,255,255,0.4)',
                          outline: 'none',
                          color: '#ffffff',
                          fontFamily: 'Impact, Arial Black, sans-serif',
                          fontSize: `calc(${topFontSize}px * 0.35)`,
                          textAlign: 'center',
                          textTransform: allCaps ? 'uppercase' : 'none',
                          textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000',
                          width: 'max-content',
                          minWidth: '150px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#5B5BD6'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                      />
                    </div>

                    {/* Bottom Caption Input */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${(bottomPos.x ?? 0.5) * 100}%`,
                        top: `${(bottomPos.y ?? 0.85) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10
                      }}
                    >
                      {/* Drag Handle */}
                      <div
                        style={{
                          cursor: 'grab',
                          background: '#5B5BD6',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          marginBottom: 4,
                          opacity: 0.9,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingItem('bottom'); }}
                        onTouchStart={(e) => { e.stopPropagation(); setDraggingItem('bottom'); }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={bottomText}
                        onChange={(e) => setBottomText(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: '1.5px dashed rgba(255,255,255,0.4)',
                          outline: 'none',
                          color: '#ffffff',
                          fontFamily: 'Impact, Arial Black, sans-serif',
                          fontSize: `calc(${bottomFontSize}px * 0.35)`,
                          textAlign: 'center',
                          textTransform: allCaps ? 'uppercase' : 'none',
                          textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000',
                          width: 'max-content',
                          minWidth: '150px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#5B5BD6'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-3" style={{ background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 16 }}>
              <h4 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Meme Captions
              </h4>

              {/* Top Caption controls */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Top Caption
                </label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-lightbg/40 px-3 py-2.5 focus:outline-none focus:border-primary"
                  placeholder="TOP TEXT GOES HERE"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-gray-400">Size: {topFontSize}px</span>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    value={topFontSize}
                    onChange={(e) => setTopFontSize(parseInt(e.target.value))}
                    className="w-2/3 accent-primary"
                  />
                </div>
              </div>

              {/* Bottom Caption controls */}
              <div className="flex flex-col gap-2 pt-2 border-t border-bordercolor/40">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Bottom Caption
                </label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-lightbg/40 px-3 py-2.5 focus:outline-none focus:border-primary"
                  placeholder="BOTTOM TEXT GOES HERE"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-gray-400">Size: {bottomFontSize}px</span>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    value={bottomFontSize}
                    onChange={(e) => setBottomFontSize(parseInt(e.target.value))}
                    className="w-2/3 accent-primary"
                  />
                </div>
              </div>

              {/* Formatting details */}
              <div className="flex flex-col gap-2 pt-2 border-t border-bordercolor/40">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Stroke Width: {strokeWidth}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-2/3 accent-primary"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold leading-relaxed">
                  {errorMsg}
                </p>
              )}

              {/* Action Button */}
              <div className="pt-3 border-t border-bordercolor/60">
                <button
                  type="button"
                  onClick={downloadMeme}
                  disabled={isProcessing}
                  style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(91,91,214,0.30)", display: "flex", alignItems: "center", justifyCenter: "center", gap: 8, transition: "all 0.18s" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Generate &amp; Download Meme
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
