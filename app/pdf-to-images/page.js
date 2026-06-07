"use client";
import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>), title: 'Page Extraction', desc: 'Export every PDF page as a high-quality image.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>), title: 'High Resolution', desc: 'Set DPI for sharp image output.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: '100% Private', desc: 'Browser-based - no uploads.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>), title: 'Fast', desc: 'Renders pages with PDF.js in seconds.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>), title: 'JPEG & PNG', desc: 'Choose your preferred output format.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), title: 'Free Forever', desc: 'No account, no watermark.' }
];

const _STEPS = [
  { n: '1', title: 'Upload PDF', desc: 'Select your PDF file.' },
  { n: '2', title: 'Set Options', desc: 'Choose format and resolution.' },
  { n: '3', title: 'Download', desc: 'Download all pages as images.' }
];

const _FAQS = [
  { q: 'Are all pages extracted?', a: 'Yes - each page becomes a separate image.' },
  { q: 'Are files uploaded?', a: 'No. PDF.js renders pages locally.' }
];

export default function PdfToImagesPage() {
  const [file, setFile] = useState(null);
  
  // Output states
  const [pages, setPages] = useState([]); // Array of { number: number, blob: Blob, url: string }
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "What image format does the converter export?",
      a: "It exports high-fidelity PNG images to preserve text borders, color gradients, and layout shapes without compression blur."
    },
    {
      q: "Can I download specific pages instead of all of them?",
      a: "Yes, you can click \"Download\" on any individual page thumbnail, or click \"Download All as ZIP\" to download everything at once."
    },
    {
      q: "Is there a page limit for conversion?",
      a: "No, you can convert documents with any page count. For larger files, processing may take a few seconds as it renders each page sequentially."
    },
    {
      q: "How are page dimensions determined?",
      a: "The engine reads the original PDF viewport bounds and renders the output PNG at a high-definition scale (1.5x) to maintain text sharpness."
    }
  ];

  // Manage object URLs lifetime safely to prevent memory leaks and premature revocation
  const prevPreviewsRef = useRef([]);
  useEffect(() => {
    const currentPreviews = [file?.preview].filter(Boolean);
    const removedPreviews = prevPreviewsRef.current.filter(p => !currentPreviews.includes(p));
    removedPreviews.forEach(url => URL.revokeObjectURL(url));
    prevPreviewsRef.current = currentPreviews;
  }, [file]);

  useEffect(() => {
    return () => {
      prevPreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Clean up page blobs on selection change or unmount
  useEffect(() => {
    return () => {
      pages.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [pages]);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
    } else {
      setFile(null);
    }
    // Revoke old page URLs
    pages.forEach((p) => {
      if (p.url) URL.revokeObjectURL(p.url);
    });
    setPages([]);
    setProcessedCount(0);
    setTotalCount(0);
    setErrorMsg('');
  };

  // Dynamically load PDF.js from cdnjs in browser
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

  const processPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalCount(0);
    setErrorMsg('');

    // Revoke old page URLs
    pages.forEach((p) => {
      if (p.url) URL.revokeObjectURL(p.url);
    });
    setPages([]);

    try {
      const pdfjs = await loadPdfJs();
      
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          const numPages = pdf.numPages;
          setTotalCount(numPages);
          
          const renderedPages = [];

          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // High-quality rendering scale
            
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Canvas 2D context not available.');
            }

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport,
            };

            await page.render(renderContext).promise;

            const blob = await new Promise((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/png');
            });

            if (blob) {
              const url = URL.createObjectURL(blob);
              renderedPages.push({
                number: i,
                blob,
                url,
              });
            }

            setProcessedCount(i);
          }

          setPages(renderedPages);
          setIsProcessing(false);
          saveHistory('PDF to Images', `${file.name} (${numPages} pages)`);
        } catch (err) {
          console.error(err);
          setErrorMsg(err.message || 'Error occurred during PDF rendering.');
          setIsProcessing(false);
        }
      };

      fileReader.onerror = () => {
        setErrorMsg('Failed to read PDF file.');
        setIsProcessing(false);
      };

      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to initialize PDF renderer.');
      setIsProcessing(false);
    }
  };

  const downloadSinglePage = (p) => {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newName = `${baseName}_page_${p.number}.png`;
    saveAs(p.blob, newName);
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;

    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default;
      const zip = new JSZip();

      const baseName = file.name.replace(/\.[^/.]+$/, '');

      pages.forEach((p) => {
        zip.file(`${baseName}_page_${p.number}.png`, p.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${baseName}_images.zip`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to build ZIP archive. Please try again.');
    }
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
      title="PDF to Images"
      subtitle="Extract pages from a PDF and save them as JPEG or PNG images. Free, browser-based."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Convert PDF pages to images online for free. Extract each page as JPEG or PNG in your browser. No uploads."
    >
      <div className="flex flex-col gap-6">
        {/* Workspace */}
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
            <UploadBox 
              onFileSelect={handleFileSelect} 
              acceptedFormats={['.pdf']}
              multiple={false} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div style={{ background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", height: "fit-content", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="flex justify-between items-center pb-2 border-b border-bordercolor">
                <h3 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Uploaded PDF</h3>
                <button onClick={() => handleFileSelect([])} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
              </div>

              <div className="p-3 bg-lightbg/45 border border-bordercolor/60 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-white border border-bordercolor rounded-lg text-primary flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-xs font-bold text-textmain truncate" title={file.name}>{file.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Size: {formatSize(file.size)}</p>
                </div>
              </div>

              <button
                onClick={processPdf}
                disabled={isProcessing}
                style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(91,91,214,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
              >
                {isProcessing ? 'Rendering...' : 'Render PDF Pages'}
              </button>

              {pages.length > 0 && (
                <button
                  onClick={downloadAllAsZip}
                  style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(22,163,74,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                >
                  Download All as ZIP
                </button>
              )}
            </div>

            <div style={{ gridColumn: "span 2 / span 2", background: "#fff", border: "1px solid #E4E4EF", borderRadius: 20, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 22 }}>
              <h4 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>PDF Pages Previews</h4>
              
              {isProcessing && (
                <div className="bg-lightbg/60 border border-bordercolor rounded-xl p-6 flex flex-col gap-3 items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-bold text-textmain">Rendering page {processedCount} of {totalCount}...</span>
                </div>
              )}

              {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}

              {pages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {pages.map((p) => (
                    <div key={p.number} className="border border-bordercolor bg-lightbg/40 rounded-xl p-3 flex flex-col gap-2 shadow-sm hover:border-primary/50 transition-colors">
                      <span className="text-[10px] font-black text-gray-400">PAGE {p.number}</span>
                      <div className="aspect-[3/4] w-full flex items-center justify-center bg-white border border-bordercolor/60 rounded-lg overflow-hidden relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Page ${p.number}`} className="max-h-full max-w-full object-contain" />
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => downloadSinglePage(p)}
                            className="bg-primary hover:bg-primary/95 text-white rounded-lg p-2 font-bold text-[10px] shadow"
                          >
                            Download PNG
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isProcessing && pages.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-10 font-medium">
                  Select "Render PDF Pages" to generate static image previews.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
