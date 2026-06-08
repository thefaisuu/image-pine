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
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Laplacian Heat Diffusion',
    desc: 'Interpolates pixel values from the mask boundaries inwards to create smooth, natural color fills.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="4" />
        <line x1="20" y1="2" x2="4" y2="18" />
      </svg>
    ),
    title: 'Adjustable Brush Size',
    desc: 'Fine-tune brush thickness to precisely target small blemishes or cover large watermarks and objects.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M4 14a1 1 0 0 1-.78-.37 1 1 0 0 1-.1-.97l.83-2a1 1 0 0 1 .45-.52l12-7a1 1 0 0 1 1.25.17l2.5 2.5a1 1 0 0 1 .17 1.25l-7 12a1 1 0 0 1-.52.45l-2 .83a1 1 0 0 1-.37.07zm1.62-3.12l-.4 1 .94.94.94-.4.4-.94-.94-.94zM16.5 6.5l1 1" />
      </svg>
    ),
    title: 'Mask Feathering Control',
    desc: 'Automatically softens boundaries of the selected area to achieve seamless blending with surrounding textures.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
    title: 'Reset & Redo Brush',
    desc: 'Clear the highlighted mask instantly with one click if you make a mistake and start over.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: '100% Client-Side & Local',
    desc: 'All image inpainting is calculated in your browser tab. Your original photos never touch any server.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    title: 'Full Resolution Export',
    desc: 'Saves your finished, cleaned photo in standard high-res PNG or JPEG formats directly.'
  }
];

const _STEPS = [
  { n: '1', title: 'Upload Photo', desc: 'Select any JPEG or PNG image from your device.' },
  { n: '2', title: 'Brush Over Object', desc: 'Adjust brush size and highlight the object or text in red.' },
  { n: '3', title: 'Erase & Download', desc: 'Click Erase Object to let the local diffusion clear it, then download.' }
];

const _FAQS = [
  { q: 'How does local object erasing work?', a: 'It extracts the pixel bounding data of your brush mask, solves a Laplacian heat equation to diffuse colors inward from the borders of the mask, and blends the edges with the original image.' },
  { q: 'What images work best with this tool?', a: 'It works best for removing small elements, text, wires, logos, or watermarks on clean or slightly textured backdrops (sky, walls, skin, water).' },
  { q: 'Is there any limit to the image size?', a: 'No, but very large images (above 10MB) can take a few seconds to process as calculations run entirely on the browser CPU.' }
];

export default function ObjectEraserPage() {
  const [file, setFile] = useState(null);
  const [brushSize, setBrushSize] = useState(24);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const workspaceCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const isDrawingRef = useRef(false);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
      setHasMask(false);
    } else {
      setFile(null);
    }
    setErrorMsg('');
  };

  const initCanvases = () => {
    if (!file || !workspaceCanvasRef.current || !originalImageRef.current) return;
    const canvas = workspaceCanvasRef.current;
    const img = originalImageRef.current;

    // Set canvas dimensions matching natural image resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0);

    // Initialize hidden mask canvas
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = img.naturalWidth;
    maskCanvas.height = img.naturalHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    setHasMask(false);
  };

  useEffect(() => {
    if (file) {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        initCanvases();
      };
      img.src = file.preview;
    }
  }, [file]);

  const drawMaskOverlay = () => {
    if (!workspaceCanvasRef.current || !maskCanvasRef.current || !originalImageRef.current) return;
    const canvas = workspaceCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const img = originalImageRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw image
    ctx.drawImage(img, 0, 0);

    // Overlay mask with 55% transparency
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    if (!workspaceCanvasRef.current) return { x: 0, y: 0 };
    const canvas = workspaceCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Scale coords to handle scaled canvas display size vs natural resolution
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');

    if (maskCtx) {
      maskCtx.strokeStyle = '#EF4444'; // Red mask color
      maskCtx.lineWidth = (brushSize / rectWidthFactor()) * canvasScaleFactor();
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round';
      maskCtx.beginPath();
      maskCtx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');

    if (maskCtx) {
      maskCtx.lineTo(coords.x, coords.y);
      maskCtx.stroke();
      setHasMask(true);
      drawMaskOverlay();
    }
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const canvasScaleFactor = () => {
    if (!workspaceCanvasRef.current) return 1;
    const canvas = workspaceCanvasRef.current;
    return canvas.width / canvas.offsetWidth;
  };

  const rectWidthFactor = () => {
    // scale brush size according to canvas display bounds
    return 1;
  };

  const resetMask = () => {
    if (!maskCanvasRef.current || !originalImageRef.current) return;
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    setHasMask(false);
    drawMaskOverlay();
  };

  // Laplacian Diffusion Inpainter
  const runInpainting = () => {
    if (!workspaceCanvasRef.current || !maskCanvasRef.current || !originalImageRef.current) return;
    setIsProcessing(true);
    setErrorMsg('');

    // Run in timeout to let UI update and render spinner
    setTimeout(() => {
      try {
        const canvas = workspaceCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');
        if (!ctx || !maskCtx) throw new Error('Failed to acquire canvas context');

        const width = canvas.width;
        const height = canvas.height;

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Apply a slight blur to the mask to soften borders (feathering)
        const tempMaskCanvas = document.createElement('canvas');
        tempMaskCanvas.width = width;
        tempMaskCanvas.height = height;
        const tempMaskCtx = tempMaskCanvas.getContext('2d');
        if (tempMaskCtx) {
          tempMaskCtx.filter = 'blur(3px)';
          tempMaskCtx.drawImage(maskCanvas, 0, 0);
        }

        const maskData = (tempMaskCtx || maskCtx).getImageData(0, 0, width, height).data;

        // Inpaint Iterations count
        const iterations = 80;
        const buffer1 = new Uint8ClampedArray(data);
        const buffer2 = new Uint8ClampedArray(data);

        for (let iter = 0; iter < iterations; iter++) {
          const src = iter % 2 === 0 ? buffer1 : buffer2;
          const dst = iter % 2 === 0 ? buffer2 : buffer1;

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              const alpha = maskData[idx + 3] / 255;

              if (alpha > 0.05) {
                const top = ((y - 1) * width + x) * 4;
                const bottom = ((y + 1) * width + x) * 4;
                const left = (y * width + (x - 1)) * 4;
                const right = (y * width + (x + 1)) * 4;

                // Cardinal neighborhood Laplacian average
                const diffusedR = (src[top] + src[bottom] + src[left] + src[right]) >> 2;
                const diffusedG = (src[top + 1] + src[bottom + 1] + src[left + 1] + src[right + 1]) >> 2;
                const diffusedB = (src[top + 2] + src[bottom + 2] + src[left + 2] + src[right + 2]) >> 2;

                // Blend original pixel color with diffused value based on mask weight
                dst[idx]     = Math.round(src[idx] * (1 - alpha) + diffusedR * alpha);
                dst[idx + 1] = Math.round(src[idx + 1] * (1 - alpha) + diffusedG * alpha);
                dst[idx + 2] = Math.round(src[idx + 2] * (1 - alpha) + diffusedB * alpha);
              } else {
                dst[idx]     = src[idx];
                dst[idx + 1] = src[idx + 1];
                dst[idx + 2] = src[idx + 2];
              }
            }
          }
        }

        const finalBuffer = iterations % 2 === 0 ? buffer1 : buffer2;
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = finalBuffer[i];
          data[i + 1] = finalBuffer[i + 1];
          data[i + 2] = finalBuffer[i + 2];
        }

        // Render back onto the main canvas
        ctx.putImageData(imgData, 0, 0);

        // Update original image reference so the user can draw again on the modified image
        const updatedImg = new Image();
        updatedImg.onload = () => {
          originalImageRef.current = updatedImg;
          // Clear mask after successful erase
          maskCtx.clearRect(0, 0, width, height);
          setHasMask(false);
          setIsProcessing(false);
        };
        updatedImg.src = canvas.toDataURL();

      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to process object removal.');
        setIsProcessing(false);
      }
    }, 150);
  };

  const handleDownload = () => {
    if (!workspaceCanvasRef.current || !file) return;
    workspaceCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const ext = file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      saveAs(blob, `${nameWithoutExt}_erased.${ext}`);
      saveHistory('Object Eraser', `${file.name} (Object Erased)`);
    }, file.type);
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
      title="Local Object Eraser"
      subtitle="Erase unwanted objects, text headers, watermarks, or blemishes from photos locally and privately."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Remove objects and texts from pictures locally. Client-side canvas texture inpainter with custom brush masks. Free and private."
    >
      {!file ? (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <UploadBox
            onFileSelect={handleFileSelect}
            acceptedFormats={['.jpg', '.jpeg', '.png']}
            multiple={false}
            buttonLabel="Select Photo to Edit"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
          {/* Controls Column */}
          <div className="col-span-1 lg:col-span-4" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F1F7', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111128', margin: 0 }}>Eraser Settings</h3>
              <button
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Photo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Brush size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Brush Size</span>
                  <span style={{ color: '#111128' }}>{brushSize}px</span>
                </div>
                <input type="range" min="8" max="64" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {/* Reset button */}
              <button
                type="button"
                disabled={!hasMask || isProcessing}
                onClick={resetMask}
                style={{
                  width: '100%', padding: '10px', fontSize: 12, fontWeight: 700,
                  border: '1px solid #E4E4EF', borderRadius: 10, background: '#fff',
                  color: hasMask ? '#6B6B8A' : '#C4C4D9', cursor: hasMask ? 'pointer' : 'default', transition: 'all 0.15s'
                }}
              >
                Reset Brush Highlight
              </button>

              {errorMsg && (
                <div style={{ padding: 10, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              {/* Erase button */}
              <button
                type="button"
                disabled={!hasMask || isProcessing}
                onClick={runInpainting}
                style={{
                  width: '100%',
                  background: hasMask ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : '#E4E4EF',
                  color: hasMask ? '#fff' : '#9898B5',
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: 12,
                  padding: '13px',
                  border: 'none',
                  cursor: hasMask ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: hasMask ? '0 4px 14px rgba(239, 68, 68, 0.28)' : 'none',
                  transition: 'all 0.18s',
                  marginTop: 10
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                {isProcessing ? 'Erasing Object...' : 'Erase Object'}
              </button>

              {/* Download */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDownload}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
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
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.18s'
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Clean Photo
              </button>
            </div>
          </div>

          {/* Interactive drawing viewport */}
          <div
            className="col-span-1 lg:col-span-8"
            style={{
              ...cardStyle,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F7F7FB',
              minHeight: 480,
              position: 'relative'
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start', marginBottom: 12 }}>
              Brush Mask (Draw in red to highlight objects)
            </span>

            {isProcessing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(247, 247, 251, 0.75)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
                <div style={{ width: 32, height: 32, border: '4px solid #7342e6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} className="animate-spin" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7342e6' }}>Erasing Object locally...</span>
              </div>
            )}

            <div style={{ maxWidth: '100%', maxHeight: '600px', overflow: 'auto', borderRadius: 12, border: '1px solid #E4E4EF', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <canvas
                ref={workspaceCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: 'block', maxWidth: '100%', height: 'auto', cursor: 'crosshair', userSelect: 'none', touchAction: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
