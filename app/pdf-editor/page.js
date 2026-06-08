"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>), title: 'Interactive Annotations', desc: 'Add, style, and place text layers anywhere on your pages.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>), title: 'Reorder & Rotate', desc: 'Rearrange pages, and rotate them 90° clockwise.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>), title: 'Delete Pages', desc: 'Instantly remove unwanted pages from your document.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>), title: 'Merge Files & Images', desc: 'Combine multiple PDF files and images into a single document.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: '100% Client-Side', desc: 'Processed locally in your browser. Complete privacy guaranteed.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>), title: 'Fast & Free', desc: 'Edit and compile your documents instantly with no watermarks.' }
];

const _STEPS = [
  { n: '1', title: 'Upload Files', desc: 'Select or drag your PDF documents and images.' },
  { n: '2', title: 'Edit Layout', desc: 'Reorder, rotate, delete, or insert blank pages.' },
  { n: '3', title: 'Annotate & Save', desc: 'Place custom text boxes on pages and export your new PDF.' }
];

const _FAQS = [
  { q: 'Can I combine multiple PDFs and images?', a: 'Yes! You can upload multiple PDFs and images. They will be added as pages that you can reorder, rotate, delete, and edit together.' },
  { q: 'How do I add text annotations?', a: 'Click the "Edit Page" icon on any page thumbnail to open the Page Editor. Click "+ Add Text Box", select the text box to edit its content, font size, or color, and drag it anywhere on the page.' },
  { q: 'Are my PDF documents secure?', a: 'Completely. All rendering, page manipulations, and text annotations are performed 100% locally in your browser. Your files are never uploaded to any server.' },
  { q: 'Can I add blank pages?', a: 'Yes. Click the "+ Blank Page" button in the control panel to insert a blank page, which you can use for notes or annotations.' }
];

export default function PdfEditorPage() {
  const [pages, setPages] = useState([]); // Array of page objects
  const [sourceFiles, setSourceFiles] = useState({}); // fileId -> { name, buffer, type }
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Modal Editor state
  const [editingPageIndex, setEditingPageIndex] = useState(null);
  const [activeTextId, setActiveTextId] = useState(null);
  const [draggedTextId, setDraggedTextId] = useState(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const createdUrlsRef = useRef([]);
  const addFilesInputRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = () => {
        reject(new Error('Failed to load PDF engine. Please check your network connection.'));
      };
      document.head.appendChild(script);
    });
  };

  const createBlankPagePreview = (width = 595, height = 842) => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = Math.round((height / width) * 150);
    const ctx = canvas.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#D1D1E4';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Draw text inside to represent a blank page
    ctx.fillStyle = '#9898B5';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Blank Page', canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  };

  const convertImageToJpgBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.onload = (e) => {
            const url = URL.createObjectURL(blob);
            createdUrlsRef.current.push(url);
            resolve({
              buffer: e.target.result,
              width: canvas.width,
              height: canvas.height,
              url
            });
          };
          reader.onerror = () => reject(new Error('Failed to read image buffer.'));
          reader.readAsArrayBuffer(blob);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image.'));
      };
      img.src = objectUrl;
    });
  };

  const processSelectedFiles = async (fileList) => {
    setIsProcessing(true);
    setErrorMsg('');
    setProgress('Loading engine...');

    try {
      const pdfjs = await loadPdfJs();
      const newPages = [];
      const updatedSourceFiles = { ...sourceFiles };

      for (const file of fileList) {
        setProgress(`Loading ${file.name}...`);
        const fileId = Math.random().toString(36).slice(2, 9);

        if (file.name.toLowerCase().endsWith('.pdf')) {
          const buffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsArrayBuffer(file);
          });

          updatedSourceFiles[fileId] = { name: file.name, buffer, type: 'pdf' };

          const loadingTask = pdfjs.getDocument({ data: buffer });
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;

          for (let i = 1; i <= numPages; i++) {
            setProgress(`Rendering page ${i} of ${numPages} from ${file.name}...`);
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.2 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport,
            };
            await page.render(renderContext).promise;

            const url = await new Promise((resolve) => {
              canvas.toBlob((b) => {
                const blobUrl = URL.createObjectURL(b);
                createdUrlsRef.current.push(blobUrl);
                resolve(blobUrl);
              }, 'image/png');
            });

            newPages.push({
              id: Math.random().toString(36).slice(2, 9),
              type: 'pdf',
              fileId,
              pageIndex: i - 1,
              width: viewport.width,
              height: viewport.height,
              rotation: 0,
              url,
              texts: []
            });
          }
        } else if (file.type && (file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|webp|svg)$/i))) {
          try {
            setProgress(`Converting ${file.name}...`);
            const converted = await convertImageToJpgBuffer(file);
            updatedSourceFiles[fileId] = { name: file.name, buffer: converted.buffer, type: 'image' };

            newPages.push({
              id: Math.random().toString(36).slice(2, 9),
              type: 'image',
              fileId,
              width: converted.width,
              height: converted.height,
              rotation: 0,
              url: converted.url,
              texts: []
            });
          } catch (imgErr) {
            console.error('Image loading error:', imgErr);
            setErrorMsg(`Failed to process image ${file.name}.`);
          }
        }
      }

      setSourceFiles(updatedSourceFiles);
      setPages(prev => [...prev, ...newPages]);
      setIsProcessing(false);
      setProgress('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred while loading files.');
      setIsProcessing(false);
      setProgress('');
    }
  };

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      processSelectedFiles(selectedList);
    }
  };

  const addBlankPage = () => {
    const previewUrl = createBlankPagePreview(595, 842);
    setPages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        type: 'blank',
        width: 595,
        height: 842,
        rotation: 0,
        url: previewUrl,
        texts: []
      }
    ]);
  };

  const deletePage = (index) => {
    const pageToDelete = pages[index];
    if (pageToDelete.url && pageToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(pageToDelete.url);
      createdUrlsRef.current = createdUrlsRef.current.filter(u => u !== pageToDelete.url);
    }
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const rotatePage = (index) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== index) return p;
      return { ...p, rotation: (p.rotation + 90) % 360 };
    }));
  };

  const movePage = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pages.length) return;

    setPages(prev => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return list;
    });
  };

  const clearAll = () => {
    createdUrlsRef.current.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    createdUrlsRef.current = [];
    setPages([]);
    setSourceFiles({});
    setErrorMsg('');
    setProgress('');
  };

  // Annotator Modal actions
  const openPageEditor = (index) => {
    setEditingPageIndex(index);
    setActiveTextId(null);
  };

  const closePageEditor = () => {
    setEditingPageIndex(null);
    setActiveTextId(null);
  };

  const addTextToEditingPage = () => {
    const textId = Math.random().toString(36).slice(2, 9);
    const newText = {
      id: textId,
      text: 'Double click to edit',
      x: 35, // center-ish percentage
      y: 45,
      fontSize: 18,
      color: '#000000'
    };

    setPages(prev => prev.map((p, i) => {
      if (i !== editingPageIndex) return p;
      return { ...p, texts: [...p.texts, newText] };
    }));
    setActiveTextId(textId);
  };

  const deleteTextFromEditingPage = (textId) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== editingPageIndex) return p;
      return { ...p, texts: p.texts.filter(t => t.id !== textId) };
    }));
    if (activeTextId === textId) {
      setActiveTextId(null);
    }
  };

  const updateEditingPageText = (textId, fields) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== editingPageIndex) return p;
      return {
        ...p,
        texts: p.texts.map(t => t.id === textId ? { ...t, ...fields } : t)
      };
    }));
  };

  const handleMouseDown = (textId, e) => {
    e.stopPropagation();
    setDraggedTextId(textId);
    setActiveTextId(textId);

    const textEl = e.currentTarget;
    const containerEl = textEl.parentElement;
    const textRect = textEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    dragOffset.current = {
      x: e.clientX - textRect.left,
      y: e.clientY - textRect.top
    };
  };

  const handleTouchStart = (textId, e) => {
    e.stopPropagation();
    setDraggedTextId(textId);
    setActiveTextId(textId);

    const touch = e.touches[0];
    const textEl = e.currentTarget;
    const containerEl = textEl.parentElement;
    const textRect = textEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    dragOffset.current = {
      x: touch.clientX - textRect.left,
      y: touch.clientY - textRect.top
    };
  };

  const handleMouseMove = (e) => {
    if (!draggedTextId) return;

    const containerEl = e.currentTarget;
    const rect = containerEl.getBoundingClientRect();

    let newX = e.clientX - rect.left - dragOffset.current.x;
    let newY = e.clientY - rect.top - dragOffset.current.y;

    let px = (newX / rect.width) * 100;
    let py = (newY / rect.height) * 100;

    px = Math.max(0, Math.min(92, px));
    py = Math.max(0, Math.min(95, py));

    updateEditingPageText(draggedTextId, { x: px, y: py });
  };

  const handleTouchMove = (e) => {
    if (!draggedTextId) return;

    const touch = e.touches[0];
    const containerEl = e.currentTarget;
    const rect = containerEl.getBoundingClientRect();

    let newX = touch.clientX - rect.left - dragOffset.current.x;
    let newY = touch.clientY - rect.top - dragOffset.current.y;

    let px = (newX / rect.width) * 100;
    let py = (newY / rect.height) * 100;

    px = Math.max(0, Math.min(92, px));
    py = Math.max(0, Math.min(95, py));

    updateEditingPageText(draggedTextId, { x: px, y: py });
  };

  const handleMouseUp = () => {
    setDraggedTextId(null);
  };

  const compileAndSave = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setErrorMsg('');
    setProgress('Compiling PDF...');

    try {
      const pdfLib = await import('pdf-lib');
      const { PDFDocument, degrees, rgb, StandardFonts } = pdfLib;

      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // PDF loaded files cache
      const pdfCache = {};

      for (let idx = 0; idx < pages.length; idx++) {
        const page = pages[idx];
        setProgress(`Compiling page ${idx + 1} of ${pages.length}...`);

        let targetPage;
        let pWidth = page.width;
        let pHeight = page.height;

        if (page.type === 'pdf') {
          const fileData = sourceFiles[page.fileId];
          if (!fileData) throw new Error(`Missing source file for page ${idx + 1}`);

          let srcDoc = pdfCache[page.fileId];
          if (!srcDoc) {
            srcDoc = await PDFDocument.load(fileData.buffer);
            pdfCache[page.fileId] = srcDoc;
          }

          const [copiedPage] = await pdfDoc.copyPages(srcDoc, [page.pageIndex]);
          targetPage = pdfDoc.addPage(copiedPage);

          if (page.rotation !== 0) {
            const currentAngle = targetPage.getRotation().angle;
            targetPage.setRotation(degrees(currentAngle + page.rotation));
          }

          const size = targetPage.getSize();
          pWidth = size.width;
          pHeight = size.height;

        } else if (page.type === 'image') {
          const fileData = sourceFiles[page.fileId];
          if (!fileData) throw new Error(`Missing source image for page ${idx + 1}`);

          const embeddedImage = await pdfDoc.embedJpg(fileData.buffer);
          const size = embeddedImage.scale(1);

          targetPage = pdfDoc.addPage([size.width, size.height]);
          targetPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
          });

          if (page.rotation !== 0) {
            targetPage.setRotation(degrees(page.rotation));
          }

          pWidth = size.width;
          pHeight = size.height;

        } else if (page.type === 'blank') {
          targetPage = pdfDoc.addPage([page.width, page.height]);
          if (page.rotation !== 0) {
            targetPage.setRotation(degrees(page.rotation));
          }
        }

        // Draw text layers
        if (page.texts && page.texts.length > 0) {
          for (const t of page.texts) {
            const rx = t.x / 100;
            const ry = t.y / 100;

            const pdfX = rx * pWidth;
            const pdfY = (1 - ry) * pHeight - t.fontSize;

            // Map color
            let textRgb = rgb(0, 0, 0);
            if (t.color === '#FF0000') textRgb = rgb(1, 0, 0);
            else if (t.color === '#0000FF') textRgb = rgb(0, 0, 1);
            else if (t.color === '#008000') textRgb = rgb(0, 0.5, 0);
            else if (t.color === '#FFFFFF') textRgb = rgb(1, 1, 1);

            const lines = t.text.split('\n');
            let currentY = pdfY;
            for (const line of lines) {
              targetPage.drawText(line, {
                x: pdfX,
                y: currentY,
                size: t.fontSize,
                font: helveticaFont,
                color: textRgb,
              });
              currentY -= t.fontSize * 1.2;
            }
          }
        }
      }

      setProgress('Saving PDF document...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      const fileName = pages.length === 1 ? 'edited_document.pdf' : 'compiled_document.pdf';
      saveAs(blob, fileName);
      saveHistory('PDF Editor', `${fileName} (${pages.length} pages)`);

      setIsProcessing(false);
      setProgress('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred while compiling PDF.');
      setIsProcessing(false);
      setProgress('');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalFilesSize = Object.values(sourceFiles).reduce((acc, f) => acc + (f.buffer?.byteLength || 0), 0);
  const editingPage = editingPageIndex !== null ? pages[editingPageIndex] : null;
  const activeText = editingPage && activeTextId ? editingPage.texts.find(t => t.id === activeTextId) : null;

  return (
    <ToolPageShell
      title="PDF Editor"
      subtitle="Edit and arrange PDF pages client-side. Reorder, rotate, delete, insert blank pages, and add styled text overlays instantly."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Edit PDF pages online. Reorder, rotate, delete pages, merge PDFs, merge images to PDF, and add text annotations. Runs 100% locally in your browser."
    >
      <div style={{ width: '100%' }}>
        {/* Workspace */}
        {pages.length === 0 ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox
              onFileSelect={handleFileSelect}
              acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png', '.webp']}
              multiple={true}
              buttonLabel="Choose PDF &amp; Images"
              maxSizeMB={30}
            />
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* Top Workspace Bar */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                  Workspace ({pages.length} page{pages.length !== 1 ? 's' : ''})
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)' }}>
                  Total size: {formatSize(totalFilesSize)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Add Files */}
                <button
                  type="button"
                  onClick={() => addFilesInputRef.current?.click()}
                  className="btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add PDF / Images
                </button>
                <input
                  type="file"
                  ref={addFilesInputRef}
                  multiple
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  style={{ display: 'none' }}
                />

                {/* Add Blank Page */}
                <button
                  type="button"
                  onClick={addBlankPage}
                  className="btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Add Blank Page
                </button>

                {/* Clear All */}
                <button
                  type="button"
                  onClick={clearAll}
                  style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FFF5F5' }}
                  className="btn-ghost"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Error Message & Progress */}
            {errorMsg && (
              <div className="card" style={{ padding: '12px 18px', borderColor: '#FECACA', background: '#FFF5F5', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="#EF4444" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{errorMsg}</span>
              </div>
            )}

            {isProcessing && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="animate-spin" width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="var(--primary)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {progress}
                </span>
              </div>
            )}

            {/* Pages Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px',
              paddingBottom: '20px'
            }}>
              {pages.map((p, index) => {
                const isFirst = index === 0;
                const isLast = index === pages.length - 1;

                return (
                  <div
                    key={p.id}
                    className="card card-hover"
                    style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    {/* Index Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '18px',
                      left: '18px',
                      zIndex: 10,
                      background: 'rgba(17, 17, 40, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      PAGE {index + 1}
                    </div>

                    {/* Annotations count badge */}
                    {p.texts?.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '18px',
                        right: '18px',
                        zIndex: 10,
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(91,91,214,0.3)'
                      }}>
                        {p.texts.length}
                      </div>
                    )}

                    {/* Page Thumbnail Preview */}
                    <div style={{
                      aspectRatio: '3/4',
                      background: '#F1F1F7',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      border: '1px solid var(--border)'
                    }}>
                      {p.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.url}
                          alt={`Page ${index + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transform: `rotate(${p.rotation}deg)`,
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      ) : (
                        <div style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 600 }}>No preview</div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Edit Text layer */}
                      <button
                        type="button"
                        onClick={() => openPageEditor(index)}
                        className="btn-ghost"
                        style={{ width: '100%', padding: '6px', fontSize: '11px', fontWeight: 700, gap: '4px', border: '1px solid var(--primary)', color: 'var(--primary)', background: '#F8F8FF' }}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit Page
                      </button>

                      {/* Micro actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                        {/* Rotate */}
                        <button
                          type="button"
                          title="Rotate Clockwise"
                          onClick={() => rotatePage(index)}
                          className="btn-ghost"
                          style={{ padding: '6px' }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>

                        {/* Move Left */}
                        <button
                          type="button"
                          title="Move Left"
                          disabled={isFirst}
                          onClick={() => movePage(index, -1)}
                          className="btn-ghost"
                          style={{ padding: '6px' }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>

                        {/* Move Right */}
                        <button
                          type="button"
                          title="Move Right"
                          disabled={isLast}
                          onClick={() => movePage(index, 1)}
                          className="btn-ghost"
                          style={{ padding: '6px' }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete Page"
                          onClick={() => deletePage(index)}
                          style={{ color: '#EF4444', borderColor: '#FFD3D3' }}
                          className="btn-ghost"
                          style={{ padding: '6px' }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m-7.84 8.586a1 1 0 010-1.414l8.586-8.586a1 1 0 011.414 0l8.586 8.586a1 1 0 01-1.414 1.414L12 11.414l-7.414 7.414a1 1 0 01-1.414 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Compile Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={compileAndSave}
                disabled={isProcessing || pages.length === 0}
                className="process-btn"
                style={{ maxWidth: '380px', height: '48px', fontSize: '14px' }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {isProcessing ? 'Processing...' : 'Save & Download PDF'}
              </button>
            </div>
          </div>
        )}

        {/* PAGE EDITOR MODAL */}
        {editingPageIndex !== null && editingPage && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 17, 40, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}>
            <div className="card animate-fade-up" style={{
              width: '100%',
              maxWidth: '1080px',
              height: '85vh',
              display: 'grid',
              gridTemplateRows: '60px 1fr 60px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
            }}>
              
              {/* Modal Header */}
              <div style={{
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge">Page Editor</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                    Editing Page {editingPageIndex + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closePageEditor}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content Split Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                height: '100%',
                overflow: 'hidden',
              }}>
                
                {/* Left: Canvas Workspace */}
                <div
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onMouseUp={handleMouseUp}
                  onTouchEnd={handleMouseUp}
                  style={{
                    background: '#191924',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    overflow: 'auto',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: 'fit-content',
                    height: 'fit-content',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    background: '#fff',
                  }}>
                    {/* Background page image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editingPage.url}
                      alt="Editing Page"
                      draggable={false}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '62vh',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transform: `rotate(${editingPage.rotation}deg)`,
                      }}
                    />

                    {/* Text overlays container */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'auto',
                    }}>
                      {editingPage.texts?.map((t) => {
                        const isSelected = t.id === activeTextId;
                        return (
                          <div
                            key={t.id}
                            onMouseDown={(e) => handleMouseDown(t.id, e)}
                            onTouchStart={(e) => handleTouchStart(t.id, e)}
                            style={{
                              position: 'absolute',
                              left: `${t.x}%`,
                              top: `${t.y}%`,
                              fontSize: `${t.fontSize}px`,
                              color: t.color,
                              border: isSelected ? '1.5px dashed var(--primary)' : '1px dashed var(--text-3)',
                              background: 'rgba(255, 255, 255, 0.82)',
                              boxShadow: isSelected ? '0 0 0 3px rgba(91,91,214,0.18)' : '0 2px 6px rgba(0,0,0,0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'move',
                              userSelect: 'none',
                              whiteSpace: 'pre-wrap',
                              fontWeight: '700',
                              transform: 'translate(-50%, -50%)',
                              zIndex: isSelected ? 50 : 10,
                            }}
                          >
                            {t.text || 'Type something...'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Controls Drawer */}
                <div style={{
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--surface)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)' }}>
                      Page Annotations
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600 }}>
                      Add movable text nodes to this page.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addTextToEditingPage}
                    className="btn-primary"
                    style={{ width: '100%', gap: '6px' }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Text Box
                  </button>

                  <div className="divider" />

                  {activeText ? (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Edit Selected Text
                      </span>

                      {/* Text Input */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span className="label">Text Content</span>
                        <textarea
                          value={activeText.text}
                          onChange={(e) => updateEditingPageText(activeText.id, { text: e.target.value })}
                          rows={3}
                          className="input"
                          style={{ resize: 'vertical', minHeight: '60px', padding: '8px' }}
                        />
                      </div>

                      {/* Font Size Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span className="label">Font Size ({activeText.fontSize}px)</span>
                        <input
                          type="range"
                          min="10"
                          max="72"
                          value={activeText.fontSize}
                          onChange={(e) => updateEditingPageText(activeText.id, { fontSize: parseInt(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Color Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span className="label">Text Color</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[
                            { color: '#000000', name: 'Black' },
                            { color: '#FFFFFF', name: 'White', border: '1px solid var(--border-strong)' },
                            { color: '#FF0000', name: 'Red' },
                            { color: '#0000FF', name: 'Blue' },
                            { color: '#008000', name: 'Green' }
                          ].map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => updateEditingPageText(activeText.id, { color: c.color })}
                              title={c.name}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: c.color,
                                border: activeText.color === c.color ? '2.5px solid var(--primary)' : (c.border || 'none'),
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="divider" style={{ margin: '6px 0' }} />

                      {/* Delete node */}
                      <button
                        type="button"
                        onClick={() => deleteTextFromEditingPage(activeText.id)}
                        className="btn-ghost"
                        style={{ width: '100%', color: '#EF4444', borderColor: '#FECACA', background: '#FFF5F5', fontWeight: 700 }}
                      >
                        Delete Text Box
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-3)', fontSize: '11px', fontWeight: 600 }}>
                      Select a text box on the page to customize its styling and content.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                <button
                  type="button"
                  onClick={closePageEditor}
                  className="btn-primary"
                  style={{ height: '36px', padding: '0 24px' }}
                >
                  Apply &amp; Close
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
