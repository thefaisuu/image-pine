"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';
import JSZip from 'jszip';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>), title: 'Timeline Assembler', desc: 'Add, reorder, duplicate, or delete static frames inside a visual timeline.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>), title: 'Delay Selectors', desc: 'Choose precise delays in milliseconds for each frame sequence.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>), title: 'Binary GIF Splitter', desc: 'Parse animations on a byte level to slice them back into individual frames.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4"/></svg>), title: 'Compile Animations', desc: 'Combine raw frames into smooth looping animated GIF images locally.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>), title: 'Frame ZIP Export', desc: 'Extract and download all frames from any animated GIF compiled in a single ZIP.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: 'Local Sandbox Processing', desc: 'No servers involved. All animation building and splitting runs strictly in-browser.' }
];

const _STEPS = [
  { n: '1', title: 'Choose Mode', desc: 'Select "Create GIF" to build animations or "Split GIF" to extract frames.' },
  { n: '2', title: 'Upload & Configure', desc: 'Load files, rearrange order, set speeds, or inspect frames.' },
  { n: '3', title: 'Download Output', desc: 'Download compiled animations or export frame slices in a ZIP.' }
];

const _FAQS = [
  { q: 'What is the limit of frames I can upload?', a: 'There is no strict limit, but rendering animations consumes system RAM. For large frame lists, try reducing the export resolution.' },
  { q: 'How does the binary GIF splitter work?', a: 'It reads the GIF file as a raw ArrayBuffer, parses the logical descriptors and global color tables, isolates each image block, and wraps them into valid individual single-frame GIFs so the browser can decode them instantly.' },
  { q: 'Can I set individual frame delays?', a: 'Currently, the studio sets a uniform delay between all frames (e.g. 200ms) to ensure smooth timing.' }
];

export default function AnimationStudioPage() {
  const [mode, setMode] = useState('create'); // 'create' | 'split'
  
  // Create state
  const [files, setFiles] = useState([]);
  const [delay, setDelay] = useState(200);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);
  const [loop, setLoop] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [gifPreviewUrl, setGifPreviewUrl] = useState('');

  // Split state
  const [splitFile, setSplitFile] = useState(null);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateFileSelect = (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      if (files.length === 0) {
        const img = new Image();
        img.onload = () => {
          setWidth(img.naturalWidth || 400);
          setHeight(img.naturalHeight || 400);
        };
        img.src = newFiles[0].preview;
      }
    }
  };

  const removeFrame = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFrame = (index, dir) => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === files.length - 1) return;

    const target = dir === 'up' ? index - 1 : index + 1;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setFiles(updated);
  };

  const base64ToBlob = (base64Data, contentType = 'image/gif') => {
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data.split(',')[1]);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);
      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters.charCodeAt(offset);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleCompileGif = async () => {
    if (files.length < 2) return;
    setIsCompiling(true);

    try {
      const gifshotModule = await import('gifshot');
      const gifshot = gifshotModule.default;

      const imageUrls = files.map(f => f.preview);

      gifshot.createGIF({
        images: imageUrls,
        gifWidth: width,
        gifHeight: height,
        interval: delay / 1000,
        numFrames: files.length,
        loop: loop ? 0 : 1
      }, (obj) => {
        if (!obj.error) {
          const base64 = obj.image;
          const blob = base64ToBlob(base64);
          
          if (gifPreviewUrl) URL.revokeObjectURL(gifPreviewUrl);
          const localUrl = URL.createObjectURL(blob);
          setGifPreviewUrl(localUrl);

          saveAs(blob, 'animation.gif');
          saveHistory('Animation Studio', `animation.gif (${files.length} frames)`);
        } else {
          alert('Failed to compile GIF.');
        }
        setIsCompiling(false);
      });
    } catch (e) {
      console.error(e);
      alert('Failed to load compilation engine.');
      setIsCompiling(false);
    }
  };

  // GIF Binary Splitter
  const handleSplitFileSelect = (selectedList) => {
    if (selectedList.length === 0) {
      setSplitFile(null);
      setExtractedFrames([]);
      return;
    }
    
    const fileObj = selectedList[0];
    setSplitFile(fileObj);
    setExtractedFrames([]);
    setErrorMsg('');
    setIsSplitting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const frames = parseGifBuffer(buffer);
        if (frames.length === 0) {
          throw new Error('No animation frames discovered in this GIF.');
        }
        setExtractedFrames(frames);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Error splitting GIF. Make sure it is an animated GIF.');
      } finally {
        setIsSplitting(false);
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  const parseGifBuffer = (buffer) => {
    const view = new DataView(buffer);
    const arr = new Uint8Array(buffer);
    
    // Check GIF Signature
    const sig = String.fromCharCode(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
    if (sig !== 'GIF89a' && sig !== 'GIF87a') {
      throw new Error('Not a valid GIF file.');
    }

    // Logical Screen Descriptor
    const gctFlag = (arr[10] & 0x80) !== 0;
    const gctSize = gctFlag ? 3 * Math.pow(2, (arr[10] & 0x07) + 1) : 0;
    
    const headerLen = 13;
    const gctStart = headerLen;
    const blocksStart = headerLen + gctSize;

    // Header & GCT slice
    const headerBytes = arr.slice(0, blocksStart);

    let offset = blocksStart;
    const frames = [];
    let currentGce = null;

    while (offset < arr.length) {
      const blockType = arr[offset];

      if (blockType === 0x3B) {
        // Trailer/EOF
        break;
      }

      if (blockType === 0x21) {
        // Extension Block
        const extType = arr[offset + 1];
        if (extType === 0xF9) {
          // Graphic Control Extension (GCE)
          const blockSize = arr[offset + 2];
          const totalSize = 3 + blockSize + 1; // Block ID + Ext Label + Block Size + Data + Block Terminator
          currentGce = arr.slice(offset, offset + totalSize);
          offset += totalSize;
        } else {
          // Skip other extensions (Application, Comment, etc.)
          offset += 2; // block type + label
          while (arr[offset] !== 0) {
            offset += arr[offset] + 1;
          }
          offset++; // skip 0x00 terminator
        }
      } else if (blockType === 0x2C) {
        // Image Descriptor
        const startOffset = offset;
        const localColorTableFlag = (arr[offset + 9] & 0x80) !== 0;
        const lctSize = localColorTableFlag ? 3 * Math.pow(2, (arr[offset + 9] & 0x07) + 1) : 0;

        offset += 10 + lctSize; // skip descriptor + local color table

        // Skip LZW Minimum Code Size
        offset++;

        // Read data sub-blocks
        while (arr[offset] !== 0) {
          offset += arr[offset] + 1;
        }
        offset++; // skip 0x00 terminator

        const imageBytes = arr.slice(startOffset, offset);

        // Package as a single-frame GIF file
        const frameData = new Uint8Array(headerBytes.length + (currentGce ? currentGce.length : 0) + imageBytes.length + 1);
        let pos = 0;
        
        frameData.set(headerBytes, pos);
        pos += headerBytes.length;

        if (currentGce) {
          frameData.set(currentGce, pos);
          pos += currentGce.length;
        }

        frameData.set(imageBytes, pos);
        pos += imageBytes.length;

        frameData[pos] = 0x3B; // Trailer

        const blob = new Blob([frameData], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        frames.push({
          url,
          blob
        });

        // Reset current GCE
        currentGce = null;
      } else {
        // Unknown block, increment and skip to avoid infinite loops
        offset++;
      }
    }

    return frames;
  };

  const handleDownloadZip = async () => {
    if (extractedFrames.length === 0) return;
    setIsSplitting(true);

    try {
      const zip = new JSZip();
      const baseName = splitFile.name.replace(/\.[^/.]+$/, '');

      extractedFrames.forEach((frame, idx) => {
        zip.file(`${baseName}_frame_${String(idx + 1).padStart(3, '0')}.gif`, frame.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${baseName}_frames.zip`);
      saveHistory('Animation Studio', `${baseName}_frames.zip (${extractedFrames.length} frames)`);
    } catch (e) {
      console.error(e);
      alert('Could not compile ZIP archive.');
    } finally {
      setIsSplitting(false);
    }
  };

  const cardStyle = {
    background: '#fff',
    border: '1px solid #E4E4EF',
    borderRadius: 20,
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    height: 'fit-content'
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9,
    fontSize: 13, fontWeight: 700, color: '#111128', outline: 'none'
  };

  return (
    <ToolPageShell
      title="APNG & Animated GIF Studio"
      subtitle="Compile static sequences into animations or split existing GIF animations into raw frame assets locally."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Free browser-based animation creator and GIF splitter. Compile frames into GIFs or extract frame images from animated GIFs locally and privately."
    >
      <div className="flex flex-col gap-6">
        
        {/* Mode Selector */}
        <div style={{ maxWidth: 420, margin: '0 auto', width: '100%', display: 'flex', background: '#F1F1F7', border: '1px solid #E4E4EF', borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all ${mode === 'create' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-gray-400'}`}
          >
            Create Animation
          </button>
          <button
            onClick={() => setMode('split')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all ${mode === 'split' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-gray-400'}`}
          >
            Split Animation
          </button>
        </div>

        {/* ─── CREATOR MODE ─── */}
        {mode === 'create' && (
          <div>
            {files.length === 0 ? (
              <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                <UploadBox
                  onFileSelect={handleCreateFileSelect}
                  acceptedFormats={['.jpg', '.jpeg', '.png', '.webp']}
                  multiple={true}
                  buttonLabel="Select Animation Frames"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
                {/* Left: Frame List */}
                <div className="lg:col-span-4" style={cardStyle}>
                  <div className="flex justify-between items-center pb-2 border-b border-bordercolor mb-3">
                    <span className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Frames ({files.length})</span>
                    <button onClick={() => { setFiles([]); setGifPreviewUrl(''); }} className="text-[10px] font-extrabold text-red-500 hover:underline">Clear All</button>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto mb-3">
                    {files.map((fileObj, idx) => (
                      <div key={fileObj.id} className="flex items-center gap-3 bg-lightbg/10 border border-bordercolor p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                        <img src={fileObj.preview} alt="" className="w-9 h-9 object-cover rounded-lg border border-bordercolor bg-white" />
                        <span className="text-[11px] font-bold text-textmain truncate flex-grow" title={fileObj.name}>{fileObj.name}</span>
                        
                        <div className="flex gap-1">
                          <button disabled={idx === 0} onClick={() => moveFrame(idx, 'up')} className="w-6 h-6 border-none rounded bg-[#EDEDFB] text-primary text-[10px] cursor-pointer hover:bg-[#D8D8F5]">▲</button>
                          <button disabled={idx === files.length - 1} onClick={() => moveFrame(idx, 'down')} className="w-6 h-6 border-none rounded bg-[#EDEDFB] text-primary text-[10px] cursor-pointer hover:bg-[#D8D8F5]">▼</button>
                          <button onClick={() => removeFrame(fileObj.id)} className="w-6 h-6 border-none rounded bg-red-100 text-red-500 text-xs font-bold cursor-pointer hover:bg-red-200">×</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const el = document.getElementById('add-more-create-gif');
                      if (el) el.click();
                    }}
                    className="w-full py-2.5 text-[10px] font-extrabold border-2 border-dashed border-[#D1D1E4] rounded-xl text-primary bg-[#F7F7FB] hover:bg-[#EDEDFB] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    + Upload More Frames
                  </button>
                  <input
                    id="add-more-create-gif"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        const list = Array.from(e.target.files).map(f =>
                          Object.assign(f, { preview: URL.createObjectURL(f), id: Math.random().toString(36).slice(2, 9) })
                        );
                        handleCreateFileSelect(list);
                      }
                    }}
                  />
                </div>

                {/* Middle: Render Preview */}
                <div className="lg:col-span-5" style={{ ...cardStyle, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex justify-between items-center px-5 py-3 border-b border-[#E4E4EF]">
                    <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">GIF Output Preview</h3>
                  </div>

                  <div style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 20px 20px' }}>
                    {gifPreviewUrl ? (
                      <div className="rounded-xl overflow-hidden shadow-sm border border-bordercolor max-w-[280px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={gifPreviewUrl} alt="Animation Preview" className="w-full block" />
                      </div>
                    ) : (
                      <div className="text-center text-[#9898B5] py-20">
                        <svg className="w-10 h-10 mx-auto mb-2.5 stroke-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[11px] font-bold">Arrange frames, then click compile to preview.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Creator Controls */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <div style={cardStyle} className="flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Creator Settings</h3>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Frame Delay</span>
                        <span>{delay} ms</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={delay}
                        onChange={(e) => setDelay(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">GIF Width (px)</span>
                        <input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 400)} style={inputStyle} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">GIF Height (px)</span>
                        <input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 400)} style={inputStyle} />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer user-select-none mt-1">
                      <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-xs font-bold text-textmain">Loop Playback</span>
                    </label>
                  </div>

                  <div style={cardStyle}>
                    <button
                      type="button"
                      disabled={isCompiling || files.length < 2}
                      onClick={handleCompileGif}
                      style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: files.length < 2 ? "not-allowed" : "pointer", background: files.length < 2 ? "#E4E4EF" : "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: files.length < 2 ? "#9898B5" : "#fff", boxShadow: files.length < 2 ? "none" : "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                    >
                      {isCompiling ? 'Creating GIF...' : 'Compile & Save GIF'}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ─── SPLITTER MODE ─── */}
        {mode === 'split' && (
          <div>
            {!splitFile ? (
              <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                <UploadBox
                  onFileSelect={handleSplitFileSelect}
                  acceptedFormats={['.gif']}
                  multiple={false}
                  buttonLabel="Select Animated GIF to Split"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
                {/* Left: Metadata & Zip Export */}
                <div className="lg:col-span-4" style={cardStyle}>
                  <div className="flex justify-between items-center pb-2 border-b border-bordercolor mb-3">
                    <span className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider">Animation Info</span>
                    <button onClick={() => { setSplitFile(null); setExtractedFrames([]); }} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                  </div>

                  <div className="flex flex-col gap-2 text-xs font-medium text-[#6B6B8A] mb-4">
                    <p className="truncate"><strong className="text-textmain">Filename:</strong> {splitFile.name}</p>
                    <p><strong className="text-textmain">Extracted Frames:</strong> {extractedFrames.length}</p>
                  </div>

                  {extractedFrames.length > 0 && (
                    <button
                      onClick={handleDownloadZip}
                      disabled={isSplitting}
                      style={{ width: "100%", padding: "12px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                    >
                      {isSplitting ? 'Creating ZIP...' : 'Download Frames (ZIP)'}
                    </button>
                  )}
                  {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
                </div>

                {/* Right: Grid of Extracted Frames */}
                <div className="lg:col-span-8" style={cardStyle}>
                  <h4 className="text-xs font-extrabold text-[#9898B5] uppercase tracking-wider pb-2 border-b border-bordercolor mb-4">Extracted Frames</h4>
                  
                  {isSplitting ? (
                    <div className="text-center py-20">
                      <span className="text-xs font-bold text-primary">Parsing binary data segments...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto">
                      {extractedFrames.map((frame, idx) => (
                        <div key={idx} className="bg-lightbg/10 border border-bordercolor/60 rounded-xl p-2 flex flex-col items-center gap-1.5 shadow-sm">
                          <span className="text-[9px] font-extrabold text-[#9898B5]">Frame {idx + 1}</span>
                          <div className="aspect-square w-full bg-white rounded-lg overflow-hidden border border-bordercolor flex items-center justify-center p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={frame.url} alt="" className="max-w-full max-h-full object-contain" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ToolPageShell>
  );
}
