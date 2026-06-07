"use client";

import React, { useState, useEffect } from 'react';
import ToolPageShell from '@/components/ToolPageShell';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';

export default function MetadataPage() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isStripping, setIsStripping] = useState(false);

  const _FEATURES = [
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: '100% Private',
      desc: 'Metadata extraction and stripping run strictly in your browser. Your photos never touch any server.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      title: 'Lossless Stripping',
      desc: 'Strips APP1 segments from the JPEG binary directly. Zero re-compression, keeping 100% original quality.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Detailed EXIF Reader',
      desc: 'Parses binary headers to show camera settings, GPS locations, modification dates, and software tags.'
    }
  ];

  const _STEPS = [
    { n: '1', title: 'Upload Photo', desc: 'Select a JPEG or JPG photo containing metadata.' },
    { n: '2', title: 'View EXIF Tags', desc: 'Read the extracted device details, GPS coordinates, and dates.' },
    { n: '3', title: 'Download Cleaned Copy', desc: 'Save the image with all EXIF data instantly erased.' }
  ];

  const _FAQS = [
    { q: 'What is EXIF metadata?', a: 'Exchangeable Image File Format (EXIF) is data saved inside your photos by cameras and smartphones. It often includes sensitive information like your exact GPS coordinates, date/time, camera model, and device settings.' },
    { q: 'How does lossless stripping work?', a: 'Instead of loading your image onto a canvas and re-saving it (which degrades pixel quality), we parse the binary stream of the JPEG, locate the APP1 EXIF segment (0xFFE1), and remove it directly. The pixel data remains untouched.' },
    { q: 'Is my data secure?', a: 'Yes. All parsing and binary modification happen locally in your browser tab. Your files are never sent over the internet.' }
  ];

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setMetadata(null);
    setErrorMsg('');
    parseMetadata(selected);
  };

  const parseMetadata = (fileObj) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const tags = readExifTags(buffer);
        setMetadata(tags);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to parse EXIF metadata. The file might not contain EXIF tags.');
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  // Binary EXIF parser for common tags
  const readExifTags = (buffer) => {
    const view = new DataView(buffer);
    if (view.byteLength < 4) return null;
    
    // Check SOI marker
    if (view.getUint16(0, false) !== 0xFFD8) {
      return { _error: 'Not a valid JPEG image' };
    }

    let offset = 2;
    const length = view.byteLength;
    let exifDataView = null;
    let isLittleEndian = true;

    while (offset < length - 2) {
      const marker = view.getUint16(offset, false);
      if (marker === 0xFFE1) {
        // Found APP1
        const segmentLength = view.getUint16(offset + 2, false);
        const exifHeader = view.getUint32(offset + 4, false);
        
        // Check "Exif" ASCII (0x45786966)
        if (exifHeader === 0x45786966) {
          // EXIF payload starts at offset + 10 (after APP1 marker, length, and "Exif\0\0" header)
          const exifStart = offset + 10;
          exifDataView = new DataView(buffer, exifStart, segmentLength - 8);
          break;
        }
        offset += 2 + segmentLength;
      } else if ((marker & 0xFF00) === 0xFF00) {
        // Skip other segments
        const segmentLength = view.getUint16(offset + 2, false);
        offset += 2 + segmentLength;
      } else {
        offset++;
      }
    }

    if (!exifDataView) {
      return { hasExif: false };
    }

    // Read TIFF Header
    const tiffHeader = exifDataView.getUint16(0, false);
    if (tiffHeader === 0x4949) {
      isLittleEndian = true;
    } else if (tiffHeader === 0x4D4D) {
      isLittleEndian = false;
    } else {
      return { hasExif: false };
    }

    if (exifDataView.getUint16(2, isLittleEndian) !== 0x002A) {
      return { hasExif: false };
    }

    const firstIfdOffset = exifDataView.getUint32(4, isLittleEndian);
    const tags = { hasExif: true };

    const parseIfd = (ifdOffset) => {
      if (ifdOffset >= exifDataView.byteLength) return;
      const numEntries = exifDataView.getUint16(ifdOffset, isLittleEndian);
      let nextOffset = ifdOffset + 2;

      for (let i = 0; i < numEntries; i++) {
        const tag = exifDataView.getUint16(nextOffset, isLittleEndian);
        const type = exifDataView.getUint16(nextOffset + 2, isLittleEndian);
        const count = exifDataView.getUint32(nextOffset + 4, isLittleEndian);
        const valOffset = exifDataView.getUint32(nextOffset + 8, isLittleEndian);

        // Parse common tags
        let value = null;
        if (type === 2) {
          // ASCII String
          const strOffset = count <= 4 ? nextOffset + 8 : valOffset;
          let str = '';
          for (let j = 0; j < count - 1; j++) {
            str += String.fromCharCode(exifDataView.getUint8(strOffset + j));
          }
          value = str.trim();
        } else if (type === 3) {
          // SHORT
          value = exifDataView.getUint16(nextOffset + 8, isLittleEndian);
        } else if (type === 4) {
          // LONG
          value = exifDataView.getUint32(nextOffset + 8, isLittleEndian);
        } else if (type === 5) {
          // RATIONAL
          const num = exifDataView.getUint32(valOffset, isLittleEndian);
          const den = exifDataView.getUint32(valOffset + 4, isLittleEndian);
          value = den === 0 ? 0 : num / den;
        }

        if (value !== null) {
          if (tag === 0x010F) tags.make = value; // Camera Make
          else if (tag === 0x0110) tags.model = value; // Camera Model
          else if (tag === 0x0132) tags.dateTime = value; // Date/Time
          else if (tag === 0x013B) tags.artist = value; // Artist
          else if (tag === 0x010E) tags.description = value; // Image Title
          else if (tag === 0x0131) tags.software = value; // Software
          else if (tag === 0x8825) {
            // GPS IFD Pointer
            parseGpsIfd(valOffset);
          } else if (tag === 0x8769) {
            // Exif SubIFD Pointer
            parseSubIfd(valOffset);
          }
        }
        nextOffset += 12;
      }
    };

    const parseSubIfd = (subIfdOffset) => {
      if (subIfdOffset >= exifDataView.byteLength) return;
      const numEntries = exifDataView.getUint16(subIfdOffset, isLittleEndian);
      let nextOffset = subIfdOffset + 2;

      for (let i = 0; i < numEntries; i++) {
        const tag = exifDataView.getUint16(nextOffset, isLittleEndian);
        const type = exifDataView.getUint16(nextOffset + 2, isLittleEndian);
        const count = exifDataView.getUint32(nextOffset + 4, isLittleEndian);
        const valOffset = exifDataView.getUint32(nextOffset + 8, isLittleEndian);

        let value = null;
        if (type === 5 || type === 10) {
          const num = exifDataView.getUint32(valOffset, isLittleEndian);
          const den = exifDataView.getUint32(valOffset + 4, isLittleEndian);
          value = den === 0 ? 0 : num / den;
        } else if (type === 2) {
          const strOffset = count <= 4 ? nextOffset + 8 : valOffset;
          let str = '';
          for (let j = 0; j < count - 1; j++) {
            str += String.fromCharCode(exifDataView.getUint8(strOffset + j));
          }
          value = str.trim();
        }

        if (value !== null) {
          if (tag === 0x829D) tags.fNumber = `f/${value.toFixed(1)}`;
          else if (tag === 0x829A) tags.exposureTime = value < 1 ? `1/${Math.round(1/value)}s` : `${value}s`;
          else if (tag === 0x8827) tags.iso = value;
          else if (tag === 0x920A) tags.focalLength = `${value} mm`;
        }
        nextOffset += 12;
      }
    };

    const parseGpsIfd = (gpsOffset) => {
      if (gpsOffset >= exifDataView.byteLength) return;
      const numEntries = exifDataView.getUint16(gpsOffset, isLittleEndian);
      let nextOffset = gpsOffset + 2;
      let latRef = 'N', lonRef = 'E';
      let latDeg = 0, latMin = 0, latSec = 0;
      let lonDeg = 0, lonMin = 0, lonSec = 0;

      for (let i = 0; i < numEntries; i++) {
        const tag = exifDataView.getUint16(nextOffset, isLittleEndian);
        const valOffset = exifDataView.getUint32(nextOffset + 8, isLittleEndian);

        if (tag === 0x0001) {
          // GPS Latitude Ref
          latRef = String.fromCharCode(exifDataView.getUint8(nextOffset + 8));
        } else if (tag === 0x0003) {
          // GPS Longitude Ref
          lonRef = String.fromCharCode(exifDataView.getUint8(nextOffset + 8));
        } else if (tag === 0x0002) {
          // GPS Latitude (3 Rationals)
          latDeg = exifDataView.getUint32(valOffset, isLittleEndian) / exifDataView.getUint32(valOffset + 4, isLittleEndian);
          latMin = exifDataView.getUint32(valOffset + 8, isLittleEndian) / exifDataView.getUint32(valOffset + 12, isLittleEndian);
          latSec = exifDataView.getUint32(valOffset + 16, isLittleEndian) / exifDataView.getUint32(valOffset + 20, isLittleEndian);
        } else if (tag === 0x0004) {
          // GPS Longitude (3 Rationals)
          lonDeg = exifDataView.getUint32(valOffset, isLittleEndian) / exifDataView.getUint32(valOffset + 4, isLittleEndian);
          lonMin = exifDataView.getUint32(valOffset + 8, isLittleEndian) / exifDataView.getUint32(valOffset + 12, isLittleEndian);
          lonSec = exifDataView.getUint32(valOffset + 16, isLittleEndian) / exifDataView.getUint32(valOffset + 20, isLittleEndian);
        }
        nextOffset += 12;
      }

      const decimalLat = (latDeg + latMin / 60 + latSec / 3600) * (latRef === 'S' ? -1 : 1);
      const decimalLon = (lonDeg + lonMin / 60 + lonSec / 3600) * (lonRef === 'W' ? -1 : 1);

      if (decimalLat && decimalLon) {
        tags.gps = `${decimalLat.toFixed(6)}, ${decimalLon.toFixed(6)}`;
        tags.gpsDms = `${latDeg}°${latMin}'${latSec.toFixed(1)}"${latRef}, ${lonDeg}°${lonMin}'${lonSec.toFixed(1)}"${lonRef}`;
      }
    };

    parseIfd(firstIfdOffset);
    return tags;
  };

  const handleStripAndDownload = () => {
    if (!file) return;
    setIsStripping(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const strippedBuffer = stripExifBinary(buffer);
        const strippedBlob = new Blob([strippedBuffer], { type: file.type });
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        saveAs(strippedBlob, `${nameWithoutExt}_no_gps.jpg`);
        saveHistory('EXIF Stripper', `${file.name} (Metadata Erased)`);
        setIsStripping(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to strip metadata. Make sure the file is a valid JPG/JPEG.');
        setIsStripping(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Lossless binary stripper
  const stripExifBinary = (arrayBuffer) => {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0, false) !== 0xFFD8) {
      throw new Error('Not a valid JPEG image');
    }

    let offset = 2;
    const length = view.byteLength;
    const segments = [];
    
    // SOI
    segments.push(new Uint8Array(arrayBuffer, 0, 2));

    while (offset < length) {
      if (offset + 4 > length) {
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }
      
      const marker = view.getUint16(offset, false);
      if (marker === 0xFFD9) {
        // EOI
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }

      if ((marker & 0xFF00) !== 0xFF00) {
        // Not a marker, advance
        offset++;
        continue;
      }

      const segmentLength = view.getUint16(offset + 2, false) + 2;
      if (offset + segmentLength > length) {
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }

      // Skip APP1 EXIF segment (0xFFE1)
      if (marker === 0xFFE1) {
        // We skip it
      } else {
        segments.push(new Uint8Array(arrayBuffer, offset, segmentLength));
      }
      offset += segmentLength;
    }

    // Merge segments
    let totalSize = 0;
    segments.forEach(s => totalSize += s.byteLength);
    const result = new Uint8Array(totalSize);
    let currentOffset = 0;
    segments.forEach(s => {
      result.set(s, currentOffset);
      currentOffset += s.byteLength;
    });

    return result.buffer;
  };

  const formatSize = (b) => {
    if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + ' MB';
    return (b / 1024).toFixed(1) + ' KB';
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
      title="EXIF Metadata Stripper & Viewer"
      subtitle="View hidden camera details and GPS locations embedded in your photos, then losslessly strip them to protect your privacy online."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Strip EXIF metadata from JPG and JPEG photos online for free. Read device model, date, software and GPS location details inside your browser. Local-first, 100% private."
    >
      {!file ? (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <UploadBox
            onFileSelect={handleFileSelect}
            acceptedFormats={['.jpg', '.jpeg']}
            multiple={false}
            buttonLabel="Select JPEG Image"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
          
          {/* Left: Metadata details */}
          <div className="lg:col-span-7" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F1F7', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111128', margin: 0 }}>File Information</h3>
                <p style={{ fontSize: 11, color: '#9898B5', margin: '2px 0 0', fontWeight: 600 }}>{file.name} ({formatSize(file.size)})</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FDF2F2', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
              >
                Clear File
              </button>
            </div>

            {/* Metadata tags */}
            {metadata ? (
              metadata.hasExif ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Embedded EXIF Tags</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    
                    {metadata.make && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Manufacturer</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.make}</span>
                      </div>
                    )}
                    {metadata.model && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Camera Model</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.model}</span>
                      </div>
                    )}
                    {metadata.dateTime && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Date / Time Created</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.dateTime}</span>
                      </div>
                    )}
                    {metadata.software && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Editing Software</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.software}</span>
                      </div>
                    )}
                    {metadata.exposureTime && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Shutter Speed</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.exposureTime}</span>
                      </div>
                    )}
                    {metadata.fNumber && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Aperture</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.fNumber}</span>
                      </div>
                    )}
                    {metadata.iso && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>ISO Speed</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>ISO {metadata.iso}</span>
                      </div>
                    )}
                    {metadata.focalLength && (
                      <div style={{ padding: 12, background: '#F7F7FB', borderRadius: 10, border: '1px solid #E4E4EF' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#9898B5', display: 'block', textTransform: 'uppercase' }}>Focal Length</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111128' }}>{metadata.focalLength}</span>
                      </div>
                    )}
                  </div>

                  {metadata.gps ? (
                    <div style={{ padding: 14, background: '#FFFDF5', borderRadius: 12, border: '1px solid #FBE090', marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', marginTop: 2 }}>
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </span>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 850, color: '#B45309', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GPS Location Pin (Sensitive)</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#78350F' }}>{metadata.gpsDms}</span>
                          <p style={{ fontSize: 11, color: '#92400E', margin: '4px 0 0', lineHeight: 1.5 }}>
                            Coordinates: <code>{metadata.gps}</code>. Map details are currently stored inside your file header.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0', marginTop: 10, fontSize: 12, fontWeight: 600, color: '#16A34A', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      No GPS location coordinates detected in this file header.
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: '32px 10px', textAlign: 'center', color: '#9898B5' }}>
                  <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>This JPEG contains no readable EXIF metadata tags.</p>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9898B5', fontSize: 13 }}>
                Parsing binary structures...
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: 12, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#EF4444', marginTop: 16 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111128', margin: '0 0 10px' }}>Clean Metadata</h3>
              <p style={{ fontSize: 12, color: '#6B6B8A', lineHeight: 1.6, margin: '0 0 20px' }}>
                Click the button below to completely erase camera profiles, timestamps, GPS headers, and editing software logs from this photo.
              </p>

              <button
                type="button"
                disabled={isStripping}
                onClick={handleStripAndDownload}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)',
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
                  boxShadow: '0 4px 16px rgba(91,91,214,0.3)',
                  transition: 'all 0.18s'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(91,91,214,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,91,214,0.3)'; e.currentTarget.style.transform = 'none'; }}
              >
                {isStripping ? 'Erasing EXIF data...' : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M19 7l-.8 12.6c-.1 1.3-1.2 2.4-2.5 2.4H8.3c-1.3 0-2.4-1.1-2.5-2.4L5 7m5-3V1h4v3M4 7h16" />
                    </svg>
                    Download Clean Photo
                  </>
                )}
              </button>
            </div>

            {/* Quick Preview Thumbnail */}
            {file && (
              <div style={{ ...cardStyle, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Original Thumbnail</span>
                <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid #E4E4EF' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    style={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', display: 'block', background: 'repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
                    onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </ToolPageShell>
  );
}
