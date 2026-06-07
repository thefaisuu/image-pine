"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Premium UploadBox - redesigned for a clean, spacious, modern experience.
 * Props:
 *   onFileSelect(files) - callback
 *   acceptedFormats - e.g. ['.jpg', '.png']
 *   multiple - boolean (default true)
 */
export default function UploadBox({ onFileSelect, acceptedFormats, multiple = true }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const mapped = acceptedFiles.map((file) => Object.assign(file, {
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      id: Math.random().toString(36).slice(2, 9),
    }));
    const updated = multiple ? [...selectedFiles, ...mapped] : mapped.slice(0, 1);
    // revoke old single-file URL
    if (!multiple && selectedFiles[0]?.preview) URL.revokeObjectURL(selectedFiles[0].preview);
    setSelectedFiles(updated);
    onFileSelect?.(updated);
  }, [selectedFiles, multiple, onFileSelect]);

  const getAcceptObject = () => {
    if (!acceptedFormats?.length) return undefined;
    const map = {};
    acceptedFormats.forEach((fmt) => {
      const f = fmt.toLowerCase().trim();
      if (['.jpg', '.jpeg'].includes(f)) map['image/jpeg'] = ['.jpg', '.jpeg'];
      else if (f === '.png')   map['image/png']  = ['.png'];
      else if (f === '.webp')  map['image/webp'] = ['.webp'];
      else if (f === '.gif')   map['image/gif']  = ['.gif'];
      else if (f === '.svg')   map['image/svg+xml'] = ['.svg'];
      else if (['.heic', '.heif'].includes(f)) { map['image/heic'] = ['.heic']; map['image/heif'] = ['.heif']; }
      else if (f === '.pdf')   map['application/pdf'] = ['.pdf'];
      else map['*/*'] = [f];
    });
    return map;
  };

  const removeFile = (id, e) => {
    e.stopPropagation();
    const f = selectedFiles.find(x => x.id === id);
    if (f?.preview) URL.revokeObjectURL(f.preview);
    const updated = selectedFiles.filter(x => x.id !== id);
    setSelectedFiles(updated);
    onFileSelect?.(updated);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    selectedFiles.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
    onFileSelect?.([]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: selectedFiles.length > 0,
    noKeyboard: selectedFiles.length > 0,
    multiple,
    accept: getAcceptObject(),
  });

  const fmt = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Drop Zone ───────────────────────────────────────────── */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#5B5BD6' : '#C7C7E2'}`,
          borderRadius: 16,
          padding: hasFiles ? '16px' : '48px 24px',
          minHeight: hasFiles ? undefined : 220,
          textAlign: 'center',
          background: isDragActive ? '#EEF0FF' : hasFiles ? '#FAFAFA' : '#FAFAFF',
          transition: 'all 0.22s ease',
          cursor: hasFiles ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input {...getInputProps()} />

        {/* Drag glow overlay */}
        {isDragActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(91,91,214,0.08) 0%, rgba(124,58,237,0.06) 100%)',
            borderRadius: 14, pointerEvents: 'none',
          }} />
        )}

        {!hasFiles ? (
          /* ── Empty State ──────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #EEF0FF 0%, #F3EEFF 100%)',
              border: '1.5px solid rgba(91,91,214,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(91,91,214,0.10)',
            }}>
              <svg width="30" height="30" fill="none" stroke="#5B5BD6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111128', margin: 0 }}>
                {isDragActive ? 'Drop your files here' : 'Drop files here or click to browse'}
              </p>
              <p style={{ fontSize: 12, color: '#9898B5', margin: 0, fontWeight: 400 }}>
                {acceptedFormats?.length
                  ? acceptedFormats.map(f => f.replace('.', '').toUpperCase()).join(' · ')
                  : 'All image formats supported'
                }
                {' · '}Up to 15 MB
              </p>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); open(); }}
              style={{
                background: 'linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 24px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,91,214,0.30)',
                transition: 'all 0.18s ease', letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,91,214,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,91,214,0.30)'; }}
            >
              Choose {multiple ? 'Files' : 'File'}
            </button>
          </div>
        ) : (
          /* ── Files Selected State ─────────────────── */
          <div style={{ textAlign: 'left' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                {multiple && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); open(); }}
                    style={{ fontSize: 11, fontWeight: 700, color: '#5B5BD6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    + Add More
                  </button>
                )}
                <button type="button" onClick={clearAll}
                  style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Clear All
                </button>
              </div>
            </div>

            {/* Thumbnail grid (images) or file list */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: multiple ? 'repeat(auto-fill, minmax(70px, 1fr))' : '1fr',
              gap: 8,
              maxHeight: 200, overflowY: 'auto',
            }}>
              {selectedFiles.map((file) => (
                multiple ? (
                  /* Thumbnail card */
                  <div key={file.id} style={{
                    position: 'relative', borderRadius: 10,
                    border: '1.5px solid #E4E4EF', overflow: 'hidden',
                    background: '#F7F7FB', aspectRatio: '1',
                  }}>
                    {file.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.preview} alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" fill="none" stroke="#9898B5" strokeWidth="1.6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <button onClick={(e) => removeFile(file.id, e)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', padding: 0,
                      }}>
                      <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                    {/* filename tooltip */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)',
                      padding: '14px 4px 4px',
                    }}>
                      <p style={{ fontSize: 8, color: '#fff', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Single file row */
                  <div key={file.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 12,
                    border: '1.5px solid #E4E4EF', background: '#fff',
                  }}>
                    {/* Preview */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                      border: '1px solid #E4E4EF', flexShrink: 0,
                      background: '#F7F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {file.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.preview} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg width="22" height="22" fill="none" stroke="#9898B5" strokeWidth="1.6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111128', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: 11, color: '#9898B5', margin: 0, fontWeight: 500 }}>
                        {fmt(file.size)}
                        {file.preview && ' · Image'}
                      </p>
                    </div>
                    {/* Remove */}
                    <button onClick={(e) => removeFile(file.id, e)} type="button"
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: '1px solid #E4E4EF',
                        background: '#F7F7FB', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        color: '#9898B5', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F7F7FB'; e.currentTarget.style.borderColor = '#E4E4EF'; e.currentTarget.style.color = '#9898B5'; }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
