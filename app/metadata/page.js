"use client";

import React, { useState } from 'react';
import ToolPageShell from '@/components/ToolPageShell';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';

// Comprehensive EXIF Tag Names Dictionary
const TAG_NAMES = {
  // TIFF tags
  0x010E: { name: 'ImageTitle', desc: 'Image title / description' },
  0x010F: { name: 'Make', desc: 'Camera manufacturer' },
  0x0110: { name: 'Model', desc: 'Camera model' },
  0x0112: { name: 'Orientation', desc: 'Image orientation' },
  0x011A: { name: 'XResolution', desc: 'Horizontal resolution' },
  0x011B: { name: 'YResolution', desc: 'Vertical resolution' },
  0x0128: { name: 'ResolutionUnit', desc: 'Resolution unit' },
  0x0131: { name: 'Software', desc: 'Software / firmware name' },
  0x0132: { name: 'DateTime', desc: 'File change date and time' },
  0x013B: { name: 'Artist', desc: 'Person who created the image' },
  0x013C: { name: 'HostComputer', desc: 'Computer/device host' },
  0x0213: { name: 'YCbCrPositioning', desc: 'YCbCr positioning' },
  0x8298: { name: 'Copyright', desc: 'Copyright holder' },
  
  // EXIF private tags
  0x829A: { name: 'ExposureTime', desc: 'Exposure time (shutter speed)' },
  0x829D: { name: 'FNumber', desc: 'F-number (aperture)' },
  0x8822: { name: 'ExposureProgram', desc: 'Exposure program class' },
  0x8827: { name: 'ISOSpeedRatings', desc: 'ISO speed rating' },
  0x9000: { name: 'ExifVersion', desc: 'Supported EXIF version' },
  0x9003: { name: 'DateTimeOriginal', desc: 'Date and time of original data generation' },
  0x9004: { name: 'DateTimeDigitized', desc: 'Date and time of digital data generation' },
  0x9201: { name: 'ShutterSpeedValue', desc: 'Shutter speed value in APEX units' },
  0x9202: { name: 'ApertureValue', desc: 'Aperture value in APEX units' },
  0x9203: { name: 'BrightnessValue', desc: 'Brightness value' },
  0x9204: { name: 'ExposureBiasValue', desc: 'Exposure bias (compensation)' },
  0x9205: { name: 'MaxApertureValue', desc: 'Maximum lens aperture' },
  0x9206: { name: 'SubjectDistance', desc: 'Distance to subject (meters)' },
  0x9207: { name: 'MeteringMode', desc: 'Exposure metering mode' },
  0x9208: { name: 'LightSource', desc: 'Light source / white balance setting' },
  0x9209: { name: 'Flash', desc: 'Flash status and energy' },
  0x920A: { name: 'FocalLength', desc: 'Lens focal length' },
  0x9286: { name: 'UserComment', desc: 'User comments or annotations' },
  0xA000: { name: 'FlashpixVersion', desc: 'Supported Flashpix version' },
  0xA001: { name: 'ColorSpace', desc: 'Color space information' },
  0xA002: { name: 'PixelXDimension', desc: 'Valid image width' },
  0xA003: { name: 'PixelYDimension', desc: 'Valid image height' },
  0xA20E: { name: 'FocalPlaneXResolution', desc: 'Focal plane X-resolution' },
  0xA20F: { name: 'FocalPlaneYResolution', desc: 'Focal plane Y-resolution' },
  0xA210: { name: 'FocalPlaneResolutionUnit', desc: 'Focal plane resolution unit' },
  0xA401: { name: 'CustomRendered', desc: 'Custom image processing' },
  0xA402: { name: 'ExposureMode', desc: 'Exposure mode setting' },
  0xA403: { name: 'WhiteBalance', desc: 'White balance setting (auto/manual)' },
  0xA404: { name: 'DigitalZoomRatio', desc: 'Digital zoom ratio' },
  0xA405: { name: 'FocalLengthIn35mmFilm', desc: 'Equivalent 35mm focal length' },
  0xA406: { name: 'SceneCaptureType', desc: 'Scene capture type' },
  0xA408: { name: 'Contrast', desc: 'Contrast adjustment level' },
  0xA409: { name: 'Saturation', desc: 'Saturation adjustment level' },
  0xA40A: { name: 'Sharpness', desc: 'Sharpness adjustment level' },
  0xA40C: { name: 'SubjectDistanceRange', desc: 'Subject distance range' },
  0xA431: { name: 'BodySerialNumber', desc: 'Camera body serial number' },
  0xA432: { name: 'LensSpecification', desc: 'Lens bounds & specifications' },
  0xA433: { name: 'LensMake', desc: 'Lens manufacturer' },
  0xA434: { name: 'LensModel', desc: 'Lens model' },
  0xA435: { name: 'LensSerialNumber', desc: 'Lens serial number' },

  // GPS tags
  0x0000: { name: 'GPSVersionID', desc: 'GPS tag version' },
  0x0001: { name: 'GPSLatitudeRef', desc: 'North or South Latitude' },
  0x0002: { name: 'GPSLatitude', desc: 'Latitude coordinate value' },
  0x0003: { name: 'GPSLongitudeRef', desc: 'East or West Longitude' },
  0x0004: { name: 'GPSLongitude', desc: 'Longitude coordinate value' },
  0x0005: { name: 'GPSAltitudeRef', desc: 'Altitude reference (above/below sea level)' },
  0x0006: { name: 'GPSAltitude', desc: 'Altitude coordinate value' },
  0x0007: { name: 'GPSTimeStamp', desc: 'GPS time (atomic clock)' },
  0x0008: { name: 'GPSSatellites', desc: 'GPS satellites used' },
  0x0009: { name: 'GPSStatus', desc: 'Receiver status' },
  0x000A: { name: 'GPSMeasureMode', desc: 'GPS measurement mode' },
  0x000B: { name: 'GPSDOP', desc: 'Measurement precision (DOP)' },
  0x000C: { name: 'GPSSpeedRef', desc: 'Speed measurement unit' },
  0x000D: { name: 'GPSSpeed', desc: 'Speed of GPS receiver' },
  0x000E: { name: 'GPSTrackRef', desc: 'Direction of movement reference' },
  0x000F: { name: 'GPSTrack', desc: 'Direction of movement' },
  0x0010: { name: 'GPSImgDirectionRef', desc: 'Image direction reference' },
  0x0011: { name: 'GPSImgDirection', desc: 'Direction of image' },
  0x0012: { name: 'GPSMapDatum', desc: 'Geodetic survey data used' },
  0x001D: { name: 'GPSDateStamp', desc: 'GPS date stamp' }
};

const getTypeSize = (type) => {
  switch (type) {
    case 1: // BYTE
    case 2: // ASCII
    case 7: // UNDEFINED
      return 1;
    case 3: // SHORT
      return 2;
    case 4: // LONG
    case 9: // SLONG
      return 4;
    case 5: // RATIONAL
    case 10: // SRATIONAL
      return 8;
    default:
      return 1;
  }
};

const formatTagValue = (tag, val) => {
  if (val === null || val === undefined) return '—';
  
  if (Array.isArray(val)) {
    return val.map(v => typeof v === 'number' ? parseFloat(v.toFixed(4)) : v).join(', ');
  }
  
  if (typeof val === 'number') {
    if (tag === 0x0112) { // Orientation
      const orientations = {
        1: "Top-left (Normal)",
        2: "Top-right (Mirror H)",
        3: "Bottom-right (Rotate 180°)",
        4: "Bottom-left (Mirror V)",
        5: "Left-top (Mirror H + Rotate 270°)",
        6: "Right-top (Rotate 90°)",
        7: "Right-bottom (Mirror H + Rotate 90°)",
        8: "Left-bottom (Rotate 270°)"
      };
      return orientations[val] || `Unknown (${val})`;
    }
    if (tag === 0x9207) { // MeteringMode
      const modes = {
        0: "Unknown", 1: "Average", 2: "Center-weighted average",
        3: "Spot", 4: "Multi-spot", 5: "Pattern", 6: "Partial", 255: "Other"
      };
      return modes[val] || `Unknown (${val})`;
    }
    if (tag === 0x8822) { // ExposureProgram
      const programs = {
        0: "Not defined", 1: "Manual", 2: "Normal program",
        3: "Aperture priority", 4: "Shutter priority", 5: "Creative program",
        6: "Action program", 7: "Portrait mode", 8: "Landscape mode"
      };
      return programs[val] || `Unknown (${val})`;
    }
    if (tag === 0xA403) { // WhiteBalance
      return val === 0 ? "Auto" : val === 1 ? "Manual" : `Unknown (${val})`;
    }
    if (tag === 0x829D) { // FNumber
      return `f/${parseFloat(val.toFixed(2))}`;
    }
    if (tag === 0x829A) { // ExposureTime
      return val < 1 ? `1/${Math.round(1 / val)}s` : `${parseFloat(val.toFixed(2))}s`;
    }
    if (tag === 0x920A) { // FocalLength
      return `${parseFloat(val.toFixed(2))} mm`;
    }
    return parseFloat(val.toFixed(4));
  }
  
  return String(val);
};

const readTagValue = (exifDataView, nextOffset, valOffset, type, count, isLittleEndian) => {
  const typeSize = getTypeSize(type);
  const size = typeSize * count;
  const ptr = size <= 4 ? (nextOffset + 8) : valOffset;

  if (ptr + size > exifDataView.byteLength) {
    return null;
  }

  const vals = [];
  for (let j = 0; j < count; j++) {
    const itemPtr = ptr + j * typeSize;
    if (type === 1) { // BYTE
      vals.push(exifDataView.getUint8(itemPtr));
    } else if (type === 2) { // ASCII
      vals.push(exifDataView.getUint8(itemPtr));
    } else if (type === 3) { // SHORT
      vals.push(exifDataView.getUint16(itemPtr, isLittleEndian));
    } else if (type === 4) { // LONG
      vals.push(exifDataView.getUint32(itemPtr, isLittleEndian));
    } else if (type === 5) { // RATIONAL
      const num = exifDataView.getUint32(itemPtr, isLittleEndian);
      const den = exifDataView.getUint32(itemPtr + 4, isLittleEndian);
      vals.push(den === 0 ? 0 : num / den);
    } else if (type === 7) { // UNDEFINED
      vals.push(exifDataView.getUint8(itemPtr));
    } else if (type === 9) { // SLONG
      vals.push(exifDataView.getInt32(itemPtr, isLittleEndian));
    } else if (type === 10) { // SRATIONAL
      const num = exifDataView.getInt32(itemPtr, isLittleEndian);
      const den = exifDataView.getInt32(itemPtr + 4, isLittleEndian);
      vals.push(den === 0 ? 0 : num / den);
    }
  }

  if (type === 2) {
    let str = '';
    for (let j = 0; j < vals.length; j++) {
      if (vals[j] === 0) break;
      str += String.fromCharCode(vals[j]);
    }
    return str.trim();
  }

  if (type === 7) {
    let looksLikeAscii = true;
    let str = '';
    for (let j = 0; j < Math.min(vals.length, 32); j++) {
      const c = vals[j];
      if (c !== 0 && (c < 32 || c > 126)) {
        looksLikeAscii = false;
        break;
      }
      if (c !== 0) str += String.fromCharCode(c);
    }
    if (looksLikeAscii && str.length > 3) {
      return str.trim();
    }
    return `[Binary Data: ${count} bytes]`;
  }

  if (vals.length === 1) return vals[0];
  return vals;
};

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
      title: '100% Private & Local',
      desc: 'All metadata parsing and binary cleaning happens locally in your browser. Your photos never touch any server.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      title: 'Lossless Metadata Cleaning',
      desc: 'Strips descriptors directly from the file header stream. Zero re-compression, preserving 100% pixel quality.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Comprehensive Tag Viewer',
      desc: 'Decodes all standard TIFF, camera EXIF, and GPS pointers, showing you exactly what information is embedded.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      title: 'Protects Sensitive Locations',
      desc: 'Completely erases high-accuracy GPS coordinates, preventing others from discovering where your photo was taken.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2.2"/>
          <path d="M7 8h10M7 12h10M7 16h10" />
        </svg>
      ),
      title: 'Erases All Custom Headers',
      desc: 'Removes EXIF camera logs, XMP software editing records, IPTC copyright fields, and COM user comments at once.'
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path d="M12 3v18M3 12h18M12 3l9 9-9 9-9-9 9-9z"/>
        </svg>
      ),
      title: 'ICC Profile Safeguard',
      desc: 'Retains color management profiles (ICC Profiles) so that stripped photos display color tones and shades perfectly.'
    }
  ];

  const _STEPS = [
    { n: '1', title: 'Upload Photo', desc: 'Select a JPEG or JPG photo containing metadata.' },
    { n: '2', title: 'View All Metadata', desc: 'Read the extracted device details, GPS locations, and editing software logs.' },
    { n: '3', title: 'Download Cleaned Copy', desc: 'Save the image with all EXIF, GPS, XMP, IPTC, and comment data erased.' }
  ];

  const _FAQS = [
    { q: 'What metadata streams are stored inside photos?', a: 'Exchangeable Image File Format (EXIF) lists camera settings and GPS. Extensible Metadata Platform (XMP) holds editor histories and cataloging. IPTC stores copyrights and captions. COM is plain-text comments.' },
    { q: 'Does stripping metadata reduce image quality?', a: 'No. Our utility operates directly on the JPEG file segments, removing headers like APP1 and APP13 without touching or re-compressing the actual image bytes. Quality remains 100% identical.' },
    { q: 'Why should I strip metadata before sharing?', a: 'Photos shot on smartphones default to storing highly precise GPS coordinates, serial numbers, camera specifications, and software versions. Sharing these online exposes your private details.' },
    { q: 'Is my data secure on Image Pine?', a: 'Absolutely. All processing occurs locally inside your browser tab using JavaScript APIs. No data is uploaded or transmitted to any server.' }
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
        setErrorMsg('Failed to parse metadata segments. Make sure the file is a valid JPEG.');
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  // Binary EXIF and metadata scanner
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

    const detectedSegments = {
      exif: false,
      xmp: false,
      iptc: false,
      comments: false,
      icc: false,
      otherApp: []
    };

    while (offset < length - 2) {
      const marker = view.getUint16(offset, false);
      if ((marker & 0xFF00) === 0xFF00) {
        if (marker === 0xFFDA) { // SOS - Pixel data start
          break;
        }
        const segmentLength = view.getUint16(offset + 2, false);
        
        if (marker === 0xFFE1) {
          // APP1: EXIF or XMP
          if (offset + 10 < length) {
            const header = view.getUint32(offset + 4, false);
            if (header === 0x45786966) { // "Exif"
              detectedSegments.exif = true;
              const exifStart = offset + 10;
              exifDataView = new DataView(buffer, exifStart, segmentLength - 8);
            } else {
              // Check if XMP
              let isXmp = true;
              const xmpString = "http://ns.adobe.com/xap/1.0/";
              for (let j = 0; j < 20; j++) {
                if (view.getUint8(offset + 4 + j) !== xmpString.charCodeAt(j)) {
                  isXmp = false;
                  break;
                }
              }
              if (isXmp) {
                detectedSegments.xmp = true;
              }
            }
          }
        } else if (marker === 0xFFED) {
          detectedSegments.iptc = true; // IPTC / Photoshop IRB
        } else if (marker === 0xFFFE) {
          detectedSegments.comments = true; // Comment
        } else if (marker === 0xFFE2) {
          detectedSegments.icc = true; // ICC Profile
        } else if (marker >= 0xFFE3 && marker <= 0xFFEF) {
          detectedSegments.otherApp.push(`APP${marker - 0xFFE0}`);
        }
        
        offset += 2 + segmentLength;
      } else {
        offset++;
      }
    }

    const tags = {
      hasExif: false,
      detectedSegments,
      allTags: []
    };

    if (exifDataView) {
      // TIFF Header
      const tiffHeader = exifDataView.getUint16(0, false);
      if (tiffHeader === 0x4949) {
        isLittleEndian = true;
      } else if (tiffHeader === 0x4D4D) {
        isLittleEndian = false;
      } else {
        return tags; // Unrecognized TIFF header
      }

      if (exifDataView.getUint16(2, isLittleEndian) !== 0x002A) {
        return tags;
      }

      const firstIfdOffset = exifDataView.getUint32(4, isLittleEndian);
      tags.hasExif = true;

      const parsedOffsets = new Set();

      const parseIfd = (ifdOffset, group = 'Image') => {
        if (ifdOffset >= exifDataView.byteLength || parsedOffsets.has(ifdOffset)) return;
        parsedOffsets.add(ifdOffset);
        
        const numEntries = exifDataView.getUint16(ifdOffset, isLittleEndian);
        let nextOffset = ifdOffset + 2;

        for (let i = 0; i < numEntries; i++) {
          if (nextOffset + 12 > exifDataView.byteLength) break;
          const tag = exifDataView.getUint16(nextOffset, isLittleEndian);
          const type = exifDataView.getUint16(nextOffset + 2, isLittleEndian);
          const count = exifDataView.getUint32(nextOffset + 4, isLittleEndian);
          const valOffset = exifDataView.getUint32(nextOffset + 8, isLittleEndian);

          const value = readTagValue(exifDataView, nextOffset, valOffset, type, count, isLittleEndian);
          
          if (value !== null && value !== undefined) {
            if (tag === 0x8825) { // GPS Info IFD Pointer
              parseIfd(valOffset, 'GPS');
            } else if (tag === 0x8769) { // Exif SubIFD Pointer
              parseIfd(valOffset, 'Camera');
            } else {
              const info = TAG_NAMES[tag] || { name: `Tag_0x${tag.toString(16).toUpperCase()}`, desc: 'Vendor specific field' };
              const formatted = formatTagValue(tag, value);
              
              tags.allTags.push({
                tag,
                hex: `0x${tag.toString(16).toUpperCase().padStart(4, '0')}`,
                group,
                name: info.name,
                desc: info.desc,
                raw: value,
                formatted
              });

              // Extract key tags for top summary boxes
              if (tag === 0x010F) tags.make = value;
              else if (tag === 0x0110) tags.model = value;
              else if (tag === 0x0132) tags.dateTime = value;
              else if (tag === 0x013B) tags.artist = value;
              else if (tag === 0x010E) tags.description = value;
              else if (tag === 0x0131) tags.software = value;
              else if (tag === 0x829D) tags.fNumber = formatted;
              else if (tag === 0x829A) tags.exposureTime = formatted;
              else if (tag === 0x8827) tags.iso = value;
              else if (tag === 0x920A) tags.focalLength = formatted;
            }
          }
          nextOffset += 12;
        }
      };

      parseIfd(firstIfdOffset);

      // Post-process GPS coords from parsed tags
      const latTag = tags.allTags.find(t => t.tag === 0x0002);
      const latRefTag = tags.allTags.find(t => t.tag === 0x0001);
      const lonTag = tags.allTags.find(t => t.tag === 0x0004);
      const lonRefTag = tags.allTags.find(t => t.tag === 0x0003);

      if (latTag && latRefTag && lonTag && lonRefTag) {
        const latVals = latTag.raw;
        const latRef = latRefTag.raw;
        const lonVals = lonTag.raw;
        const lonRef = lonRefTag.raw;

        if (Array.isArray(latVals) && latVals.length === 3 && Array.isArray(lonVals) && lonVals.length === 3) {
          const latDeg = latVals[0], latMin = latVals[1], latSec = latVals[2];
          const lonDeg = lonVals[0], lonMin = lonVals[1], lonSec = lonVals[2];

          const decimalLat = (latDeg + latMin / 60 + latSec / 3600) * (latRef === 'S' ? -1 : 1);
          const decimalLon = (lonDeg + lonMin / 60 + lonSec / 3600) * (lonRef === 'W' ? -1 : 1);

          tags.gps = `${decimalLat.toFixed(6)}, ${decimalLon.toFixed(6)}`;
          tags.gpsDms = `${latDeg}°${latMin}'${latSec.toFixed(1)}"${latRef}, ${lonDeg}°${lonMin}'${lonSec.toFixed(1)}"${lonRef}`;
        }
      }
    }

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
        saveAs(strippedBlob, `${nameWithoutExt}_cleaned.jpg`);
        saveHistory('EXIF Stripper', `${file.name} (Metadata Erased)`);
        setIsStripping(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to strip metadata. Make sure the file is a valid JPEG/JPG.');
        setIsStripping(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Complete lossless binary stripper for all metadata segments
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

      if (marker === 0xFFDA) { // SOS - Start of Scan (pixel payload)
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }

      if (marker === 0xFFD9) { // EOI - End of Image
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }

      if ((marker & 0xFF00) !== 0xFF00) {
        offset++;
        continue;
      }

      const segmentLength = view.getUint16(offset + 2, false) + 2;
      if (offset + segmentLength > length) {
        segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
        break;
      }

      // Keep:
      // - APP0 (0xFFE0): JFIF segment
      // - APP2 (0xFFE2): ICC Color Profile
      // - APP14 (0xFFEE): Adobe color transform segment
      // Strip everything else:
      // - APP1 (0xFFE1): EXIF and XMP
      // - APP13 (0xFFED): Photoshop IPTC
      // - COM (0xFFFE): User comments
      // - All other non-essential APP segments (APP3 - APP12, APP15)
      const isEssentialApp = marker === 0xFFE0 || marker === 0xFFE2 || marker === 0xFFEE;
      const isAppSegment = marker >= 0xFFE0 && marker <= 0xFFEF;

      if ((isAppSegment && !isEssentialApp) || marker === 0xFFFE) {
        // Skip/Strip this segment
      } else {
        segments.push(new Uint8Array(arrayBuffer, offset, segmentLength));
      }
      
      offset += segmentLength;
    }

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

  const hasDetectedMetadata = metadata && (
    metadata.detectedSegments.exif ||
    metadata.detectedSegments.xmp ||
    metadata.detectedSegments.iptc ||
    metadata.detectedSegments.comments
  );

  return (
    <ToolPageShell
      title="EXIF Metadata Stripper & Viewer"
      subtitle="View hidden camera details and GPS locations embedded in your photos, then losslessly strip them to protect your privacy online."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Strip EXIF metadata, XMP properties, IPTC records and COM comment data from JPG and JPEG photos online for free. Read comprehensive device settings, date, software and GPS location details inside your browser. Local-first, 100% private."
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
          
          {/* Left: Metadata details */}
          <div className="lg:col-span-7" style={{ ...cardStyle, gridColumn: 'span 7' }}>
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

            {/* Detected segments status list */}
            {metadata && (
              <div style={{ marginBottom: 20, background: '#F7F7FB', borderRadius: 12, padding: 14, border: '1px solid #E4E4EF' }}>
                <span style={{ fontSize: 10, fontWeight: 850, color: '#9898B5', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Metadata Streams Detected
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: metadata.detectedSegments.exif ? '#FEE2E2' : '#F0FDF4',
                    borderColor: metadata.detectedSegments.exif ? '#FCA5A5' : '#BBF7D0',
                    color: metadata.detectedSegments.exif ? '#DC2626' : '#16A34A'
                  }}>
                    {metadata.detectedSegments.exif ? '● EXIF Camera/Lens' : '○ No EXIF Segment'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: metadata.gps ? '#FEF3C7' : '#F0FDF4',
                    borderColor: metadata.gps ? '#FCD34D' : '#BBF7D0',
                    color: metadata.gps ? '#D97706' : '#16A34A'
                  }}>
                    {metadata.gps ? '● GPS Coordinates' : '○ No GPS coordinates'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: metadata.detectedSegments.xmp ? '#FEE2E2' : '#F0FDF4',
                    borderColor: metadata.detectedSegments.xmp ? '#FCA5A5' : '#BBF7D0',
                    color: metadata.detectedSegments.xmp ? '#DC2626' : '#16A34A'
                  }}>
                    {metadata.detectedSegments.xmp ? '● XMP Editor History' : '○ No XMP Segment'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: metadata.detectedSegments.iptc ? '#FEE2E2' : '#F0FDF4',
                    borderColor: metadata.detectedSegments.iptc ? '#FCA5A5' : '#BBF7D0',
                    color: metadata.detectedSegments.iptc ? '#DC2626' : '#16A34A'
                  }}>
                    {metadata.detectedSegments.iptc ? '● IPTC Creator/Copyright' : '○ No IPTC Segment'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: metadata.detectedSegments.comments ? '#FEE2E2' : '#F0FDF4',
                    borderColor: metadata.detectedSegments.comments ? '#FCA5A5' : '#BBF7D0',
                    color: metadata.detectedSegments.comments ? '#DC2626' : '#16A34A'
                  }}>
                    {metadata.detectedSegments.comments ? '● COM User Comments' : '○ No COM Comments'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 10px', border: '1px solid',
                    background: '#F0FDF4',
                    borderColor: '#BBF7D0',
                    color: '#16A34A'
                  }}>
                    {metadata.detectedSegments.icc ? '✓ ICC Color Profile (Safe)' : '○ No ICC Color Profile'}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#9898B5', margin: '10px 0 0', lineHeight: 1.45 }}>
                  * EXIF, GPS, XMP, IPTC, and COM streams often contain sensitive identifier logs and will be <strong>100% stripped</strong>. ICC Profiles are preserved to retain correct color balances.
                </p>
              </div>
            )}

            {/* Metadata tags */}
            {metadata ? (
              metadata.hasExif ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Core EXIF Summary</h4>
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
                      No GPS location coordinates detected in this photo.
                    </div>
                  )}

                  {/* Expanded metadata table - Shows ALL tags */}
                  {metadata.allTags && metadata.allTags.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid #F1F1F7', paddingTop: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                        All Extracted TIFF & EXIF Fields ({metadata.allTags.length})
                      </h4>
                      <div style={{ overflowX: 'auto', border: '1px solid #E4E4EF', borderRadius: 12, background: '#F7F7FB', maxHeight: 360, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
                          <thead>
                            <tr style={{ background: '#EDEDFB', borderBottom: '1px solid #E4E4EF', position: 'sticky', top: 0, zIndex: 5 }}>
                              <th style={{ padding: '8px 12px', fontWeight: 800, color: '#5B5BD6', width: '15%' }}>Category</th>
                              <th style={{ padding: '8px 12px', fontWeight: 800, color: '#5B5BD6', width: '30%' }}>Tag / Hex</th>
                              <th style={{ padding: '8px 12px', fontWeight: 800, color: '#5B5BD6', width: '35%' }}>Value</th>
                              <th style={{ padding: '8px 12px', fontWeight: 800, color: '#5B5BD6', width: '20%' }}>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metadata.allTags.map((t, idx) => (
                              <tr key={idx} style={{ borderBottom: idx === metadata.allTags.length - 1 ? 'none' : '1px solid #E4E4EF', background: idx % 2 === 0 ? '#fff' : '#F7F7FB' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#9898B5' }}>{t.group}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#111128', fontWeight: 650 }}>
                                  <span style={{ color: '#5B5BD6' }}>{t.name}</span> <span style={{ fontSize: 9, color: '#9898B5' }}>({t.hex})</span>
                                </td>
                                <td style={{ padding: '8px 12px', color: '#111128', wordBreak: 'break-all' }}>{String(t.formatted)}</td>
                                <td style={{ padding: '8px 12px', color: '#6B6B8A', fontSize: 10 }}>{t.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '32px 10px', textAlign: 'center', color: '#9898B5' }}>
                    <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>This JPEG contains no readable TIFF/EXIF structures.</p>
                  </div>
                  
                  {hasDetectedMetadata && (
                    <div style={{ padding: 12, background: '#FFFDF5', borderRadius: 10, border: '1px solid #FBE090', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                      Note: While no standard EXIF fields could be read, we detected other metadata blocks (like comments or XMP logs) in the image. You can still clean them below.
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9898B5', fontSize: 13 }}>
                Decoding JPEG stream...
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: 12, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#EF4444', marginTop: 16 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 20, gridColumn: 'span 5' }}>
            
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111128', margin: '0 0 10px' }}>Erase All Metadata</h3>
              <p style={{ fontSize: 12, color: '#6B6B8A', lineHeight: 1.6, margin: '0 0 20px' }}>
                Purge EXIF settings, device configurations, GPS geographic pins, XMP histories, copyright tags, and user comments losslessly.
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
                {isStripping ? 'Stripping all metadata...' : (
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
                    src={file.preview || URL.createObjectURL(file)}
                    alt=""
                    style={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', display: 'block', background: 'repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' }}
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
