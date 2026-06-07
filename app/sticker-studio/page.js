"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const STICKERS = ['😎', '🤫', '👀', '🔥', '✨', '💯', '⚠️', '❌', '🌲', '💡', '🤖', '👑', '🌈', '🎉'];

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: 'Privacy Blur Masks', desc: 'Anonymize sensitive text, license plates, or faces using local pixelation filters.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>), title: 'Censorship Grids', desc: 'Cover confidential sections with classic solid black bars or pixelated matrices.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><path d="M9 15h6"/></svg>), title: 'Sticker Overlays', desc: 'Annotate mockups with funny custom emojis, pointers, and decorative decals.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>), title: 'Transform Handles', desc: 'Easily scale, rotate, and reposition layers using touch/mouse anchor points.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>), title: 'Text Annotations', desc: 'Type callouts and messages directly onto design elements with custom color picker tools.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: 'Lossless Export', desc: 'Everything processes inside the browser canvas. Downloads match original resolution.' }
];

const _STEPS = [
  { n: '1', title: 'Upload Graphic', desc: 'Load any photograph or interface screenshot.' },
  { n: '2', title: 'Overlay Stickers', desc: 'Add blur blocks, black censor bars, text, or emojis.' },
  { n: '3', title: 'Download Image', desc: 'Verify placement and export your privacy-secured image.' }
];

const _FAQS = [
  { q: 'How does pixelation censorship differ from regular bars?', a: 'Pixelation downsamples the underlying image pixels inside that bounding block to render giant squares. Because it alters the actual image data before encoding, the censored pixels cannot be reversed or retrieved.' },
  { q: 'Can I add multiple stickers at once?', a: 'Yes. You can stack as many overlays, text blocks, and blur masks as you want.' },
  { q: 'How do I rotate stickers?', a: 'Select the element to show the control frame, then drag the green circular rotation handle (top-left) to rotate.' }
];

export default function StickerStudioPage() {
  const [file, setFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [inputText, setInputText] = useState('ANNOTATION');
  const [textColor, setTextColor] = useState('#EF4444');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const workspaceRef = useRef(null);

  // Drag-and-scale tracking
  const isDragging = useRef(false);
  const isScaling = useRef(false);
  const isRotating = useRef(false);
  
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0, elAngle: 0, startDist: 0, startAngle: 0 });

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      const selected = selectedList[0];
      setFile(selected);
      setElements([]);
      setSelectedId(null);
      setErrorMsg('');

      const img = new Image();
      img.onload = () => {
        setImageObj(img);
      };
      img.src = selected.preview || URL.createObjectURL(selected);
    } else {
      setFile(null);
      setImageObj(null);
      setElements([]);
      setSelectedId(null);
    }
  };

  const addElement = (type, value = '') => {
    const newEl = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      value,
      x: 100,
      y: 100,
      w: type === 'censor-bar' || type === 'blur-box' ? 120 : 64,
      h: type === 'censor-bar' || type === 'blur-box' ? 40 : 64,
      angle: 0,
      color: textColor
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const getActiveElement = () => {
    return elements.find(el => el.id === selectedId);
  };

  const updateActiveElement = (updater) => {
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return typeof updater === 'function' ? updater(el) : { ...el, ...updater };
      }
      return el;
    }));
  };

  const handleMouseDown = (e, action, elId) => {
    e.stopPropagation();
    setSelectedId(elId);

    const el = elements.find(item => item.id === elId);
    if (!el || !workspaceRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = workspaceRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Center coordinates of element
    const centerX = el.x + el.w / 2;
    const centerY = el.y + el.h / 2;

    const dx = clickX - centerX;
    const dy = clickY - centerY;

    dragStart.current = {
      x: clientX,
      y: clientY,
      elX: el.x,
      elY: el.y,
      elW: el.w,
      elH: el.h,
      elAngle: el.angle,
      startDist: Math.hypot(dx, dy),
      startAngle: Math.atan2(dy, dx)
    };

    if (action === 'drag') {
      isDragging.current = true;
    } else if (action === 'scale') {
      isScaling.current = true;
    } else if (action === 'rotate') {
      isRotating.current = true;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current && !isScaling.current && !isRotating.current) return;
      
      const el = getActiveElement();
      if (!el || !workspaceRef.current) return;

      const rect = workspaceRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dxReal = clientX - dragStart.current.x;
      const dyReal = clientY - dragStart.current.y;

      if (isDragging.current) {
        updateActiveElement({
          x: dragStart.current.elX + dxReal,
          y: dragStart.current.elY + dyReal
        });
      } else if (isScaling.current) {
        const scale = Math.hypot(
          clientX - (rect.left + el.x + el.w / 2),
          clientY - (rect.top + el.y + el.h / 2)
        ) / dragStart.current.startDist;

        // Apply scale multiplier to width and height
        const newW = Math.max(20, dragStart.current.elW * scale);
        const newH = Math.max(20, dragStart.current.elH * scale);

        updateActiveElement({
          x: el.x + (el.w - newW) / 2,
          y: el.y + (el.h - newH) / 2,
          w: newW,
          h: newH
        });
      } else if (isRotating.current) {
        const clickX = clientX - rect.left;
        const clickY = clientY - rect.top;
        const centerX = el.x + el.w / 2;
        const centerY = el.y + el.h / 2;

        const currentAngle = Math.atan2(clickY - centerY, clickX - centerX);
        const angleDiff = currentAngle - dragStart.current.startAngle;

        updateActiveElement({
          angle: dragStart.current.elAngle + angleDiff
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isScaling.current = false;
      isRotating.current = false;
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
  }, [selectedId, elements]);

  const handleExport = () => {
    if (!imageObj) return;
    setIsProcessing(true);
    setErrorMsg('');

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const w = imageObj.naturalWidth || imageObj.width;
        const h = imageObj.naturalHeight || imageObj.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to generate high-resolution context.');

        // Draw original background
        ctx.drawImage(imageObj, 0, 0);

        // We need the scale ratio between editor workspace dimensions and natural image size
        if (!workspaceRef.current) return;
        const wsW = workspaceRef.current.offsetWidth;
        const wsH = workspaceRef.current.offsetHeight;
        const scaleX = w / wsW;
        const scaleY = h / wsH;

        elements.forEach(el => {
          ctx.save();

          // Translate to center of element
          const cX = (el.x + el.w / 2) * scaleX;
          const cY = (el.y + el.h / 2) * scaleY;
          const eW = el.w * scaleX;
          const eH = el.h * scaleY;

          ctx.translate(cX, cY);
          ctx.rotate(el.angle);

          if (el.type === 'censor-bar') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(-eW / 2, -eH / 2, eW, eH);
          } else if (el.type === 'blur-box') {
            ctx.restore(); // restore to draw blur coordinates
            ctx.save();
            
            // Draw pixelated censorship block
            const cropX = el.x * scaleX;
            const cropY = el.y * scaleY;

            // Draw a downsampled subset of the canvas back onto it
            const tempCanvas = document.createElement('canvas');
            const downscale = 10;
            tempCanvas.width = Math.max(1, eW / downscale);
            tempCanvas.height = Math.max(1, eH / downscale);
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(canvas, cropX, cropY, eW, eH, 0, 0, tempCanvas.width, tempCanvas.height);
              
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, cropX, cropY, eW, eH);
            }
          } else if (el.type === 'emoji') {
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = `${Math.round(eH * 0.85)}px Arial`;
            ctx.fillText(el.value, 0, 0);
          } else if (el.type === 'text') {
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = el.color;
            ctx.font = `bold ${Math.round(eH * 0.7)}px Impact, sans-serif`;
            
            // Add slight dark outline for contrast
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(1, eH * 0.08);
            ctx.strokeText(el.value, 0, 0);
            ctx.fillText(el.value, 0, 0);
          }

          ctx.restore();
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newName = `${baseName}_censor.png`;
            saveAs(blob, newName);
            saveHistory('Sticker Studio', newName);
          } else {
            setErrorMsg('Export failed.');
          }
          setIsProcessing(false);
        }, 'image/png');
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Error merging graphics layers.');
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
      title="Face Mask & Sticker Privacy Editor"
      subtitle="Overlay custom stickers, censorship grids, blur blocks, or text callouts to secure privacy before sharing graphics."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free browser-based sticker overlayer and image blur. Apply privacy mask emojis, censorship bars, pixel grids, and write text locally and securely."
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox
              onFileSelect={handleFileSelect}
              acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
              multiple={false}
              buttonLabel="Upload Image to Edit"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
            {/* Left: Element Toolbar */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              <div style={cardStyle} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-bordercolor">
                  <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Privacy Layers</h3>
                  <button onClick={() => handleFileSelect([])} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                </div>

                {/* Censorship Tools */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Censorship Blocks</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addElement('blur-box')}
                      className="py-2.5 text-xs font-bold rounded-lg border border-bordercolor bg-lightbg/10 text-textmain hover:bg-lightbg/20 transition-all flex items-center justify-center gap-1"
                    >
                      ░ Pixelate Box
                    </button>
                    <button
                      onClick={() => addElement('censor-bar')}
                      className="py-2.5 text-xs font-bold rounded-lg border border-bordercolor bg-black text-white hover:opacity-95 transition-all flex items-center justify-center gap-1"
                    >
                      ⬛ Black Censor
                    </button>
                  </div>
                </div>

                {/* Stickers Library */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-bordercolor/40">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Emoji Library</span>
                  <div className="flex flex-wrap gap-2">
                    {STICKERS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addElement('emoji', emoji)}
                        className="w-10 h-10 text-xl rounded-lg border border-bordercolor/80 bg-white hover:bg-[#EDEDFB] transition-all cursor-pointer flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text overlay controls */}
                <div className="flex flex-col gap-2 pt-2 border-t border-bordercolor/40">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Text Annotation</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-grow text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-lightbg/40 px-2 py-2 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-bordercolor bg-none p-0 flex-shrink-0"
                    />
                    <button
                      onClick={() => addElement('text', inputText)}
                      className="px-3 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary/95 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Active Layer Details */}
                {getActiveElement() && (
                  <div className="p-3 bg-[#EDEDFB] border border-[#D8D8F5] rounded-xl flex justify-between items-center animate-fade-in mt-1">
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-[#5B5BD6] uppercase tracking-wide">Selected Layer</span>
                      <p className="text-xs font-bold text-textmain truncate uppercase">{getActiveElement().type}</p>
                    </div>
                    <button
                      onClick={() => removeElement(selectedId)}
                      className="px-3 py-1 text-[10px] font-bold rounded-lg bg-red-100 text-red-500 hover:bg-red-200 border-none cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {/* Export Button */}
                <div className="pt-3 border-t border-bordercolor/60">
                  <button
                    onClick={handleExport}
                    disabled={isProcessing}
                    style={{ width: "100%", padding: "12px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyCenter: "center", gap: 8, transition: "all 0.18s" }}
                  >
                    {isProcessing ? 'Generating Image...' : 'Export Output Image'}
                  </button>
                  {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
                </div>
              </div>

            </div>

            {/* Right: Interactive Canvas Editor */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div style={cardStyle} className="flex flex-col gap-4">
                <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor">Interactive Layer Canvas</h4>

                <div 
                  style={{ 
                    border: "1.5px solid #E4E4EF", 
                    borderRadius: 14, 
                    padding: 8, 
                    minHeight: 380, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    position: "relative", 
                    overflow: "hidden", 
                    background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px" 
                  }}
                  onClick={() => setSelectedId(null)}
                >
                  {imageObj && (
                    <div 
                      ref={workspaceRef}
                      style={{ position: 'relative', display: 'inline-block' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.preview || URL.createObjectURL(file)}
                        alt="Background source"
                        draggable={false}
                        style={{ maxHeight: 480, maxWidth: "100%", objectFit: "contain", borderRadius: 8, display: "block" }}
                      />

                      {/* Overlaid Layer Elements */}
                      {elements.map(el => {
                        const isActive = el.id === selectedId;
                        return (
                          <div
                            key={el.id}
                            style={{
                              position: 'absolute',
                              left: el.x,
                              top: el.y,
                              width: el.w,
                              height: el.h,
                              transform: `rotate(${el.angle}rad)`,
                              border: isActive ? '1px dashed #5B5BD6' : 'none',
                              outline: isActive ? '1px solid rgba(255,255,255,0.8)' : 'none',
                              cursor: 'move',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              userSelect: 'none',
                              zIndex: isActive ? 100 : 10
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'drag', el.id)}
                            onTouchStart={(e) => handleMouseDown(e, 'drag', el.id)}
                          >
                            {/* Render visual styling based on element type */}
                            {el.type === 'censor-bar' && (
                              <div style={{ backgroundColor: '#000000', width: '100%', height: '100%' }} />
                            )}
                            {el.type === 'blur-box' && (
                              <div style={{
                                width: '100%', height: '100%',
                                background: 'repeating-conic-gradient(#6B6B8A 0% 25%, #FAFAFF 0% 50%) 0 0 / 12px 12px',
                                border: '1px solid rgba(0,0,0,0.1)'
                              }} />
                            )}
                            {el.type === 'emoji' && (
                              <span style={{ fontSize: `${el.h * 0.85}px`, lineHeight: 1 }}>{el.value}</span>
                            )}
                            {el.type === 'text' && (
                              <span style={{
                                fontSize: `${el.h * 0.7}px`,
                                color: el.color,
                                fontWeight: 'bold',
                                fontFamily: 'Impact, sans-serif',
                                textShadow: '0px 0px 4px #000',
                                whiteSpace: 'nowrap',
                                lineHeight: 1
                              }}>
                                {el.value}
                              </span>
                            )}

                            {/* Active Controls */}
                            {isActive && (
                              <>
                                {/* Delete button in bottom-left */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                                  style={{
                                    position: 'absolute', bottom: -10, left: -10,
                                    width: 20, height: 20, borderRadius: '50%',
                                    backgroundColor: '#EF4444', color: '#fff', border: '1.5px solid #fff',
                                    display: 'flex', alignItems: 'center', justifyCenter: 'center',
                                    fontSize: 10, fontWeight: 'bold', cursor: 'pointer', zIndex: 110,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  ×
                                </button>
                                {/* Scale handle in bottom-right */}
                                <div
                                  style={{
                                    position: 'absolute', bottom: -7, right: -7,
                                    width: 14, height: 14, borderRadius: '50%',
                                    backgroundColor: '#5B5BD6', border: '1.5px solid #fff',
                                    cursor: 'se-resize', zIndex: 110,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, 'scale', el.id)}
                                  onTouchStart={(e) => handleMouseDown(e, 'scale', el.id)}
                                />
                                {/* Rotation handle in top-left */}
                                <div
                                  style={{
                                    position: 'absolute', top: -7, left: -7,
                                    width: 14, height: 14, borderRadius: '50%',
                                    backgroundColor: '#10B981', border: '1.5px solid #fff',
                                    cursor: 'alias', zIndex: 110,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    display: 'flex', alignItems: 'center', justifyCenter: 'center'
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, 'rotate', el.id)}
                                  onTouchStart={(e) => handleMouseDown(e, 'rotate', el.id)}
                                />
                              </>
                            )}

                          </div>
                        );
                      })}

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
