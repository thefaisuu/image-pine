import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';

interface Preferences {
  defaultFormat: 'jpeg' | 'png';
  jpegQuality: number;
  autoDownload: boolean;
}

interface HeicConverterProps {
  prefs: Preferences;
  onSuccess: (fileName: string) => void;
}

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  errorMsg?: string;
  targetFormat: 'jpeg' | 'png';
}

export default function HeicConverter({ prefs, onSuccess }: HeicConverterProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: FileItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      status: 'pending',
      progress: 0,
      targetFormat: prefs.defaultFormat,
    }));
    setFiles((prev) => [...prev, ...newItems]);
  }, [prefs.defaultFormat]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/heic': ['.heic', '.HEIC'],
      'image/heif': ['.heif', '.HEIF'],
    },
    multiple: true,
  });

  const convertSingleFile = async (item: FileItem, targetFormat?: 'jpeg' | 'png') => {
    const format = targetFormat || item.targetFormat;
    
    setFiles((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? { ...f, status: 'converting', progress: 30, targetFormat: format }
          : f
      )
    );

    try {
      // Dynamic import of heic2any to prevent SSR window reference error
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default;

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, progress: 60 } : f))
      );

      const conversionResult = await heic2any({
        blob: item.file,
        toType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: format === 'jpeg' ? prefs.jpegQuality : undefined,
      });

      const resultBlob = Array.isArray(conversionResult)
        ? conversionResult[0]
        : conversionResult;

      const resultUrl = URL.createObjectURL(resultBlob);
      
      const newFileName = item.file.name.replace(/\.[^/.]+$/, '') + `.${format}`;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'completed', progress: 100, resultBlob, resultUrl }
            : f
        )
      );

      onSuccess(newFileName);

      if (prefs.autoDownload) {
        saveAs(resultBlob, newFileName);
      }
    } catch (err: any) {
      console.error(err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error', errorMsg: err.message || 'Conversion failed' }
            : f
        )
      );
    }
  };

  const convertAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConvertingAll(true);
    for (const item of pendingFiles) {
      await convertSingleFile(item);
    }
    setIsConvertingAll(false);
  };

  const downloadFile = (item: FileItem) => {
    if (item.resultBlob && item.status === 'completed') {
      const ext = item.targetFormat;
      const newFileName = item.file.name.replace(/\.[^/.]+$/, '') + `.${ext}`;
      saveAs(item.resultBlob, newFileName);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.resultUrl) {
        URL.revokeObjectURL(item.resultUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
    });
    setFiles([]);
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
          <h2 className="font-semibold text-textmain text-lg">HEIC to JPG/PNG</h2>
          <p className="text-xs text-gray-400 mt-0.5">Convert high-efficiency images from your iPhone right in your browser</p>
        </div>
        {files.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-gray-400 hover:text-textmain transition-colors"
          >
            Clear Files
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-textmain">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop HEIC / HEIF files here'}
          </p>
          <p className="text-xs text-gray-400 mt-1">or click to browse from your device</p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 flex-1 flex flex-col min-h-[200px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Files ({files.length})
            </h3>
            {files.some((f) => f.status === 'pending') && (
              <button
                onClick={convertAll}
                disabled={isConvertingAll}
                className="py-1 px-3 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-all duration-200"
              >
                {isConvertingAll ? 'Converting...' : 'Convert All'}
              </button>
            )}
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 flex-1 scrollbar-thin">
            {files.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white border border-bordercolor rounded-xl flex items-center justify-between gap-4 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-lightbg rounded-lg text-primary flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-textmain truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {formatSize(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 flex-shrink-0">
                  {/* Status Indicator */}
                  {item.status === 'converting' && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <svg className="animate-spin h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Converting
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </span>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100" title={item.errorMsg}>
                      Error
                    </span>
                  )}

                  {/* Format Selector (only when pending) */}
                  {item.status === 'pending' && (
                    <select
                      value={item.targetFormat}
                      onChange={(e) => {
                        const val = e.target.value as 'jpeg' | 'png';
                        setFiles((prev) =>
                          prev.map((f) =>
                            f.id === item.id ? { ...f, targetFormat: val } : f
                          )
                        );
                      }}
                      className="text-xs font-semibold text-textmain border border-bordercolor rounded-lg bg-lightbg px-2 py-1 focus:outline-none"
                    >
                      <option value="jpeg">JPG</option>
                      <option value="png">PNG</option>
                    </select>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => convertSingleFile(item)}
                        className="p-1.5 hover:bg-lightbg text-primary rounded-lg transition-colors"
                        title="Convert"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}

                    {item.status === 'completed' && (
                      <button
                        onClick={() => downloadFile(item)}
                        className="p-1.5 hover:bg-lightbg text-primary rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 hover:bg-lightbg text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
