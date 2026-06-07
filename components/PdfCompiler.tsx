import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';

interface PdfCompilerProps {
  onSuccess: (fileName: string) => void;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function PdfCompiler({ onSuccess }: PdfCompilerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pdfName, setPdfName] = useState('compiled-document');
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: ImageItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.heic', '.heif'],
    },
    multiple: true,
  });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStatusMessage('');
  };

  const convertImageToJpgBytes = async (file: File): Promise<Uint8Array> => {
    // If it's already a JPEG/JPG, return arrayBuffer directly
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    }

    // Standard PNG is also directly embeddable if we want, but let's draw everything else to canvas
    // to ensure consistency and support webp/svg/heic.
    return new Promise(async (resolve, reject) => {
      try {
        let imageSrc = '';
        
        // If HEIC, convert to JPEG first using heic2any
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          const heic2anyModule = await import('heic2any');
          const conversionResult = await heic2anyModule.default({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          imageSrc = URL.createObjectURL(blob);
        } else {
          imageSrc = URL.createObjectURL(file);
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available'));
            return;
          }
          
          // Fill canvas with white background (fixes transparent PNGs / SVGs)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(imageSrc);
              if (!blob) {
                reject(new Error('Canvas blob generation failed'));
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(new Uint8Array(reader.result as ArrayBuffer));
              };
              reader.readAsArrayBuffer(blob);
            },
            'image/jpeg',
            0.9
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageSrc);
          reject(new Error('Failed to load image source'));
        };

        img.src = imageSrc;
      } catch (err) {
        reject(err);
      }
    });
  };

  const compilePdf = async () => {
    if (images.length === 0) return;

    setIsCompiling(true);
    setStatusMessage('Loading PDF libraries...');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStatusMessage(`Processing image ${i + 1} of ${images.length}...`);
        
        const jpgBytes = await convertImageToJpgBytes(item.file);
        const embeddedImage = await pdfDoc.embedJpg(jpgBytes);
        
        const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1.0);
        
        // Add page matching the size of the embedded image
        const page = pdfDoc.addPage([imgWidth, imgHeight]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
        });
      }

      setStatusMessage('Generating PDF document...');
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      
      const fileName = `${pdfName.trim() || 'compiled-document'}.pdf`;
      saveAs(pdfBlob, fileName);
      onSuccess(fileName);

      setStatusMessage('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || 'Failed to compile PDF'}`);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-bordercolor p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-semibold text-textmain text-lg">Images to PDF</h2>
          <p className="text-xs text-gray-400 mt-0.5">Combine photos, screenshots, and illustrations into a single PDF document</p>
        </div>
        {images.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-gray-400 hover:text-textmain transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-blue-50/30'
            : 'border-bordercolor hover:border-primary/50 bg-lightbg/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-full shadow-sm border border-bordercolor mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-textmain">
            {isDragActive ? 'Drop images here...' : 'Drag & drop image files here'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Accepts JPG, PNG, WEBP, SVG, HEIC</p>
        </div>
      </div>

      {/* Preview Area */}
      {images.length > 0 && (
        <div className="mt-6 flex-1 flex flex-col min-h-[300px]">
          {/* Settings Bar */}
          <div className="bg-lightbg rounded-xl p-4 border border-bordercolor mb-4 flex flex-col sm:flex-row gap-3.5 sm:items-center justify-between">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                PDF File Name
              </label>
              <input
                type="text"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                className="w-full text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-white px-3 py-1.5 focus:outline-none focus:border-primary"
                placeholder="compiled-document"
              />
            </div>
            <button
              onClick={compilePdf}
              disabled={isCompiling}
              className="py-2 px-5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all duration-200 self-end sm:self-center h-fit flex items-center gap-1.5"
            >
              {isCompiling ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Compile PDF
                </>
              )}
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs text-primary font-semibold mb-3 animate-pulse">
              {statusMessage}
            </p>
          )}

          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Reorder Images ({images.length})
          </h3>

          {/* List of images */}
          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 flex-1 scrollbar-thin">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="p-3 bg-white border border-bordercolor rounded-xl flex items-center justify-between gap-4 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-bordercolor bg-lightbg flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-textmain truncate" title={img.file.name}>
                      {img.file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-bold">
                      Page {idx + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Reordering Controls */}
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-textmain disabled:opacity-20 transition-all rounded-lg hover:bg-lightbg"
                    title="Move Up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="p-1 text-gray-400 hover:text-textmain disabled:opacity-20 transition-all rounded-lg hover:bg-lightbg"
                    title="Move Down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-lightbg transition-colors ml-1"
                    title="Delete Page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
