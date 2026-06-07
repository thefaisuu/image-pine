import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';

interface ImageZipperProps {
  onSuccess: (fileName: string) => void;
}

interface ZipFileItem {
  id: string;
  file: File;
  size: number;
}

export default function ImageZipper({ onSuccess }: ImageZipperProps) {
  const [files, setFiles] = useState<ZipFileItem[]>([]);
  const [zipName, setZipName] = useState('archived-images');
  const [conversionMode, setConversionMode] = useState<'original' | 'jpeg' | 'png'>('original');
  const [jpegQuality, setJpegQuality] = useState(0.9);
  const [isZipping, setIsZipping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: ZipFileItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      size: file.size,
    }));
    setFiles((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setStatusMessage('');
  };

  const convertImage = async (file: File, format: 'jpeg' | 'png'): Promise<Blob> => {
    // If it's already the target format, we can skip canvas drawing (unless we want to compress jpeg)
    if (format === 'jpeg' && (file.type === 'image/jpeg' || file.type === 'image/jpg') && jpegQuality === 1.0) {
      return file;
    }
    if (format === 'png' && file.type === 'image/png') {
      return file;
    }

    return new Promise(async (resolve, reject) => {
      try {
        let imageSrc = '';
        
        // HEIC conversion
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          const heic2anyModule = await import('heic2any');
          const conversionResult = await heic2anyModule.default({
            blob: file,
            toType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
            quality: format === 'jpeg' ? jpegQuality : undefined,
          });
          const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          resolve(blob);
          return;
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
            reject(new Error('Canvas context not available'));
            return;
          }

          if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(imageSrc);
              if (!blob) {
                reject(new Error('Failed to generate image blob'));
                return;
              }
              resolve(blob);
            },
            `image/${format}`,
            format === 'jpeg' ? jpegQuality : undefined
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageSrc);
          reject(new Error('Failed to load image in canvas'));
        };

        img.src = imageSrc;
      } catch (err) {
        reject(err);
      }
    });
  };

  const createZip = async () => {
    if (files.length === 0) return;

    setIsZipping(true);
    setStatusMessage('Loading ZIP libraries...');

    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default;
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatusMessage(`Compressing file ${i + 1} of ${files.length}...`);
        
        let fileBlob: Blob = item.file;
        let fileName = item.file.name;

        if (conversionMode !== 'original' && item.file.type.startsWith('image/')) {
          setStatusMessage(`Converting ${item.file.name} to ${conversionMode.toUpperCase()}...`);
          try {
            fileBlob = await convertImage(item.file, conversionMode);
            fileName = item.file.name.replace(/\.[^/.]+$/, '') + `.${conversionMode}`;
          } catch (err) {
            console.error(`Failed to convert ${item.file.name}, adding original instead.`, err);
            fileBlob = item.file;
            fileName = item.file.name;
          }
        }

        zip.file(fileName, fileBlob);
      }

      setStatusMessage('Building ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const outputName = `${zipName.trim() || 'archived-images'}.zip`;
      saveAs(zipBlob, outputName);
      onSuccess(outputName);
      
      setStatusMessage('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || 'Failed to create ZIP file'}`);
    } finally {
      setIsZipping(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-bordercolor p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-semibold text-textmain text-lg">Image Zipper</h2>
          <p className="text-xs text-gray-400 mt-0.5">Compress multiple images or convert them all into a structured ZIP archive</p>
        </div>
        {files.length > 0 && (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-textmain">
            {isDragActive ? 'Drop files here...' : 'Drag & drop image files here'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Accepts any photo, illustration or archive files</p>
        </div>
      </div>

      {/* File List / Actions */}
      {files.length > 0 && (
        <div className="mt-6 flex-1 flex flex-col min-h-[300px]">
          {/* Options Bar */}
          <div className="bg-lightbg rounded-xl p-4 border border-bordercolor mb-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zip Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  ZIP File Name
                </label>
                <input
                  type="text"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  className="w-full text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-white px-3 py-1.5 focus:outline-none focus:border-primary"
                  placeholder="archived-images"
                />
              </div>

              {/* Conversion Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Output Format Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['original', 'jpeg', 'png'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConversionMode(mode)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all duration-200 focus:outline-none ${
                        conversionMode === mode
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-bordercolor bg-white hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      {mode === 'original' ? 'As Is' : mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Slider (JPEG mode only) */}
            {conversionMode === 'jpeg' && (
              <div className="pt-2 border-t border-bordercolor/60">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    JPEG Compression Quality
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {Math.round(jpegQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}

            {/* Zip Button */}
            <button
              onClick={createZip}
              disabled={isZipping}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5 w-full md:w-auto md:self-end"
            >
              {isZipping ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating ZIP...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Generate & Download ZIP
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
            Files ({files.length})
          </h3>

          {/* List of files */}
          <div className="space-y-2.5 overflow-y-auto max-h-[260px] pr-1 flex-1 scrollbar-thin">
            {files.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white border border-bordercolor rounded-xl flex items-center justify-between gap-4 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-lightbg rounded-lg text-primary flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-textmain truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {formatSize(item.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-lightbg transition-colors flex-shrink-0"
                  title="Remove File"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
