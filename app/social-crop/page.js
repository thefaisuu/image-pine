"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';
import JSZip from 'jszip';

const PRESETS = [
  { id: 'ig-post', label: 'Instagram Post (1:1)', ratio: 1.0, width: 1080, height: 1080 },
  { id: 'ig-story', label: 'Instagram Story (9:16)', ratio: 9/16, width: 1080, height: 1920 },
  { id: 'yt-thumb', label: 'YouTube Thumbnail (16:9)', ratio: 16/9, width: 1280, height: 720 },
  { id: 'tw-card', label: 'Twitter Card (1.91:1)', ratio: 1.91, width: 1200, height: 628 },
  { id: 'ln-banner', label: 'LinkedIn Cover (4:1)', ratio: 4.0, width: 1584, height: 396 }
];

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7l7 5z"/></svg>), title: 'Multi-Ratio Cropping', desc: 'Crop one image to all standard ratios at the same time.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>), title: 'Realistic Feed Previews', desc: 'View cropped designs inside live simulated mobile phone feeds.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>), title: 'Interactive Overlays', desc: 'Position, scale, and align your crops with draggable canvas nodes.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>), title: 'Fast ZIP Export', desc: 'Package and download all your resized social graphics into a single ZIP.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>), title: 'Safe & Local', desc: 'Zero cloud upload. Your photos stay strictly inside your browser sandbox.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>), title: 'Instant Processing', desc: 'Canvas rendering triggers locally in milliseconds.' }
];

const _STEPS = [
  { n: '1', title: 'Upload Image', desc: 'Upload any high-res banner or portrait photo.' },
  { n: '2', title: 'Adjust bounding boxes', desc: 'Drag crop frames to position highlights for each platform.' },
  { n: '3', title: 'Export ZIP archive', desc: 'Preview post mockups and download all dimensions together.' }
];

const _FAQS = [
  { q: 'Can I crop images individually for each format?', a: 'Yes! Image Pine remembers the position and crop box size independently for each format so you can adjust them separately.' },
  { q: 'Are standard sizes kept up to date?', a: 'Yes. The templates use the standard aspect ratios required for platforms (1:1 square, 9:16 story, 16:9 video, 1.91:1 post cards, and 4:1 LinkedIn headers).' },
  { q: 'Is there a file size limit?', a: 'There is no hard limit, but zipping extremely large canvas blobs may take a few seconds.' }
];

export default function SocialCropPage() {
  const [file, setFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [activePresetId, setActivePresetId] = useState('ig-post');
  
  // Crop coordinates in percentage of image dimensions
  const [cropBoxes, setCropBoxes] = useState({
    'ig-post': { x: 10, y: 10, w: 80, h: 80 },
    'ig-story': { x: 20, y: 0, w: 60, h: 100 },
    'yt-thumb': { x: 0, y: 10, w: 100, h: 56.25 },
    'tw-card': { x: 0, y: 15, w: 100, h: 52.3 },
    'ln-banner': { x: 0, y: 30, w: 100, h: 25 },
  });

  const [croppedPreviews, setCroppedPreviews] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const workspaceRef = useRef(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(''); // 'nw', 'ne', 'se', 'sw'
  const dragStart = useRef({ x: 0, y: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  const activePreset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      const selected = selectedList[0];
      setFile(selected);
      setImageObj(null);
      setCroppedPreviews({});
      setErrorMsg('');

      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        // Initialize crop boxes based on image aspect ratio
        const imgRatio = img.naturalWidth / img.naturalHeight;
        initializeCropBoxes(imgRatio);
      };
      img.src = selected.preview || URL.createObjectURL(selected);
    } else {
      setFile(null);
      setImageObj(null);
      setCroppedPreviews({});
    }
  };

  const initializeCropBoxes = (imgRatio) => {
    const newBoxes = {};
    PRESETS.forEach(p => {
      let w = 90;
      let h = 90;
      if (p.ratio > imgRatio) {
        // Preset is wider than image
        w = 95;
        h = (95 / p.ratio) * imgRatio;
      } else {
        // Preset is taller than image
        h = 95;
        w = (95 * p.ratio) / imgRatio;
      }
      newBoxes[p.id] = {
        x: (100 - w) / 2,
        y: (100 - h) / 2,
        w: w,
        h: h
      };
    });
    setCropBoxes(newBoxes);
  };

  const getActiveBox = () => {
    return cropBoxes[activePresetId] || { x: 10, y: 10, w: 80, h: 80 };
  };

  const updateActiveBox = (updater) => {
    setCropBoxes(prev => {
      const current = prev[activePresetId] || { x: 10, y: 10, w: 80, h: 80 };
      const updated = typeof updater === 'function' ? updater(current) : updater;
      
      // Clamp values
      const x = Math.max(0, Math.min(100 - updated.w, updated.x));
      const y = Math.max(0, Math.min(100 - updated.h, updated.y));
      const w = Math.max(10, Math.min(100 - x, updated.w));
      const h = Math.max(10, Math.min(100 - y, updated.h));

      return {
        ...prev,
        [activePresetId]: { x, y, w, h }
      };
    });
  };

  // Drag handles
  const handleMouseDown = (e, action, handle = '') => {
    if (!imageObj || !workspaceRef.current) return;
    e.preventDefault();

    const box = getActiveBox();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX,
      y: clientY,
      boxX: box.x,
      boxY: box.y,
      boxW: box.w,
      boxH: box.h
    };

    if (action === 'drag') {
      isDragging.current = true;
    } else if (action === 'resize') {
      isResizing.current = true;
      resizeHandle.current = handle;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current && !isResizing.current) return;
      if (!workspaceRef.current || !imageObj) return;

      const rect = workspaceRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dxPct = ((clientX - dragStart.current.x) / rect.width) * 100;
      const dyPct = ((clientY - dragStart.current.y) / rect.height) * 100;

      const start = dragStart.current;
      const imgRatio = imageObj.naturalWidth / imageObj.naturalHeight;
      const targetRatio = activePreset.ratio;

      if (isDragging.current) {
        updateActiveBox({
          x: start.boxX + dxPct,
          y: start.boxY + dyPct,
          w: start.boxW,
          h: start.boxH
        });
      } else if (isResizing.current) {
        const handle = resizeHandle.current;
        let newW = start.boxW;
        let newH = start.boxH;
        let newX = start.boxX;
        let newY = start.boxY;

        // Resize respecting preset aspect ratio
        if (handle === 'se') {
          newW = start.boxW + dxPct;
          newH = (newW / targetRatio) * imgRatio;
        } else if (handle === 'sw') {
          newW = start.boxW - dxPct;
          newH = (newW / targetRatio) * imgRatio;
          newX = start.boxX + (start.boxW - newW);
        } else if (handle === 'ne') {
          newW = start.boxW + dxPct;
          newH = (newW / targetRatio) * imgRatio;
          newY = start.boxY - (newH - start.boxH);
        } else if (handle === 'nw') {
          newW = start.boxW - dxPct;
          newH = (newW / targetRatio) * imgRatio;
          newX = start.boxX + (start.boxW - newW);
          newY = start.boxY - (newH - start.boxH);
        }

        // Validate aspect ratio scaling stays correct
        updateActiveBox({
          x: newX,
          y: newY,
          w: newW,
          h: newH
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [activePresetId, imageObj]);

  // Generate cropped preview blob for simulated feed mockups
  const generateSingleCropBlob = (presetId) => {
    if (!imageObj) return Promise.resolve(null);
    const preset = PRESETS.find(p => p.id === presetId);
    const box = cropBoxes[presetId];
    if (!preset || !box) return Promise.resolve(null);

    const canvas = document.createElement('canvas');
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    const imgW = imageObj.naturalWidth || imageObj.width;
    const imgH = imageObj.naturalHeight || imageObj.height;

    const cropX = (box.x / 100) * imgW;
    const cropY = (box.y / 100) * imgH;
    const cropW = (box.w / 100) * imgW;
    const cropH = (box.h / 100) * imgH;

    ctx.drawImage(imageObj, cropX, cropY, cropW, cropH, 0, 0, preset.width, preset.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  // Update mock previews when crop box moves
  useEffect(() => {
    if (!imageObj) return;

    const timer = setTimeout(async () => {
      const url = await generateSingleCropBlob(activePresetId);
      if (url) {
        setCroppedPreviews(prev => {
          // Revoke old URL to prevent memory leaks
          if (prev[activePresetId]) URL.revokeObjectURL(prev[activePresetId]);
          return {
            ...prev,
            [activePresetId]: url
          };
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [cropBoxes, activePresetId, imageObj]);

  // Download all crops in a ZIP archive
  const handleDownloadAll = async () => {
    if (!imageObj) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const zip = new JSZip();
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      for (const preset of PRESETS) {
        const box = cropBoxes[preset.id];
        if (!box) continue;

        const canvas = document.createElement('canvas');
        canvas.width = preset.width;
        canvas.height = preset.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const imgW = imageObj.naturalWidth || imageObj.width;
        const imgH = imageObj.naturalHeight || imageObj.height;

        const cropX = (box.x / 100) * imgW;
        const cropY = (box.y / 100) * imgH;
        const cropW = (box.w / 100) * imgW;
        const cropH = (box.h / 100) * imgH;

        ctx.drawImage(imageObj, cropX, cropY, cropW, cropH, 0, 0, preset.width, preset.height);

        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });

        if (blob) {
          const folderName = preset.id;
          zip.file(`${baseName}_${folderName}.jpg`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${baseName}_social_crops.zip`);
      saveHistory('Social Media Cropper', `${baseName}_social_crops.zip (${PRESETS.length} dimensions)`);
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to compile crops into ZIP archive.');
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #E4E4EF',
    borderRadius: 20,
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    height: 'fit-content'
  };

  const activeBox = getActiveBox();

  return (
    <ToolPageShell
      title="Social Media Cropper & Feed Mockup Previewer"
      subtitle="Instantly batch crop a single photo to perfect post ratios and preview exactly how they render inside realistic smartphone mockups."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free client-side social media image cropper. Crop images for Instagram Story, YouTube Thumbnail, Twitter cards, and LinkedIn headers. Batch download cropped templates in a ZIP locally."
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox
              onFileSelect={handleFileSelect}
              acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
              multiple={false}
              buttonLabel="Upload Banner / Post Image"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
            {/* Left Column: Preset Switcher & Action button */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              <div style={cardStyle}>
                <div className="flex justify-between items-center pb-2 border-b border-bordercolor mb-3">
                  <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Select Presets</h3>
                  <button onClick={() => handleFileSelect([])} className="text-[10px] font-extrabold text-red-500 hover:underline">Clear</button>
                </div>
                
                <div className="flex flex-col gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePresetId(p.id)}
                      className={`text-left p-3 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${activePresetId === p.id ? 'border-primary bg-primary/5 text-primary' : 'border-bordercolor/80 bg-white text-textmain hover:bg-lightbg/10'}`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{p.width} x {p.height}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-bordercolor/60">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleDownloadAll}
                    style={{ width: "100%", padding: "12px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                  >
                    {isProcessing ? 'Bundling ZIP...' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Download All Crops (ZIP)
                      </>
                    )}
                  </button>
                  {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
                </div>
              </div>

            </div>

            {/* Middle Column: Interactive Crop Editor */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div style={cardStyle}>
                <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor mb-3">Crop Adjuster</h4>
                
                {imageObj && (
                  <div 
                    ref={workspaceRef}
                    style={{
                      position: 'relative',
                      width: '100%',
                      background: 'repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1.5px solid #E4E4EF',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={file.preview || URL.createObjectURL(file)} 
                      alt="Crop Canvas" 
                      draggable={false} 
                      className="w-full block select-none pointer-events-none"
                    />

                    {/* Draggable Shaded Backdrop Outlines */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${activeBox.x}%`,
                        top: `${activeBox.y}%`,
                        width: `${activeBox.w}%`,
                        height: `${activeBox.h}%`,
                        border: '2px solid #5B5BD6',
                        boxShadow: '0 0 0 9999px rgba(17, 17, 40, 0.55)',
                        cursor: 'move',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'drag')}
                      onTouchStart={(e) => handleMouseDown(e, 'drag')}
                    >
                      {/* Bounding Resize nodes */}
                      {['nw', 'ne', 'se', 'sw'].map((handle) => (
                        <div
                          key={handle}
                          style={{
                            position: 'absolute',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#5B5BD6',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            cursor: `${handle}-resize`,
                            // Positions
                            top: handle.includes('n') ? -7 : 'auto',
                            bottom: handle.includes('s') ? -7 : 'auto',
                            left: handle.includes('w') ? -7 : 'auto',
                            right: handle.includes('e') ? -7 : 'auto',
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
                          onTouchStart={(e) => handleMouseDown(e, 'resize', handle)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <span className="text-[10px] text-gray-400 font-medium leading-relaxed block mt-2 text-center">
                  Drag the highlighted crop box to reposition the focal area. Drag corner nodes to scale.
                </span>
              </div>
            </div>

            {/* Right Column: Live Mockup Feed Previewer */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div style={cardStyle}>
                <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor mb-3">Live Feed Preview</h4>

                <div className="flex flex-col items-center justify-center bg-[#F7F7FB] border border-[#E4E4EF] p-4 rounded-xl min-h-[380px]">
                  
                  {/* Instagram Post Mockup */}
                  {activePresetId === 'ig-post' && (
                    <div className="w-full bg-white border border-[#E4E4EF] rounded-xl overflow-hidden shadow-sm animate-fade-in max-w-[280px]">
                      <div className="flex items-center gap-2 p-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-bordercolor flex items-center justify-center text-[10px] font-extrabold text-primary">🌲</div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-textmain">image_pine</span>
                          <span className="text-[8px] text-gray-400">Sponsored</span>
                        </div>
                      </div>
                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-y border-[#F1F1F7]">
                        {croppedPreviews['ig-post'] ? <img src={croppedPreviews['ig-post']} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-300">Rendering...</span>}
                      </div>
                      <div className="p-2.5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <span className="text-xs text-textmain">❤️</span><span className="text-xs text-textmain">💬</span><span className="text-xs text-textmain">✈️</span>
                          </div>
                          <span className="text-xs text-textmain">🔖</span>
                        </div>
                        <p className="text-[9px] text-[#6B6B8A] leading-relaxed"><strong className="text-textmain">image_pine</strong> Check out this local-first preview crop! Looks incredibly perfect.</p>
                      </div>
                    </div>
                  )}

                  {/* Instagram Story Mockup */}
                  {activePresetId === 'ig-story' && (
                    <div className="w-full aspect-[9/16] bg-[#111128] rounded-xl overflow-hidden relative shadow-md animate-fade-in max-w-[220px]">
                      {croppedPreviews['ig-story'] ? <img src={croppedPreviews['ig-story']} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Rendering...</span>}
                      <div className="absolute top-2 left-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[9px]">🌲</div>
                        <span className="text-[9px] font-bold text-white shadow-sm">image_pine</span>
                        <span className="text-[8px] text-white/60 shadow-sm">2h</span>
                      </div>
                      <div className="absolute bottom-2 inset-x-2 flex gap-2">
                        <div className="flex-1 bg-white/25 backdrop-blur-md border border-white/20 rounded-full py-1.5 px-3 text-[9px] text-white font-medium">Send message</div>
                        <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs">❤️</div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Thumbnail Mockup */}
                  {activePresetId === 'yt-thumb' && (
                    <div className="w-full bg-white border border-[#E4E4EF] rounded-xl overflow-hidden shadow-sm animate-fade-in max-w-[280px]">
                      <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden">
                        {croppedPreviews['yt-thumb'] ? <img src={croppedPreviews['yt-thumb']} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Rendering...</span>}
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-extrabold px-1 rounded">12:45</span>
                      </div>
                      <div className="p-3 flex gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-bordercolor flex items-center justify-center text-xs font-extrabold text-primary flex-shrink-0">🌲</div>
                        <div className="flex flex-col min-w-0">
                          <h5 className="text-[10px] font-bold text-textmain leading-tight truncate">How to Vectorize Low-Res Logos Instantly!</h5>
                          <span className="text-[9px] text-[#9898B5] mt-1 font-medium">Image Pine Studio</span>
                          <span className="text-[8px] text-gray-400 mt-0.5">14K views · 2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Twitter Card Mockup */}
                  {activePresetId === 'tw-card' && (
                    <div className="w-full bg-white border border-[#E4E4EF] rounded-xl p-3 shadow-sm animate-fade-in max-w-[280px] flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-bordercolor flex items-center justify-center text-xs font-extrabold text-primary flex-shrink-0">🌲</div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-textmain">Image Pine</span>
                            <span className="text-[9px] text-gray-400">@pine_studio · 2h</span>
                          </div>
                          <p className="text-[9px] text-[#6B6B8A] leading-relaxed mt-0.5">Really happy with how the new brand assets came out! Local-first crop preview looks extremely clean! 🌲🚀</p>
                        </div>
                      </div>
                      <div className="border border-[#E4E4EF] rounded-xl overflow-hidden aspect-[1.91/1] bg-gray-50 flex items-center justify-center">
                        {croppedPreviews['tw-card'] ? <img src={croppedPreviews['tw-card']} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-300">Rendering...</span>}
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Cover Mockup */}
                  {activePresetId === 'ln-banner' && (
                    <div className="w-full bg-white border border-[#E4E4EF] rounded-xl overflow-hidden shadow-sm animate-fade-in max-w-[320px]">
                      <div className="aspect-[4/1] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-[#E4E4EF] relative">
                        {croppedPreviews['ln-banner'] ? <img src={croppedPreviews['ln-banner']} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-300">Rendering...</span>}
                      </div>
                      <div className="px-3 pb-3 pt-0 relative flex flex-col">
                        {/* Profile avatar overlapping banner */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-lg font-bold text-primary absolute -top-6 left-3 shadow-md">👤</div>
                        
                        <div className="pt-8 flex flex-col">
                          <h6 className="text-[11px] font-bold text-textmain">Ata Umer</h6>
                          <span className="text-[9px] text-[#6B6B8A] mt-0.5 leading-snug">Full Stack Developer &amp; UI Specialist</span>
                          <span className="text-[8px] text-gray-400 mt-1">New York, New York · 500+ connections</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
