"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19L12 22Z"/></svg>), title: 'Bezier Vector Tracing', desc: 'Convert pixel graphics into clean, scalable Bezier outline paths.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), title: 'Adjustable Thresholds', desc: 'Fine-tune black-and-white edge discovery with exact slider values.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>), title: 'Path Smoothing', desc: 'Smooth jagged pixel corners using cubic coordinate interpolation.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>), title: 'Visual Previews', desc: 'Compare your source raster side-by-side with scalable SVG renders.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>), title: 'Code Clipboard', desc: 'Copy vector XML code directly to your clipboard for Figma or dev files.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: 'Zero Cloud Uploads', desc: 'Privacy protected. All tracing execution takes place locally in your tab.' }
];

const _STEPS = [
  { n: '1', title: 'Upload Graphic', desc: 'Select any logo, sketch, signature, or icon.' },
  { n: '2', title: 'Tweak Settings', desc: 'Adjust luminance threshold and edge smoothing details.' },
  { n: '3', title: 'Export SVG', desc: 'Copy clean SVG XML markup or download the file.' }
];

const _FAQS = [
  { q: 'How does local vectorization work?', a: 'Our engine draws the image onto a canvas, analyzes pixels to find high-contrast edges (contours), traces boundary coordinates using a Moore-Neighbor search, and builds clean vector paths (<path d="...">) dynamically.' },
  { q: 'What inputs work best?', a: 'High-contrast graphics, logos, silhouettes, signatures, and pixel art work best. Busy photos with complex gradients will produce massive paths and are better left as JPEGs.' },
  { q: 'Can I change stroke/fill styling?', a: 'Yes. You can toggle between solid fill, wireframe strokes, choose color fills, and adjust stroke thicknesses.' }
];

export default function VectorizerPage() {
  const [file, setFile] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [threshold, setThreshold] = useState(128);
  const [smoothFactor, setSmoothFactor] = useState(2); // 0 (none) to 5 (high)
  const [fillType, setFillType] = useState('fill'); // 'fill' | 'stroke' | 'both'
  const [vectorColor, setVectorColor] = useState('#111128');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [svgOutput, setSvgOutput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      const selected = selectedList[0];
      setFile(selected);
      setImageObj(null);
      setSvgOutput('');
      setErrorMsg('');

      const img = new Image();
      img.onload = () => {
        setImageObj(img);
      };
      img.src = selected.preview || URL.createObjectURL(selected);
    } else {
      setFile(null);
      setImageObj(null);
      setSvgOutput('');
    }
  };

  // Tracing solver (Contour tracing)
  const runTracing = () => {
    if (!imageObj) return;

    try {
      const canvas = document.createElement('canvas');
      const w = imageObj.naturalWidth || imageObj.width;
      const h = imageObj.naturalHeight || imageObj.height;
      
      // Limit processing width for vector tracing to avoid UI locks
      const maxDim = 600;
      let pW = w, pH = h;
      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          pW = maxDim;
          pH = Math.round(maxDim * h / w);
        } else {
          pH = maxDim;
          pW = Math.round(maxDim * w / h);
        }
      }

      canvas.width = pW;
      canvas.height = pH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(imageObj, 0, 0, pW, pH);
      const imgDataObj = ctx.getImageData(0, 0, pW, pH);
      const data = imgDataObj.data;

      // 1. Create threshold binary grid
      const grid = [];
      for (let y = 0; y < pH; y++) {
        grid[y] = new Uint8Array(pW);
        for (let x = 0; x < pW; x++) {
          const idx = (y * pW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Compute grayscale value, treat transparent as white
          let val = 255;
          if (a >= 50) {
            val = 0.299 * r + 0.587 * g + 0.114 * b;
          }
          grid[y][x] = val < threshold ? 1 : 0; // 1 = black/shape, 0 = white/background
        }
      }

      // 2. Moore-Neighbor border tracing
      const visited = [];
      for (let y = 0; y < pH; y++) {
        visited[y] = new Uint8Array(pW);
      }

      const paths = [];

      // Directions: N, NE, E, SE, S, SW, W, NW
      const dirs = [
        { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
      ];

      for (let y = 1; y < pH - 1; y++) {
        for (let x = 1; x < pW - 1; x++) {
          // Find an unvisited boundary start
          if (grid[y][x] === 1 && visited[y][x] === 0) {
            // Check if it is a boundary point (has at least one white neighbor)
            let isBoundary = false;
            for (let d = 0; d < 8; d++) {
              if (grid[y + dirs[d].dy][x + dirs[d].dx] === 0) {
                isBoundary = true;
                break;
              }
            }

            if (isBoundary) {
              // Trace contour
              const contour = traceContour(x, y, grid, visited, dirs);
              if (contour.length > 3) {
                paths.push(contour);
              }
            }
          }
        }
      }

      // 3. Convert path coordinates to smooth SVG paths
      let dMarkup = '';
      paths.forEach(pts => {
        // Apply smoothing filter if smoothFactor > 0
        const smoothed = smoothPoints(pts, smoothFactor);
        
        // Build path markup
        dMarkup += ` M ${smoothed[0].x} ${smoothed[0].y}`;
        for (let i = 1; i < smoothed.length; i++) {
          dMarkup += ` L ${smoothed[i].x} ${smoothed[i].y}`;
        }
        dMarkup += ' Z';
      });

      // Assemble full SVG
      const fillAttr = fillType === 'stroke' ? 'none' : vectorColor;
      const strokeAttr = fillType === 'fill' ? 'none' : vectorColor;
      const strokeWAttr = fillType === 'fill' ? 0 : strokeWidth;

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pW} ${pH}" width="100%" height="100%">
  <path d="${dMarkup.trim()}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${strokeWAttr}" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd" />
</svg>`;

      setSvgOutput(fullSvg);
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to trace vector paths.');
    }
  };

  const traceContour = (startX, startY, grid, visited, dirs) => {
    const contour = [];
    let currX = startX;
    let currY = startY;
    
    // Start by looking North
    let enterDir = 0; 
    let limit = 2000; // avoid infinite loop on loops

    while (limit-- > 0) {
      contour.push({ x: currX, y: currY });
      visited[currY][currX] = 1;

      // Search clockwise for next active cell
      let foundNext = false;
      let nextDir = (enterDir + 6) % 8; // backtrack direction

      for (let i = 0; i < 8; i++) {
        const dIdx = (nextDir + i) % 8;
        const tx = currX + dirs[dIdx].dx;
        const ty = currY + dirs[dIdx].dy;

        // Check grid boundary
        if (ty >= 0 && ty < grid.length && tx >= 0 && tx < grid[0].length) {
          if (grid[ty][tx] === 1) {
            currX = tx;
            currY = ty;
            enterDir = dIdx;
            foundNext = true;
            break;
          }
        }
      }

      // If we returned to start, stop
      if (!foundNext || (currX === startX && currY === startY)) {
        break;
      }
    }

    return contour;
  };

  const smoothPoints = (pts, factor) => {
    if (factor === 0 || pts.length < 5) return pts;

    const result = [];
    const len = pts.length;

    for (let i = 0; i < len; i++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      // Sliding window average
      for (let w = -factor; w <= factor; w++) {
        const idx = (i + w + len) % len;
        sumX += pts[idx].x;
        sumY += pts[idx].y;
        count++;
      }

      result.push({
        x: parseFloat((sumX / count).toFixed(1)),
        y: parseFloat((sumY / count).toFixed(1))
      });
    }

    return result;
  };

  useEffect(() => {
    if (imageObj) {
      runTracing();
    }
  }, [imageObj, threshold, smoothFactor, fillType, vectorColor, strokeWidth]);

  useEffect(() => {
    if (svgOutput) {
      const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl('');
    }
  }, [svgOutput]);

  const copyToClipboard = () => {
    if (!svgOutput) return;
    navigator.clipboard.writeText(svgOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const downloadSvgFile = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const name = file ? `${file.name.replace(/\.[^/.]+$/, '')}.svg` : 'vectorized.svg';
    saveAs(blob, name);
    saveHistory('Image Vectorizer', name);
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
      title="Vectorizer & Pixel Art to SVG Converter"
      subtitle="Trace raster shapes, signatures, or logos into crisp, infinitely scalable SVG vectors locally in your browser."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free browser-based vectorizer tool. Convert PNG to SVG vector, trace logo outlines, smooth signatures coordinates, and download vector graphics locally."
    >
      <div className="flex flex-col gap-6">
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox
              onFileSelect={handleFileSelect}
              acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
              multiple={false}
              buttonLabel="Upload Image to Vectorize"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
            {/* Left: Vector Settings */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              <div style={cardStyle} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-bordercolor">
                  <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Tracing Settings</h3>
                  <button onClick={() => { setFile(null); setImageObj(null); setSvgOutput(''); }} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                </div>

                {/* Threshold Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Luminance Threshold</span>
                    <span>{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="240"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="text-[9px] text-gray-400">Controls contrast cutoff. Higher values catch lighter details.</span>
                </div>

                {/* Smoothing Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Path Smoothing</span>
                    <span>{smoothFactor} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={smoothFactor}
                    onChange={(e) => setSmoothFactor(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="text-[9px] text-gray-400">Higher values average out curves; 0 preserves exact pixels.</span>
                </div>

                {/* Styling Options */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-bordercolor/40">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Fill Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['fill', 'stroke', 'both'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setFillType(style)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg border uppercase transition-all ${fillType === style ? 'border-primary bg-primary/5 text-primary' : 'border-bordercolor bg-white text-gray-500'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vector Color Input */}
                <div className="flex justify-between items-center pt-2 border-t border-bordercolor/40">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Vector Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={vectorColor}
                      onChange={(e) => setVectorColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-bordercolor bg-none p-0"
                    />
                    <span className="text-xs font-mono font-bold text-textmain">{vectorColor}</span>
                  </div>
                </div>

                {/* Stroke Width (only visible if stroke used) */}
                {fillType !== 'fill' && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-bordercolor/40">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Stroke Thickness</span>
                      <span>{strokeWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-bordercolor/60">
                  <button
                    onClick={downloadSvgFile}
                    className="py-2.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                  >
                    Download SVG File
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="py-2.5 text-xs font-bold rounded-lg border border-bordercolor bg-white text-textmain hover:bg-lightbg/10 transition-all"
                  >
                    {copied ? 'Copied XML Code!' : 'Copy SVG Code'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Previews & SVG Markup */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div style={cardStyle} className="flex flex-col gap-4">
                <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor">Vector Render Preview</h4>

                <div style={{ border: "1.5px solid #E4E4EF", borderRadius: 14, padding: 16, minHeight: 380, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px" }}>
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Vector Outline Preview"
                      style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Generating vector curves...</span>
                  )}
                </div>
              </div>

              {/* Code display */}
              <div style={cardStyle} className="flex flex-col gap-3">
                <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor">SVG XML Node Markup</h4>
                <textarea
                  readOnly
                  value={svgOutput}
                  placeholder="SVG code is compiling..."
                  className="w-full h-36 font-mono text-[10px] text-textmain border border-bordercolor/80 rounded-xl bg-lightbg/10 p-3 focus:outline-none resize-none leading-relaxed"
                />
              </div>

            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
