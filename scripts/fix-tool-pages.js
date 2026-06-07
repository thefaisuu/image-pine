/**
 * fix-tool-pages.js
 * 
 * Properly rewrites all tool sub-pages to use ToolPageShell.
 * Extracts only the workspace JSX and wraps it cleanly.
 * Run: node scripts/fix-tool-pages.js
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');

/* ─── Icon SVG strings ───────────────────────────────────────────────────── */
const icons = {
  resize:    `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
  percent:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M16 8L8 16"/></svg>`,
  lock:      `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  lightning: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  formats:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  free:      `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  compress:  `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
  quality:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  rotate:    `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a10 10 0 1010 10"/><path d="M22 2l-2 4-4-2"/></svg>`,
  preview:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`,
  flip:      `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 3v18"/></svg>`,
  crop:      `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/></svg>`,
  convert:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3l4 4-4 4M16 21l-4-4 4-4"/><path d="M12 7H5a2 2 0 00-2 2v2M12 17h7a2 2 0 002-2v-2"/></svg>`,
  bulk:      `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>`,
  vector:    `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  pdf:       `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  reorder:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  collage:   `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
};

function iconSvg(name) {
  return icons[name] || icons.formats;
}

/* ─── Tool definitions ───────────────────────────────────────────────────── */
const tools = [
  {
    dir: 'resize',
    title: 'Image Resizer',
    subtitle: 'Resize images to exact pixel dimensions or a percentage scale. Lock aspect ratio, set target file size. Free and 100% private.',
    features: [
      { icon: 'resize',    title: 'Pixel-Perfect Resize', desc: 'Set exact width and height with optional aspect-ratio lock.' },
      { icon: 'percent',   title: 'Scale by Percentage',  desc: 'Scale by 50%, 75% or any amount using a simple slider.' },
      { icon: 'lock',      title: 'Privacy Guaranteed',   desc: 'All resizing happens in your browser — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant Processing',   desc: 'Canvas bicubic resampling finishes in milliseconds.' },
      { icon: 'formats',   title: 'Multiple Formats',     desc: 'Export as JPEG, PNG, or WebP with optional target size.' },
      { icon: 'free',      title: 'Completely Free',      desc: 'No watermarks, no registration, no limits.' },
    ],
    steps: [
      { n:'1', title:'Upload',   desc:'Drop your JPEG, PNG, WebP or SVG image.' },
      { n:'2', title:'Set Size', desc:'Enter pixel dimensions or use the percentage slider.' },
      { n:'3', title:'Download', desc:'Click Resize and download your file.' },
    ],
    faqs: [
      { q:'How does the resizer preserve quality?',    a:'Bicubic scaling inside HTML5 Canvas prevents pixelation.' },
      { q:'Can I resize by percentage?',               a:'Yes — toggle to percentage mode and slide from 1% to 200%.' },
      { q:'Are images sent to any server?',            a:'No. All processing is 100% client-side.' },
      { q:'What formats are supported?',               a:'JPEG, PNG, WebP, SVG as input. Export as JPEG, PNG, or WebP.' },
    ],
    seo: 'Resize images online for free. Scale JPG, PNG and WebP to any pixel dimension or percentage using our browser-based resizer. No uploads, complete privacy.',
  },
  {
    dir: 'compress',
    title: 'Image Compressor',
    subtitle: 'Shrink image file sizes without visible quality loss. Set target KB size or adjust quality with a slider. 100% private, browser-based.',
    features: [
      { icon: 'compress',  title: 'Smart Compression',  desc: 'Binary search finds optimal quality to hit your exact target.' },
      { icon: 'quality',   title: 'Quality Control',    desc: 'Slide from 5% to 100% for full quality control.' },
      { icon: 'lock',      title: '100% Private',       desc: 'All compression runs locally — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant Preview',    desc: 'Live preview updates as you adjust settings.' },
      { icon: 'formats',   title: 'JPEG, PNG, WebP',    desc: 'Compress and convert between the most common formats.' },
      { icon: 'free',      title: 'Completely Free',    desc: 'No account, no watermark, no limits.' },
    ],
    steps: [
      { n:'1', title:'Upload',        desc:'Drop your JPEG, PNG or WebP image.' },
      { n:'2', title:'Adjust',        desc:'Set target KB or drag the quality slider.' },
      { n:'3', title:'Download',      desc:'Download your compressed image.' },
    ],
    faqs: [
      { q:'How does compression work?',          a:'Canvas algorithms adjust quality and strip metadata to reduce size.' },
      { q:'Can I set a specific target size?',   a:'Yes — enter KB value and binary search compression hits it exactly.' },
      { q:'What formats are supported?',         a:'JPEG, PNG, and WebP.' },
      { q:'Are my files stored anywhere?',       a:'No. Compression runs entirely in your browser.' },
    ],
    seo: 'Compress images online for free. Reduce JPG, PNG and WebP sizes by up to 80% with adjustable quality. Browser-based, no uploads.',
  },
  {
    dir: 'rotate',
    title: 'Rotate Image',
    subtitle: 'Rotate images by any angle — 90°, 180°, 270° or a custom degree. Free online tool with live preview.',
    features: [
      { icon: 'rotate',    title: 'Any Angle',       desc: 'Rotate by 90°, 180°, 270° or any custom angle ±360°.' },
      { icon: 'preview',   title: 'Live Preview',    desc: 'See your rotation update in real time.' },
      { icon: 'lock',      title: '100% Private',    desc: 'Browser-based rotation — nothing uploaded.' },
      { icon: 'formats',   title: 'All Formats',     desc: 'Rotate JPEG, PNG, WebP, SVG.' },
      { icon: 'free',      title: 'Free Forever',    desc: 'No account, no watermark, unlimited.' },
      { icon: 'lightning', title: 'Instant',         desc: 'Canvas rotation completes in milliseconds.' },
    ],
    steps: [
      { n:'1', title:'Upload',    desc:'Drag & drop or click to select your image.' },
      { n:'2', title:'Set Angle', desc:'Use preset buttons or the slider.' },
      { n:'3', title:'Download',  desc:'Click Apply & Download.' },
    ],
    faqs: [
      { q:'Can I rotate to a custom angle?', a:'Yes — the angle slider goes from -360° to +360°.' },
      { q:'Does rotating reduce quality?',   a:'No. Canvas rotation is lossless.' },
      { q:'Are images uploaded?',            a:'Never. All rotation happens in your browser.' },
    ],
    seo: 'Rotate images online for free. Turn JPEG, PNG and WebP by 90°, 180°, 270° or any custom angle. Browser-based, no uploads.',
  },
  {
    dir: 'flip',
    title: 'Flip Image',
    subtitle: 'Flip any image horizontally or vertically in one click. Live preview, no upload required. Free and 100% private.',
    features: [
      { icon: 'flip',      title: 'Horizontal & Vertical', desc: 'Mirror along either axis or both simultaneously.' },
      { icon: 'preview',   title: 'Live Preview',          desc: 'See the flipped result instantly.' },
      { icon: 'lock',      title: '100% Private',          desc: 'All flipping happens locally.' },
      { icon: 'formats',   title: 'All Formats',           desc: 'Supports JPEG, PNG, WebP, SVG.' },
      { icon: 'free',      title: 'Free Forever',          desc: 'No account, no watermark.' },
      { icon: 'lightning', title: 'Instant',               desc: 'Canvas flip finishes in milliseconds.' },
    ],
    steps: [
      { n:'1', title:'Upload',   desc:'Upload your image.' },
      { n:'2', title:'Flip',     desc:'Click Horizontal or Vertical flip.' },
      { n:'3', title:'Download', desc:'Download your flipped image.' },
    ],
    faqs: [
      { q:'Can I flip both axes?',          a:'Yes — apply both flips simultaneously.' },
      { q:'Does flipping reduce quality?',  a:'No. The Canvas flip transform is lossless.' },
      { q:'Are images uploaded?',           a:'Never. Everything runs in your browser.' },
    ],
    seo: 'Flip images online for free. Mirror JPEG, PNG or WebP horizontally or vertically. Browser-based, no uploads.',
  },
  {
    dir: 'crop',
    title: 'Crop Image',
    subtitle: 'Crop any image to a custom rectangle or preset aspect ratio. Free online tool, no upload required.',
    features: [
      { icon: 'crop',    title: 'Freeform Crop',     desc: 'Drag to select any region to crop.' },
      { icon: 'formats', title: 'Aspect Ratios',     desc: 'Crop to 1:1, 16:9, 4:3 and more.' },
      { icon: 'lock',    title: '100% Private',      desc: 'Crops happen entirely in your browser.' },
      { icon: 'formats', title: 'All Formats',       desc: 'Supports JPEG, PNG, WebP, SVG.' },
      { icon: 'preview', title: 'Live Preview',      desc: 'Preview the crop in real time.' },
      { icon: 'free',    title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload',      desc:'Select or drag & drop your image.' },
      { n:'2', title:'Select Crop', desc:'Drag to select the region to keep.' },
      { n:'3', title:'Download',    desc:'Click Crop & Download.' },
    ],
    faqs: [
      { q:'Can I crop to a specific aspect ratio?', a:'Yes — choose from presets or enter custom dimensions.' },
      { q:'Does cropping affect quality?',          a:'No. The original resolution is preserved.' },
      { q:'Are files uploaded?',                    a:'No. Everything runs locally.' },
    ],
    seo: 'Crop images online for free. Trim JPEG, PNG and WebP to any region or aspect ratio. Browser-based, no uploads.',
  },
  {
    dir: 'bulk-resize',
    title: 'Bulk Image Resizer',
    subtitle: 'Resize multiple images to the same dimensions in one go. Up to 50 images, instant browser processing.',
    features: [
      { icon: 'bulk',      title: 'Batch Processing', desc: 'Resize up to 50 images simultaneously.' },
      { icon: 'resize',    title: 'Exact Dimensions', desc: 'Set precise width and height with aspect-ratio lock.' },
      { icon: 'lock',      title: '100% Private',     desc: 'All images processed locally.' },
      { icon: 'lightning', title: 'Fast',             desc: 'Canvas-based parallel processing in seconds.' },
      { icon: 'formats',   title: 'Multiple Formats', desc: 'Resize JPEG, PNG, WebP.' },
      { icon: 'free',      title: 'Free Forever',     desc: 'No registration, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload Images', desc:'Drag & drop or select multiple images at once.' },
      { n:'2', title:'Set Dimensions', desc:'Enter the target width and height.' },
      { n:'3', title:'Download All',   desc:'Download each resized image.' },
    ],
    faqs: [
      { q:'How many images at once?',        a:'Up to 50 images per batch.' },
      { q:'Same size for all?',              a:'Yes — one target dimension applied to all.' },
      { q:'Are images uploaded?',            a:'No. Everything runs in your browser.' },
    ],
    seo: 'Bulk resize multiple images at once for free. Upload up to 50 JPEG, PNG or WebP files and resize to the same dimensions. Browser-based, no uploads.',
  },
  {
    dir: 'image-converter',
    title: 'Image Converter',
    subtitle: 'Convert images between JPEG, PNG, WebP, GIF and SVG formats instantly. Free, private, browser-based.',
    features: [
      { icon: 'convert',   title: 'All Formats',     desc: 'Convert between JPEG, PNG, WebP, GIF and SVG.' },
      { icon: 'quality',   title: 'Quality Control', desc: 'Set output quality for lossy formats.' },
      { icon: 'lock',      title: '100% Private',    desc: 'Conversions run locally — no uploads.' },
      { icon: 'lightning', title: 'Instant',         desc: 'Canvas-based conversion in milliseconds.' },
      { icon: 'bulk',      title: 'Batch Convert',   desc: 'Convert multiple images in one operation.' },
      { icon: 'free',      title: 'Free Forever',    desc: 'No watermarks, no account.' },
    ],
    steps: [
      { n:'1', title:'Upload',         desc:'Select the image(s) to convert.' },
      { n:'2', title:'Choose Format',  desc:'Pick JPEG, PNG, WebP, etc.' },
      { n:'3', title:'Download',       desc:'Download converted file(s).' },
    ],
    faqs: [
      { q:'What formats can I convert between?', a:'JPEG, PNG, WebP, GIF and SVG.' },
      { q:'Does conversion reduce quality?',     a:'Lossless for PNG; adjustable for JPEG/WebP.' },
      { q:'Are files uploaded?',                 a:'No. All conversion is browser-based.' },
    ],
    seo: 'Convert images between formats online for free. Transform JPEG to PNG, PNG to WebP and more in your browser. No uploads, instant.',
  },
  {
    dir: 'jpg-to-png',
    title: 'JPG to PNG Converter',
    subtitle: 'Convert JPEG images to lossless PNG format with transparency support. Free, instant, browser-based.',
    features: [
      { icon: 'convert',   title: 'Lossless PNG',    desc: 'Convert JPEG to PNG with transparency support.' },
      { icon: 'lock',      title: '100% Private',    desc: 'Conversion in your browser — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant',         desc: 'Canvas API converts in milliseconds.' },
      { icon: 'bulk',      title: 'Batch Convert',   desc: 'Convert multiple JPGs simultaneously.' },
      { icon: 'free',      title: 'Free Forever',    desc: 'No account, no watermark.' },
      { icon: 'formats',   title: 'Any JPEG',        desc: 'Supports .jpg and .jpeg up to 15 MB.' },
    ],
    steps: [
      { n:'1', title:'Upload JPG',   desc:'Select or drag your JPEG/JPG.' },
      { n:'2', title:'Convert',      desc:'Auto-converts to PNG.' },
      { n:'3', title:'Download PNG', desc:'Save your PNG file.' },
    ],
    faqs: [
      { q:'Will converting improve quality?', a:'PNG prevents further lossy compression but cannot recover lost JPEG detail.' },
      { q:'Are files uploaded?',              a:'No. Conversion is 100% local.' },
    ],
    seo: 'Convert JPG to PNG online for free. Transform JPEG to lossless PNG with transparency support in your browser. No uploads.',
  },
  {
    dir: 'png-to-jpg',
    title: 'PNG to JPG Converter',
    subtitle: 'Convert PNG images to JPEG format to reduce file size. Free, browser-based, no upload required.',
    features: [
      { icon: 'convert',   title: 'Smaller File Size', desc: 'JPEG gives dramatically smaller files than PNG for photos.' },
      { icon: 'quality',   title: 'Quality Control',   desc: 'Set JPEG quality from 5% to 100%.' },
      { icon: 'lock',      title: '100% Private',      desc: 'Runs entirely in your browser.' },
      { icon: 'lightning', title: 'Instant',           desc: 'Canvas conversion in milliseconds.' },
      { icon: 'bulk',      title: 'Batch Convert',     desc: 'Convert multiple PNGs in one session.' },
      { icon: 'free',      title: 'Free Forever',      desc: 'No registration, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNG',   desc:'Select or drag your PNG.' },
      { n:'2', title:'Set Quality',  desc:'Adjust JPEG quality.' },
      { n:'3', title:'Download JPG', desc:'Save your JPEG file.' },
    ],
    faqs: [
      { q:'Is transparency preserved?', a:'No — JPEG does not support transparency. Transparent areas become white.' },
      { q:'How small will the output be?', a:'JPEG at 80% is typically 60-80% smaller than the same PNG.' },
      { q:'Are files uploaded?',           a:'No. All conversion is local.' },
    ],
    seo: 'Convert PNG to JPG online for free. Transform PNG to smaller JPEG with adjustable quality. Browser-based, no uploads.',
  },
  {
    dir: 'webp-to-jpg',
    title: 'WebP to JPG Converter',
    subtitle: 'Convert WebP images to JPEG for maximum compatibility. Free, browser-based, no upload required.',
    features: [
      { icon: 'convert',   title: 'Universal JPEG',   desc: 'JPEG works everywhere — email, social, websites.' },
      { icon: 'quality',   title: 'Quality Control',  desc: 'Adjust output JPEG quality from 5% to 100%.' },
      { icon: 'lock',      title: '100% Private',     desc: 'Runs locally — no uploads ever.' },
      { icon: 'lightning', title: 'Instant',          desc: 'Conversion finishes in milliseconds.' },
      { icon: 'bulk',      title: 'Batch Convert',    desc: 'Convert multiple WebP files at once.' },
      { icon: 'free',      title: 'Free Forever',     desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload WebP',  desc:'Select your WebP image file.' },
      { n:'2', title:'Convert',      desc:'Converts to JPEG instantly.' },
      { n:'3', title:'Download JPG', desc:'Save your compatible JPEG.' },
    ],
    faqs: [
      { q:'Why convert WebP to JPG?',  a:'JPEG has wider compatibility with older software and email clients.' },
      { q:'Are files uploaded?',       a:'No. Everything runs in your browser.' },
    ],
    seo: 'Convert WebP to JPG online for free. Transform WebP to universally compatible JPEG in your browser. No uploads.',
  },
  {
    dir: 'webp-to-png',
    title: 'WebP to PNG Converter',
    subtitle: 'Convert WebP images to lossless PNG format with transparency support. Free, browser-based.',
    features: [
      { icon: 'convert', title: 'Lossless PNG',       desc: 'PNG preserves all detail and supports transparency.' },
      { icon: 'lock',    title: '100% Private',       desc: 'Conversion in your browser — nothing uploaded.' },
      { icon: 'lightning',title:'Instant',            desc: 'Canvas conversion in milliseconds.' },
      { icon: 'bulk',    title: 'Batch Convert',      desc: 'Convert multiple WebP files to PNG.' },
      { icon: 'free',    title: 'Free Forever',       desc: 'No account, no watermark.' },
      { icon: 'formats', title: 'Full Transparency',  desc: 'WebP alpha maps to PNG alpha channel.' },
    ],
    steps: [
      { n:'1', title:'Upload WebP',  desc:'Select your WebP file.' },
      { n:'2', title:'Convert',      desc:'Auto-converts to PNG.' },
      { n:'3', title:'Download PNG', desc:'Download your lossless PNG.' },
    ],
    faqs: [
      { q:'Is transparency preserved?', a:'Yes — WebP transparency maps to PNG alpha channel.' },
      { q:'Are files uploaded?',         a:'No. All processing is in-browser.' },
    ],
    seo: 'Convert WebP to PNG online for free. Transform WebP to lossless PNG with transparency in your browser. No uploads.',
  },
  {
    dir: 'png-to-svg',
    title: 'PNG to SVG Converter',
    subtitle: 'Convert raster PNG images to scalable SVG vector format. Free, browser-based.',
    features: [
      { icon: 'vector',  title: 'Scalable Output',   desc: 'SVG scales to any size without pixelation.' },
      { icon: 'lock',    title: '100% Private',      desc: 'Conversion runs in your browser.' },
      { icon: 'lightning',title:'Instant',           desc: 'Get your SVG in seconds.' },
      { icon: 'free',    title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNG',    desc:'Select your PNG image.' },
      { n:'2', title:'Convert',       desc:'Tool traces and generates SVG.' },
      { n:'3', title:'Download SVG',  desc:'Save your scalable SVG.' },
    ],
    faqs: [
      { q:'Will SVG look exactly like PNG?', a:'Simple images like logos convert well. Complex photos may lose detail.' },
      { q:'Are files uploaded?',             a:'No. Everything is browser-based.' },
    ],
    seo: 'Convert PNG to SVG online for free. Transform raster PNG to scalable vector in your browser. No uploads.',
  },
  {
    dir: 'heic-to-jpg',
    title: 'HEIC to JPG Converter',
    subtitle: 'Convert iPhone HEIC/HEIF photos to universally compatible JPEG format. Free, fast, private.',
    features: [
      { icon: 'convert',   title: 'iPhone Compatible', desc: 'Opens HEIC/HEIF files from iPhone, iPad and macOS.' },
      { icon: 'quality',   title: 'Quality Control',   desc: 'Set JPEG quality for perfect size vs clarity.' },
      { icon: 'lock',      title: '100% Private',      desc: 'Your photos never leave your device.' },
      { icon: 'lightning', title: 'Fast',              desc: 'Converts HEIC to JPEG in seconds.' },
      { icon: 'bulk',      title: 'Batch Convert',     desc: 'Convert multiple HEIC photos at once.' },
      { icon: 'free',      title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload HEIC', desc:'Select your HEIC or HEIF photo.' },
      { n:'2', title:'Convert',     desc:'Converts to JPEG automatically.' },
      { n:'3', title:'Download JPG',desc:'Download your JPEG file.' },
    ],
    faqs: [
      { q:'What is HEIC format?', a:'HEIC is Apple\'s default photo format used on iPhone since iOS 11.' },
      { q:'Why convert to JPG?',  a:'JPEG is universally compatible with all devices and apps.' },
      { q:'Are files uploaded?',  a:'No. Conversion runs locally in your browser.' },
    ],
    seo: 'Convert HEIC to JPG online for free. Transform iPhone HEIC photos to JPEG in your browser. No uploads, instant.',
  },
  {
    dir: 'gif-converter',
    title: 'GIF Converter',
    subtitle: 'Convert GIF images to JPEG, PNG or WebP. Or convert images to GIF. Free, browser-based.',
    features: [
      { icon: 'convert',   title: 'GIF to Any Format', desc: 'Export GIF frames as JPEG, PNG, or WebP.' },
      { icon: 'lock',      title: '100% Private',      desc: 'All conversion runs in your browser.' },
      { icon: 'lightning', title: 'Instant',           desc: 'Fast canvas-based conversion.' },
      { icon: 'free',      title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload GIF',     desc:'Select your GIF file.' },
      { n:'2', title:'Choose Format',  desc:'Pick JPEG, PNG, or WebP.' },
      { n:'3', title:'Download',       desc:'Download your converted image.' },
    ],
    faqs: [
      { q:'Is animation preserved?', a:'When converting to still formats, the first frame is exported.' },
      { q:'Are files uploaded?',     a:'No. Everything runs in your browser.' },
    ],
    seo: 'Convert GIF images online for free. Transform GIF to JPEG, PNG or WebP in your browser. No uploads.',
  },
  {
    dir: 'svg-converter',
    title: 'SVG Converter',
    subtitle: 'Convert SVG vector files to PNG, JPEG or WebP at any resolution. Free, browser-based.',
    features: [
      { icon: 'vector',    title: 'Any Resolution', desc: 'Export SVG to raster at any pixel dimension.' },
      { icon: 'lock',      title: '100% Private',   desc: 'Runs entirely in your browser.' },
      { icon: 'lightning', title: 'Instant',        desc: 'Fast canvas rendering.' },
      { icon: 'formats',   title: 'PNG, JPEG, WebP',desc: 'Export to the raster format you need.' },
      { icon: 'free',      title: 'Free Forever',   desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload SVG', desc:'Select your SVG vector file.' },
      { n:'2', title:'Set Size',   desc:'Choose output pixel dimensions.' },
      { n:'3', title:'Download',   desc:'Download your raster image.' },
    ],
    faqs: [
      { q:'What resolution can I use?', a:'Any resolution — enter desired pixel dimensions.' },
      { q:'Are files uploaded?',        a:'No. All conversion is browser-based.' },
    ],
    seo: 'Convert SVG to PNG or JPEG online for free. Render SVG vector files to any pixel resolution in your browser. No uploads.',
  },
  {
    dir: 'pdf-converter',
    title: 'PDF Converter',
    subtitle: 'Convert PDF pages to images or images to PDF. Browser-based with full privacy.',
    features: [
      { icon: 'pdf',       title: 'PDF to Image', desc: 'Convert each PDF page to JPEG or PNG.' },
      { icon: 'convert',   title: 'Image to PDF', desc: 'Combine multiple images into one PDF.' },
      { icon: 'lock',      title: '100% Private', desc: 'Browser-based — no files uploaded.' },
      { icon: 'lightning', title: 'Fast',         desc: 'Instant conversion using PDF.js.' },
      { icon: 'free',      title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload',   desc:'Upload your PDF or image files.' },
      { n:'2', title:'Convert',  desc:'Select direction: PDF to images or images to PDF.' },
      { n:'3', title:'Download', desc:'Download your converted file(s).' },
    ],
    faqs: [
      { q:'Can I convert multi-page PDFs?', a:'Yes — each page exported as a separate image.' },
      { q:'Are my files uploaded?',         a:'No. All conversion runs in your browser.' },
    ],
    seo: 'Convert PDF to images or images to PDF online for free. Browser-based PDF converter, no uploads, full privacy.',
  },
  {
    dir: 'image-to-pdf',
    title: 'Image to PDF',
    subtitle: 'Combine multiple images into a single PDF document. Free, browser-based, no upload required.',
    features: [
      { icon: 'pdf',       title: 'Multi-Image PDF', desc: 'Combine multiple JPEG, PNG or WebP into one PDF.' },
      { icon: 'reorder',   title: 'Reorder Pages',   desc: 'Drag to rearrange image order.' },
      { icon: 'lock',      title: '100% Private',    desc: 'Browser-based — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant',         desc: 'Fast PDF generation.' },
      { icon: 'free',      title: 'Free Forever',    desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload Images', desc:'Select or drag JPEG, PNG or WebP files.' },
      { n:'2', title:'Arrange',       desc:'Reorder images for the correct page sequence.' },
      { n:'3', title:'Download PDF',  desc:'Download your combined PDF.' },
    ],
    faqs: [
      { q:'How many images can I add?', a:'Multiple images; best results under 50.' },
      { q:'Are files uploaded?',        a:'No. PDF generation runs locally.' },
    ],
    seo: 'Convert images to PDF online for free. Combine JPEG, PNG and WebP into a single PDF in your browser. No uploads.',
  },
  {
    dir: 'jpg-to-pdf',
    title: 'JPG to PDF Converter',
    subtitle: 'Convert JPEG images to PDF documents. Combine multiple JPGs into one PDF. Free, browser-based.',
    features: [
      { icon: 'pdf',       title: 'One or Many', desc: 'Convert a single JPG or combine multiple into one PDF.' },
      { icon: 'lock',      title: '100% Private',desc: 'All processing runs in your browser.' },
      { icon: 'lightning', title: 'Instant',     desc: 'Fast PDF generation.' },
      { icon: 'free',      title: 'Free Forever',desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload JPGs', desc:'Select one or more JPEG files.' },
      { n:'2', title:'Arrange',     desc:'Order pages as needed.' },
      { n:'3', title:'Download PDF',desc:'Download your PDF.' },
    ],
    faqs: [
      { q:'Can I merge multiple JPGs?', a:'Yes — each JPEG becomes one page in the PDF.' },
      { q:'Are files uploaded?',        a:'No. Everything runs in your browser.' },
    ],
    seo: 'Convert JPG to PDF online for free. Merge multiple JPEG into a single PDF in your browser. No uploads.',
  },
  {
    dir: 'png-to-pdf',
    title: 'PNG to PDF Converter',
    subtitle: 'Convert PNG images to PDF documents. Combine multiple PNGs into one PDF. Free, browser-based.',
    features: [
      { icon: 'pdf',       title: 'Lossless PDF',  desc: 'PNG images are embedded losslessly in the PDF.' },
      { icon: 'lock',      title: '100% Private',  desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant',       desc: 'Fast PDF generation.' },
      { icon: 'free',      title: 'Free Forever',  desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNGs', desc:'Select one or more PNG files.' },
      { n:'2', title:'Arrange',     desc:'Order pages as needed.' },
      { n:'3', title:'Download PDF',desc:'Download your PDF.' },
    ],
    faqs: [
      { q:'Is transparency supported?', a:'Yes — PNG transparency is preserved in the PDF.' },
      { q:'Are files uploaded?',        a:'No. All processing is local.' },
    ],
    seo: 'Convert PNG to PDF online for free. Combine PNG images into a PDF in your browser. No uploads.',
  },
  {
    dir: 'pdf-to-images',
    title: 'PDF to Images',
    subtitle: 'Extract pages from a PDF and save them as JPEG or PNG images. Free, browser-based.',
    features: [
      { icon: 'pdf',       title: 'Page Extraction', desc: 'Export every PDF page as a high-quality image.' },
      { icon: 'quality',   title: 'High Resolution', desc: 'Set DPI for sharp image output.' },
      { icon: 'lock',      title: '100% Private',    desc: 'Browser-based — no uploads.' },
      { icon: 'lightning', title: 'Fast',            desc: 'Renders pages with PDF.js in seconds.' },
      { icon: 'formats',   title: 'JPEG & PNG',      desc: 'Choose your preferred output format.' },
      { icon: 'free',      title: 'Free Forever',    desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PDF', desc:'Select your PDF file.' },
      { n:'2', title:'Set Options',desc:'Choose format and resolution.' },
      { n:'3', title:'Download',   desc:'Download all pages as images.' },
    ],
    faqs: [
      { q:'Are all pages extracted?', a:'Yes — each page becomes a separate image.' },
      { q:'Are files uploaded?',      a:'No. PDF.js renders pages locally.' },
    ],
    seo: 'Convert PDF pages to images online for free. Extract each page as JPEG or PNG in your browser. No uploads.',
  },
  {
    dir: 'compress-jpg',
    title: 'Compress JPG',
    subtitle: 'Reduce JPEG file sizes without visible quality loss. Set target KB or adjust quality manually.',
    features: [
      { icon: 'compress',  title: 'Smart Compression', desc: 'Binary search finds optimal quality for your target.' },
      { icon: 'quality',   title: 'Quality Slider',    desc: 'Drag from 5% to 100% for full control.' },
      { icon: 'lock',      title: '100% Private',      desc: 'All compression runs locally.' },
      { icon: 'lightning', title: 'Instant Preview',   desc: 'Live preview as you adjust settings.' },
      { icon: 'free',      title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload JPG',   desc:'Select your JPEG image.' },
      { n:'2', title:'Set Quality',  desc:'Adjust quality or set target KB.' },
      { n:'3', title:'Download',     desc:'Download your compressed JPEG.' },
    ],
    faqs: [
      { q:'How much can I compress a JPEG?', a:'50-90% reduction with minimal visible quality loss.' },
      { q:'Are files uploaded?',             a:'No. Everything runs in your browser.' },
    ],
    seo: 'Compress JPEG images online for free. Reduce JPG sizes by up to 80% with quality control. Browser-based, no uploads.',
  },
  {
    dir: 'compress-png',
    title: 'Compress PNG',
    subtitle: 'Reduce PNG file sizes while preserving transparency. Free, browser-based.',
    features: [
      { icon: 'compress', title: 'PNG Compression',        desc: 'Optimize PNG to reduce file size.' },
      { icon: 'formats',  title: 'Transparency Preserved', desc: 'Alpha channel kept intact after compression.' },
      { icon: 'lock',     title: '100% Private',           desc: 'All processing runs in your browser.' },
      { icon: 'lightning',title: 'Instant',                desc: 'Fast browser-based compression.' },
      { icon: 'free',     title: 'Free Forever',           desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNG', desc:'Select your PNG image.' },
      { n:'2', title:'Compress',   desc:'Tool optimizes the PNG automatically.' },
      { n:'3', title:'Download',   desc:'Download your smaller PNG.' },
    ],
    faqs: [
      { q:'Is transparency preserved?', a:'Yes — PNG alpha channel is fully preserved.' },
      { q:'How much can PNG be reduced?',a:'Typically 20-50% depending on image content.' },
      { q:'Are files uploaded?',         a:'No. Everything runs locally.' },
    ],
    seo: 'Compress PNG images online for free. Reduce PNG sizes while preserving transparency. Browser-based, no uploads.',
  },
  {
    dir: 'compress-gif',
    title: 'Compress GIF',
    subtitle: 'Reduce animated GIF file sizes without breaking the animation. Free, browser-based.',
    features: [
      { icon: 'compress', title: 'GIF Optimization',  desc: 'Reduce colors and optimize frames.' },
      { icon: 'preview',  title: 'Animation Preview', desc: 'Preview compressed animation before downloading.' },
      { icon: 'lock',     title: '100% Private',      desc: 'All processing is browser-based.' },
      { icon: 'free',     title: 'Free Forever',      desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload GIF', desc:'Select your animated GIF.' },
      { n:'2', title:'Compress',   desc:'Tool reduces file size automatically.' },
      { n:'3', title:'Download',   desc:'Download your compressed GIF.' },
    ],
    faqs: [
      { q:'Is animation preserved?', a:'Yes — animation frames are kept intact.' },
      { q:'Are files uploaded?',     a:'No. Browser-based only.' },
    ],
    seo: 'Compress GIF files online for free. Reduce animated GIF sizes while preserving animation. Browser-based, no uploads.',
  },
  {
    dir: 'compress-pdf',
    title: 'Compress PDF',
    subtitle: 'Reduce PDF file sizes by compressing embedded images. Free, browser-based.',
    features: [
      { icon: 'pdf',       title: 'PDF Compression',  desc: 'Compress embedded images within PDF pages.' },
      { icon: 'quality',   title: 'Quality Control',  desc: 'Set image compression quality inside the PDF.' },
      { icon: 'lock',      title: '100% Private',     desc: 'Browser-based using PDF.js — nothing uploaded.' },
      { icon: 'lightning', title: 'Fast',             desc: 'Efficient compression for quick results.' },
      { icon: 'free',      title: 'Free Forever',     desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PDF',   desc:'Select your PDF file.' },
      { n:'2', title:'Set Quality',  desc:'Adjust image compression level.' },
      { n:'3', title:'Download',     desc:'Download your compressed PDF.' },
    ],
    faqs: [
      { q:'Does this compress all PDF content?', a:'It compresses embedded images which are typically largest.' },
      { q:'Are files uploaded?',                 a:'No. Everything runs in your browser.' },
    ],
    seo: 'Compress PDF files online for free. Reduce PDF sizes by compressing embedded images in your browser. No uploads.',
  },
  {
    dir: 'resize-jpg',
    title: 'Resize JPG',
    subtitle: 'Resize JPEG images to exact pixel dimensions. Lock aspect ratio, set target file size. Free, browser-based.',
    features: [
      { icon: 'resize',    title: 'Pixel-Perfect', desc: 'Set exact width and height with aspect-ratio lock.' },
      { icon: 'quality',   title: 'Quality Control',desc: 'Set JPEG output quality after resizing.' },
      { icon: 'lock',      title: '100% Private',  desc: 'Canvas-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant',       desc: 'Resize finishes in milliseconds.' },
      { icon: 'free',      title: 'Free Forever',  desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload JPG', desc:'Select your JPEG image.' },
      { n:'2', title:'Set Size',   desc:'Enter width and height in pixels.' },
      { n:'3', title:'Download',   desc:'Download your resized JPEG.' },
    ],
    faqs: [
      { q:'Will quality be preserved?', a:'Yes. Bicubic resampling keeps sharpness.' },
      { q:'Are files uploaded?',        a:'No. All processing is local.' },
    ],
    seo: 'Resize JPEG images online for free. Set exact pixel dimensions with aspect-ratio lock. Browser-based, no uploads.',
  },
  {
    dir: 'resize-png',
    title: 'Resize PNG',
    subtitle: 'Resize PNG images to exact pixel dimensions while preserving transparency. Free, browser-based.',
    features: [
      { icon: 'resize',    title: 'Pixel-Perfect PNG',    desc: 'Resize to exact dimensions with transparency preserved.' },
      { icon: 'formats',   title: 'Transparency Intact',  desc: 'Alpha channel preserved through all resize operations.' },
      { icon: 'lock',      title: '100% Private',         desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant',              desc: 'Canvas resize finishes immediately.' },
      { icon: 'free',      title: 'Free Forever',         desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNG', desc:'Select your PNG image.' },
      { n:'2', title:'Set Size',   desc:'Enter target width and height.' },
      { n:'3', title:'Download',   desc:'Download your resized PNG.' },
    ],
    faqs: [
      { q:'Is transparency preserved?', a:'Yes — PNG alpha is fully preserved.' },
      { q:'Are files uploaded?',        a:'No. All processing is local.' },
    ],
    seo: 'Resize PNG images online for free. Set exact pixel dimensions while preserving transparency. Browser-based, no uploads.',
  },
  {
    dir: 'resize-webp',
    title: 'Resize WebP',
    subtitle: 'Resize WebP images to any pixel dimension. Free, browser-based, no upload required.',
    features: [
      { icon: 'resize',    title: 'WebP Resize',    desc: 'Resize WebP while keeping the efficient format.' },
      { icon: 'quality',   title: 'Quality Control',desc: 'Adjust output quality for lossy WebP.' },
      { icon: 'lock',      title: '100% Private',   desc: 'All processing is browser-based.' },
      { icon: 'lightning', title: 'Instant',        desc: 'Fast canvas resize.' },
      { icon: 'free',      title: 'Free Forever',   desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload WebP', desc:'Select your WebP file.' },
      { n:'2', title:'Set Size',    desc:'Enter target dimensions.' },
      { n:'3', title:'Download',    desc:'Download your resized WebP.' },
    ],
    faqs: [
      { q:'Can I keep WebP format after resizing?', a:'Yes — output can be saved as WebP.' },
      { q:'Are files uploaded?',                   a:'No. Everything is local.' },
    ],
    seo: 'Resize WebP images online for free. Set exact dimensions and export as WebP, JPEG or PNG. Browser-based, no uploads.',
  },
  {
    dir: 'crop-jpg',
    title: 'Crop JPG',
    subtitle: 'Crop JPEG images to any region or preset aspect ratio. Free, browser-based.',
    features: [
      { icon: 'crop',    title: 'Freeform Crop',  desc: 'Select any rectangular region of your JPEG.' },
      { icon: 'formats', title: 'Preset Ratios',  desc: 'Crop to 1:1, 16:9, 4:3 and more.' },
      { icon: 'lock',    title: '100% Private',   desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning',title:'Instant',        desc: 'Canvas crop finishes immediately.' },
      { icon: 'free',    title: 'Free Forever',   desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload JPG',     desc:'Select your JPEG image.' },
      { n:'2', title:'Select Region',  desc:'Drag to select the crop area.' },
      { n:'3', title:'Download',       desc:'Download your cropped JPEG.' },
    ],
    faqs: [
      { q:'Can I crop to exact pixels?', a:'Yes — enter precise coordinates or use drag handles.' },
      { q:'Are files uploaded?',         a:'No. Everything is browser-based.' },
    ],
    seo: 'Crop JPEG images online for free. Select any region or preset ratio and export. Browser-based, no uploads.',
  },
  {
    dir: 'crop-png',
    title: 'Crop PNG',
    subtitle: 'Crop PNG images to any region while preserving transparency. Free, browser-based.',
    features: [
      { icon: 'crop',    title: 'Freeform Crop',        desc: 'Select any rectangular region.' },
      { icon: 'formats', title: 'Transparency Preserved',desc: 'Alpha channel maintained in output.' },
      { icon: 'lock',    title: '100% Private',         desc: 'Browser-based, nothing uploaded.' },
      { icon: 'free',    title: 'Free Forever',         desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload PNG',  desc:'Select your PNG image.' },
      { n:'2', title:'Select Crop', desc:'Draw the crop region.' },
      { n:'3', title:'Download',    desc:'Download your cropped PNG.' },
    ],
    faqs: [
      { q:'Is transparency preserved?', a:'Yes — PNG alpha is kept in the cropped output.' },
      { q:'Are files uploaded?',        a:'No. All local.' },
    ],
    seo: 'Crop PNG images online for free. Trim PNG to any region while preserving transparency. Browser-based, no uploads.',
  },
  {
    dir: 'crop-webp',
    title: 'Crop WebP',
    subtitle: 'Crop WebP images to any region. Free, browser-based, no upload required.',
    features: [
      { icon: 'crop',     title: 'Freeform Crop', desc: 'Select any region of your WebP to crop.' },
      { icon: 'lock',     title: '100% Private',  desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning',title: 'Instant',       desc: 'Canvas crop completes immediately.' },
      { icon: 'free',     title: 'Free Forever',  desc: 'No account, no watermark.' },
    ],
    steps: [
      { n:'1', title:'Upload WebP',  desc:'Select your WebP file.' },
      { n:'2', title:'Select Crop',  desc:'Draw the crop region.' },
      { n:'3', title:'Download',     desc:'Download your cropped WebP.' },
    ],
    faqs: [
      { q:'Can I export as a different format?', a:'Yes — choose JPEG, PNG or WebP as output.' },
      { q:'Are files uploaded?',                 a:'No. All local.' },
    ],
    seo: 'Crop WebP images online for free. Trim WebP to any region. Browser-based, no uploads.',
  },
  {
    dir: 'collage',
    title: 'Photo Collage Maker',
    subtitle: 'Create beautiful photo collages from multiple images. Choose grid layouts and download as JPEG or PNG. Free, browser-based.',
    features: [
      { icon: 'collage',   title: 'Grid Layouts',   desc: 'Choose from 2x1, 2x2, 3x1 and more templates.' },
      { icon: 'resize',    title: 'Custom Size',    desc: 'Set the output canvas size in pixels.' },
      { icon: 'lock',      title: '100% Private',   desc: 'All collage creation in your browser.' },
      { icon: 'lightning', title: 'Instant Preview',desc: 'See your collage update in real time.' },
      { icon: 'formats',   title: 'JPEG & PNG',     desc: 'Export in your preferred format.' },
      { icon: 'free',      title: 'Free Forever',   desc: 'No account, no watermark, no limits.' },
    ],
    steps: [
      { n:'1', title:'Upload Photos', desc:'Select multiple images.' },
      { n:'2', title:'Choose Layout', desc:'Pick a grid layout template.' },
      { n:'3', title:'Download',      desc:'Download your finished collage.' },
    ],
    faqs: [
      { q:'How many photos can I add?', a:'Up to the number of cells in the chosen grid.' },
      { q:'What output size can I use?', a:'Set any custom canvas size before generating.' },
      { q:'Are files uploaded?',        a:'No. All rendering happens in your browser.' },
    ],
    seo: 'Create photo collages online for free. Combine multiple images into grid layouts and export as JPEG or PNG. Browser-based, no uploads.',
  },
];

/* ─── Generate features JSX string ──────────────────────────────────────── */
function genFeaturesJsx(features) {
  return features.map(f => {
    const svg = iconSvg(f.icon);
    return `  { icon: (${svg}), title: '${f.title.replace(/'/g,"\\'")}', desc: '${f.desc.replace(/'/g,"\\'")}' }`;
  }).join(',\n');
}

function genStepsJsx(steps) {
  return steps.map(s =>
    `  { n: '${s.n}', title: '${s.title.replace(/'/g,"\\'")}', desc: '${s.desc.replace(/'/g,"\\'")}' }`
  ).join(',\n');
}

function genFaqsJsx(faqs) {
  return faqs.map(f =>
    `  { q: '${f.q.replace(/'/g,"\\'")}', a: '${f.a.replace(/'/g,"\\'")}' }`
  ).join(',\n');
}

/* ─── Extract workspace JSX from existing page ───────────────────────────── */
function extractWorkspaceJsx(content) {
  // Strategy: find the workspace content between the conditional Workspace
  // We want the section between "Conditional Workspace" or the main tool UI

  // Find the inner return or the workspace div
  // Look for the first <div className="bg-lightbg or similar tool wrapper
  // We look for the content inside the component's main return

  // The existing pages return:
  // <div className="bg-lightbg min-h-screen py-8 px-4...">
  //   <div className="max-w-6xl mx-auto flex flex-col gap-6">
  //     [header title section]
  //     [conditional workspace section - THIS IS WHAT WE WANT]
  //     [features/howto/faq/seo sections - WE STRIP THESE]
  //   </div>
  // </div>
  //
  // We want to extract only the conditional workspace section and the header
  // and wrap it in ToolPageShell (which provides features/howto/faq/seo)

  // Find the workspace content - look for "{/* Conditional Workspace */}" 
  // or "{/* Header Title */}" through to "{/* Features & How To Section */}"
  const condStart = content.indexOf('{/* Conditional Workspace */}');
  const condStart2 = content.indexOf('files.length === 0');
  const condStart3 = content.indexOf('!file ?');
  const condStart4 = content.indexOf('{!file ?');

  // Find the Features & How To section which we want to strip
  const featuresStart = content.indexOf('{/* Features & How To Section */}');
  const featuresStart2 = content.indexOf('{/* Features');
  const featuresStart3 = content.indexOf('mt-12 flex flex-col gap-12');

  const wsStart = Math.max(0, Math.min(
    condStart >= 0 ? condStart : Infinity,
    condStart2 >= 0 ? condStart2 : Infinity,
    condStart3 >= 0 ? condStart3 : Infinity,
    condStart4 >= 0 ? condStart4 : Infinity,
  ));
  
  const wsEnd = Math.min(
    featuresStart >= 0 ? featuresStart : Infinity,
    featuresStart2 >= 0 ? featuresStart2 : Infinity,
    featuresStart3 >= 0 ? featuresStart3 : Infinity,
  );

  if (wsStart === 0 || wsEnd === Infinity) {
    return null; // Can't extract cleanly
  }

  return content.slice(wsStart, wsEnd).trim();
}

/* ─── Generate clean page ────────────────────────────────────────────────── */
function generateCleanPage(tool, existingContent) {
  // Extract all the imports from the existing file (everything before the first const or export)
  const importLines = [];
  const lines = existingContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('import ') || line.startsWith('"use client"') || line.startsWith("'use client'")) {
      // Skip ToolPageShell import if already there (we'll add our own)
      if (!line.includes('ToolPageShell')) {
        importLines.push(line);
      }
    }
  }

  // Get the component state and logic (everything between function decl and return)
  const exportMatch = existingContent.match(/export default function (\w+)\(\)/);
  if (!exportMatch) return null;
  const fnName = exportMatch[1];

  // Find function body start
  const fnStart = existingContent.indexOf(`export default function ${fnName}()`);
  if (fnStart === -1) return null;

  // Find opening brace of function
  const fnBraceStart = existingContent.indexOf('{', fnStart);
  if (fnBraceStart === -1) return null;

  // Find the original return statement (the first 'return (' inside the function)
  // Skip any inner return statements in callbacks
  const fnBody = existingContent.slice(fnBraceStart + 1);
  
  // Find the main return — look for "return (\n    <" pattern
  const mainReturnMatch = fnBody.match(/\n  return \(\n/);
  if (!mainReturnMatch) return null;
  
  const returnOffset = fnBody.indexOf(mainReturnMatch[0]);
  const stateAndLogic = fnBody.slice(0, returnOffset).trim();
  
  // Extract the workspace JSX
  // Find content between "Conditional Workspace" and "Features & How To"
  const workspaceJsx = extractWorkspaceJsx(existingContent);

  if (!workspaceJsx) return null;

  return `"use client";

${importLines.filter(l => l.trim()).join('\n')}
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
${genFeaturesJsx(tool.features)}
];

const _STEPS = [
${genStepsJsx(tool.steps)}
];

const _FAQS = [
${genFaqsJsx(tool.faqs)}
];

export default function ${fnName}() {
  ${stateAndLogic}

  return (
    <ToolPageShell
      title="${tool.title}"
      subtitle="${tool.subtitle.replace(/"/g, '\\"')}"
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="${tool.seo.replace(/"/g, '\\"')}"
    >
      <div className="flex flex-col gap-6">
        {/* Workspace */}
        ${workspaceJsx}
      </div>
    </ToolPageShell>
  );
}
`;
}

/* ─── Run ────────────────────────────────────────────────────────────────── */
console.log('🔄 Cleanly rewriting tool pages with ToolPageShell...\n');

let ok = 0, fail = 0;
tools.forEach(tool => {
  const pagePath = path.join(APP_DIR, tool.dir, 'page.js');
  try {
    const existing = fs.readFileSync(pagePath, 'utf8');
    const cleaned = generateCleanPage(tool, existing);
    if (!cleaned) {
      console.log(`  ⚠  ${tool.dir} — could not extract workspace JSX`);
      fail++;
      return;
    }
    fs.writeFileSync(pagePath, cleaned, 'utf8');
    console.log(`  ✅  ${tool.dir}`);
    ok++;
  } catch(e) {
    console.log(`  ❌  ${tool.dir} — ${e.message}`);
    fail++;
  }
});

console.log(`\n✅ Done! ${ok} updated, ${fail} failed.`);
