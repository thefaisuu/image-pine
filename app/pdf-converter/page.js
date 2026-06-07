"use client";
import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>), title: 'PDF to Image', desc: 'Convert each PDF page to JPEG or PNG.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3l4 4-4 4M16 21l-4-4 4-4"/><path d="M12 7H5a2 2 0 00-2 2v2M12 17h7a2 2 0 002-2v-2"/></svg>), title: 'Image to PDF', desc: 'Combine multiple images into one PDF.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), title: '100% Private', desc: 'Browser-based - no files uploaded.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>), title: 'Fast', desc: 'Instant conversion using PDF.js.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>), title: 'Free Forever', desc: 'No account, no watermark.' },
  { icon: (<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>), title: 'No Watermarks', desc: 'Clean outputs with no added branding.' }
];

const _STEPS = [
  { n: '1', title: 'Upload', desc: 'Upload your PDF or image files.' },
  { n: '2', title: 'Convert', desc: 'Select direction: PDF to images or images to PDF.' },
  { n: '3', title: 'Download', desc: 'Download your converted file(s).' }
];

const _FAQS = [
  { q: 'Can I convert multi-page PDFs?', a: 'Yes - each page exported as a separate image.' },
  { q: 'Are my files uploaded?', a: 'No. All conversion runs in your browser.' }
];

export default function PdfConverterPage() {
  const [file, setFile] = useState(null);
  
  // PDF Data
  const [pageCount, setPageCount] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "What metadata can this tool extract?",
      a: "It reads standard PDF fields: Title, Subject, Author, Creator, Producer, Creation Date, and Modification Date."
    },
    {
      q: "Is it safe to inspect private contracts or documents?",
      a: "Absolutely. The file parsing and inspection happen entirely inside your web browser. No document data is sent to external servers."
    },
    {
      q: "What does the \"Optimised Copy\" download do?",
      a: "It utilizes stream-packing to rebuild the file structure, clean unreferenced objects, and garbage-collect remnants of old edits, often resulting in a smaller file size."
    },
    {
      q: "Does it support password-protected files?",
      a: "No, encrypted or password-secured files cannot be opened client-side without credentials. Please unlock the file before inspecting."
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

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      const selected = selectedList[0];
      setFile(selected);
      readPdfDetails(selected);
    } else {
      setFile(null);
      setPageCount(0);
      setMetadata(null);
    }
    setErrorMsg('');
  };

  const readPdfDetails = async (selectedFile) => {
    setIsProcessing(true);
    setErrorMsg('');
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          
          setPageCount(pdfDoc.getPageCount());
          
          setMetadata({
            title: pdfDoc.getTitle() || 'N/A',
            author: pdfDoc.getAuthor() || 'N/A',
            subject: pdfDoc.getSubject() || 'N/A',
            creator: pdfDoc.getCreator() || 'N/A',
            producer: pdfDoc.getProducer() || 'N/A',
            creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate().toLocaleString() : 'N/A',
            modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate().toLocaleString() : 'N/A',
          });
          
          setIsProcessing(false);
          saveHistory('PDF Converter', `Inspected ${selectedFile.name}`);
        } catch (err) {
          console.error(err);
          setErrorMsg('Failed to read PDF structure. Ensure the file is not password-protected.');
          setIsProcessing(false);
        }
      };

      fileReader.onerror = () => {
        setErrorMsg('Failed to read file buffer.');
        setIsProcessing(false);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load PDF processing engine.');
      setIsProcessing(false);
    }
  };

  const downloadCompressedCopy = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const pdfDoc = await PDFDocument.load(e.target.result);
          const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
          const blob = new Blob([compressedBytes], { type: 'application/pdf' });
          saveAs(blob, file.name.replace(/\.[^/.]+$/, '') + '_saved.pdf');
          setIsProcessing(false);
        } catch (err) {
          setErrorMsg(err.message || 'Error converting PDF.');
          setIsProcessing(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      setErrorMsg('Engine load error.');
      setIsProcessing(false);
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
      title="PDF Converter"
      subtitle="Convert PDF pages to images or images to PDF. Browser-based with full privacy."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Convert PDF to images or images to PDF online for free. Browser-based PDF converter, no uploads, full privacy."
    >
      <div className="flex flex-col gap-6">
        {/* Workspace */}
        {!file ? (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
                <h3 style={{ fontSize: 10, fontWeight: 800, color: "#9898B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Selected File</h3>
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

              {pageCount > 0 && (
                <button
                  onClick={downloadCompressedCopy}
                  disabled={isProcessing}
                  style={{ width: "100%", padding: "13px", fontSize: 13, fontWeight: 800, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(91,91,214,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}
                >
                  Download Optimised Copy
                </button>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-bordercolor p-6 shadow-sm flex flex-col gap-5">
              <h3 className="font-extrabold text-sm text-textmain">PDF Document Details</h3>
              
              {isProcessing && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-semibold py-10">
                  <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading details...</span>
                </div>
              )}

              {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}

              {metadata && !isProcessing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-lightbg/60 border border-bordercolor rounded-xl p-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Pages</span>
                      <span className="text-sm font-black text-primary font-mono">{pageCount} Pages</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">File Size</span>
                      <span className="text-sm font-black text-textmain font-mono">{formatSize(file.size)}</span>
                    </div>
                  </div>

                  <div className="border border-bordercolor rounded-xl p-4 space-y-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-bordercolor pb-1.5">Document Metadata</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Title</span>
                        <span className="font-semibold text-textmain">{metadata.title}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Author</span>
                        <span className="font-semibold text-textmain">{metadata.author}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Subject</span>
                        <span className="font-semibold text-textmain">{metadata.subject}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Creator tool</span>
                        <span className="font-semibold text-textmain">{metadata.creator}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Producer</span>
                        <span className="font-semibold text-textmain">{metadata.producer}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold">Creation Date</span>
                        <span className="font-semibold text-textmain">{metadata.creationDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
