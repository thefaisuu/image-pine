/**
 * rewrite-tool-pages.js
 * 
 * Rewrites all 31 tool sub-pages to use the premium ToolPageShell component.
 * Run from project root: node scripts/rewrite-tool-pages.js
 */

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '..', 'app');

/* ─── Tool definitions ───────────────────────────────────────────────────── */
const tools = [
  {
    dir: 'resize',
    component: 'ResizePage',
    title: 'Image Resizer',
    subtitle: 'Resize any image to exact pixel dimensions or a percentage scale. Lock aspect ratio to prevent distortion. Free, fast and 100% private.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';\nimport { getMimeForSaveFormat, getExtensionForMime, compressCanvasToBlob } from '@/lib/imageUtils';`,
    features: [
      { icon: 'resize', title: 'Pixel-Perfect Resize', desc: 'Set exact width and height in pixels with optional aspect-ratio lock to prevent stretching.' },
      { icon: 'percent', title: 'Scale by Percentage', desc: 'Scale down by 50%, 75% or any percentage using an intuitive slider control.' },
      { icon: 'lock', title: 'Privacy Guaranteed', desc: 'All resizing happens in your browser using HTML5 Canvas. No files are ever uploaded.' },
      { icon: 'lightning', title: 'Instant Processing', desc: 'Canvas-based bicubic resampling finishes in milliseconds with no waiting.' },
      { icon: 'formats', title: 'Multiple Formats', desc: 'Export resized images as JPEG, PNG, or WebP with optional target file size.' },
      { icon: 'free', title: 'Completely Free', desc: 'No watermarks, no registration, no limits. Resize as many images as you need.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Click or drag & drop to upload your JPEG, PNG, WebP, or SVG image.' },
      { n: '2', title: 'Set Size', desc: 'Enter target pixel dimensions or use the percentage slider.' },
      { n: '3', title: 'Download', desc: 'Click Resize Image and download your perfectly-sized file.' },
    ],
    faqs: [
      { q: 'How does the resizer preserve quality?', a: 'It uses bicubic scaling inside an HTML5 Canvas, preventing pixelation or color distortion.' },
      { q: 'Can I resize by percentage?', a: 'Yes — toggle to percentage mode and use the slider to scale by any amount from 1% to 200%.' },
      { q: 'Are my images sent to any server?', a: 'No. All processing is 100% client-side. Your images never leave your device.' },
      { q: 'What formats are supported?', a: 'JPEG, PNG, WebP, and SVG as input. Export as JPEG, PNG, or WebP.' },
    ],
    seo: 'Resize images online for free without losing quality. Our browser-based Image Resizer uses HTML5 Canvas to resize JPG, PNG, WebP and SVG images to any pixel dimension or percentage scale. Lock the aspect ratio to prevent stretching, or set a target file size. No uploads required — everything processes locally in your browser for complete privacy.',
  },
  {
    dir: 'compress',
    component: 'CompressPage',
    title: 'Image Compressor',
    subtitle: 'Shrink image file sizes without visible quality loss. Set target file size in KB or adjust quality with a slider. Browser-based, 100% private.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'compress', title: 'Smart Compression', desc: 'Binary search algorithm finds the optimal quality to hit your exact target file size.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Slide the quality knob to find the perfect balance between file size and visual clarity.' },
      { icon: 'lock', title: '100% Private', desc: 'All compression runs locally in your browser. No data ever leaves your device.' },
      { icon: 'lightning', title: 'Instant Results', desc: 'Live preview updates in real time as you adjust settings — no wait time.' },
      { icon: 'formats', title: 'JPEG, PNG, WebP', desc: 'Compress and convert between the most common web image formats.' },
      { icon: 'free', title: 'Completely Free', desc: 'No account, no watermark, no limits. Compress as many photos as you like.' },
    ],
    steps: [
      { n: '1', title: 'Upload Image', desc: 'Drop your JPEG, PNG, or WebP image into the upload area.' },
      { n: '2', title: 'Adjust Settings', desc: 'Set a target file size in KB or drag the quality slider.' },
      { n: '3', title: 'Download', desc: 'Click Download to save your compressed image instantly.' },
    ],
    faqs: [
      { q: 'How does compression work?', a: 'Canvas-based algorithms adjust quality parameters and strip metadata to reduce file size without visible degradation.' },
      { q: 'Can I set a specific target size?', a: 'Yes — enter a KB value and the tool uses binary search compression to hit that exact limit.' },
      { q: 'What formats are supported?', a: 'JPEG, PNG, and WebP for both input and output.' },
      { q: 'Are my files stored?', a: 'No. Compression runs entirely in your browser. Nothing is uploaded to any server.' },
    ],
    seo: 'Compress images online for free. Reduce JPG, PNG and WebP file sizes by up to 80% while keeping visual quality sharp. Set a target file size in KB or use the quality slider for full control. All compression happens locally in your browser using the HTML5 Canvas API — your images are never uploaded to a server.',
  },
  {
    dir: 'rotate',
    component: 'RotatePage',
    title: 'Rotate Image',
    subtitle: 'Rotate images by any angle — 90°, 180°, 270° or a custom degree. Free online tool with live preview. No upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'rotate', title: 'Any Angle', desc: 'Rotate by exactly 90°, 180°, 270° — or enter any custom angle from -360° to +360°.' },
      { icon: 'preview', title: 'Live Preview', desc: 'See your rotation update in real time before downloading.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based rotation — nothing is uploaded to any server.' },
      { icon: 'formats', title: 'All Formats', desc: 'Rotate JPEG, PNG, WebP, and SVG images and export in any format.' },
      { icon: 'free', title: 'Completely Free', desc: 'No registration, no watermark, unlimited use.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas rotation completes in milliseconds — no waiting.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Drag & drop or click to select your image file.' },
      { n: '2', title: 'Set Angle', desc: 'Use the preset buttons or slider to set your rotation angle.' },
      { n: '3', title: 'Download', desc: 'Click Apply & Download to save the rotated image.' },
    ],
    faqs: [
      { q: 'Can I rotate to a custom angle?', a: 'Yes — use the angle slider to rotate by any value from -360° to +360°.' },
      { q: 'Does rotating reduce quality?', a: 'No. Canvas rotation preserves full image quality at all angles.' },
      { q: 'Are my images uploaded?', a: 'Never. All rotation happens in your browser — fully private.' },
    ],
    seo: 'Rotate images online for free. Turn JPEG, PNG, and WebP images by 90°, 180°, 270° or any custom angle. Our browser-based tool uses HTML5 Canvas for high-quality lossless rotation without uploading your files anywhere.',
  },
  {
    dir: 'flip',
    component: 'FlipPage',
    title: 'Flip Image',
    subtitle: 'Flip any image horizontally or vertically in one click. Live preview, no upload required. Free and 100% private.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'flip', title: 'Horizontal & Vertical', desc: 'Mirror your image along either axis — or both simultaneously.' },
      { icon: 'preview', title: 'Live Preview', desc: 'See the flipped result instantly in the preview area before downloading.' },
      { icon: 'lock', title: '100% Private', desc: 'All flipping happens locally. Your images never leave your device.' },
      { icon: 'formats', title: 'All Formats', desc: 'Supports JPEG, PNG, WebP, and SVG with multiple export options.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, no limits.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas-based flipping finishes in milliseconds.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Upload your JPEG, PNG, or WebP image.' },
      { n: '2', title: 'Flip', desc: 'Click Horizontal or Vertical flip (or both).' },
      { n: '3', title: 'Download', desc: 'Download your flipped image in one click.' },
    ],
    faqs: [
      { q: 'Can I flip both horizontally and vertically?', a: 'Yes — you can apply both flips simultaneously to rotate by 180° while mirroring.' },
      { q: 'Does flipping reduce image quality?', a: 'No. The HTML5 Canvas flip transform is lossless.' },
      { q: 'Are my images uploaded?', a: 'Never. Everything runs in your browser.' },
    ],
    seo: 'Flip images online for free. Mirror any JPEG, PNG or WebP image horizontally or vertically using our browser-based flip tool. No file uploads, no quality loss — instant results with complete privacy.',
  },
  {
    dir: 'crop',
    component: 'CropPage',
    title: 'Crop Image',
    subtitle: 'Crop any image to a custom rectangle or a preset aspect ratio. Free online tool — no upload, no registration.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'crop', title: 'Freeform Crop', desc: 'Drag to select any region of your image to crop to.' },
      { icon: 'ratios', title: 'Aspect Ratios', desc: 'Crop to common ratios: 1:1, 16:9, 4:3, and more.' },
      { icon: 'lock', title: '100% Private', desc: 'Crops happen entirely in your browser — nothing is uploaded.' },
      { icon: 'formats', title: 'All Formats', desc: 'Crop JPEG, PNG, WebP, and SVG images.' },
      { icon: 'preview', title: 'Live Preview', desc: 'Preview the crop area in real time before downloading.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, unlimited use.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Select or drag & drop your image.' },
      { n: '2', title: 'Select Crop', desc: 'Drag to select the region you want to keep.' },
      { n: '3', title: 'Download', desc: 'Click Crop & Download to save.' },
    ],
    faqs: [
      { q: 'Can I crop to a specific aspect ratio?', a: 'Yes — choose from preset ratios or enter custom dimensions.' },
      { q: 'Does cropping affect quality?', a: 'No. The original resolution is preserved in the cropped area.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs locally in your browser.' },
    ],
    seo: 'Crop images online for free. Use our browser-based crop tool to trim JPEG, PNG, and WebP images to any size or aspect ratio. No uploads, full privacy, instant results.',
  },
  {
    dir: 'bulk-resize',
    component: 'BulkResizePage',
    title: 'Bulk Image Resizer',
    subtitle: 'Resize multiple images to the same dimensions in one go. Upload up to 50 images and download them all instantly.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'bulk', title: 'Batch Processing', desc: 'Resize up to 50 images simultaneously with identical dimensions.' },
      { icon: 'resize', title: 'Exact Dimensions', desc: 'Set precise width and height in pixels with aspect-ratio lock.' },
      { icon: 'lock', title: '100% Private', desc: 'All images processed locally — nothing leaves your device.' },
      { icon: 'lightning', title: 'Fast', desc: 'Canvas-based parallel processing handles batches in seconds.' },
      { icon: 'formats', title: 'Multiple Formats', desc: 'Resize JPEG, PNG, WebP and export in your chosen format.' },
      { icon: 'free', title: 'Free Forever', desc: 'No registration, no watermark, no file limits.' },
    ],
    steps: [
      { n: '1', title: 'Upload Images', desc: 'Drag & drop or select multiple images at once.' },
      { n: '2', title: 'Set Dimensions', desc: 'Enter the target width and height to apply to all images.' },
      { n: '3', title: 'Download All', desc: 'Download each resized image or get a ZIP file.' },
    ],
    faqs: [
      { q: 'How many images can I resize at once?', a: 'The tool handles up to 50 images in a single batch.' },
      { q: 'Will all images get the same size?', a: 'Yes — you set one target dimension applied to all selected files.' },
      { q: 'Are my images uploaded?', a: 'No. Everything runs in your browser with full privacy.' },
    ],
    seo: 'Bulk resize multiple images at once for free. Upload up to 50 JPEG, PNG, or WebP files and resize them all to the same width and height instantly. Browser-based, no upload required, completely private.',
  },
  {
    dir: 'image-converter',
    component: 'ImageConverterPage',
    title: 'Image Converter',
    subtitle: 'Convert images between JPEG, PNG, WebP, GIF, and SVG formats in seconds. Free, private, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'All Formats', desc: 'Convert between JPEG, PNG, WebP, GIF and SVG effortlessly.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Set output quality for lossy formats to balance size vs clarity.' },
      { icon: 'lock', title: '100% Private', desc: 'Conversions run locally — no uploads, no server required.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas-based conversion finishes in milliseconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple images to the same format in one operation.' },
      { icon: 'free', title: 'Free Forever', desc: 'No watermarks, no account, unlimited conversions.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Select the image(s) you want to convert.' },
      { n: '2', title: 'Choose Format', desc: 'Pick the output format — JPEG, PNG, WebP, etc.' },
      { n: '3', title: 'Download', desc: 'Download the converted file(s) instantly.' },
    ],
    faqs: [
      { q: 'What formats can I convert between?', a: 'JPEG, PNG, WebP, GIF and SVG are all supported.' },
      { q: 'Does conversion reduce quality?', a: 'For lossless formats (PNG) quality is preserved. For JPEG/WebP you can set the quality level.' },
      { q: 'Are my files uploaded?', a: 'No. All conversion happens in your browser — fully private.' },
    ],
    seo: 'Convert images between formats online for free. Transform JPEG to PNG, PNG to WebP, WebP to JPEG, and more — all in your browser with no file uploads. Fast, private, and completely free.',
  },
  {
    dir: 'jpg-to-png',
    component: 'JpgToPngPage',
    title: 'JPG to PNG Converter',
    subtitle: 'Convert JPEG images to transparent PNG format online. Free, instant, browser-based — no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'Lossless PNG Output', desc: 'Convert JPEG to PNG with no quality loss and transparency support.' },
      { icon: 'lock', title: '100% Private', desc: 'Conversion happens entirely in your browser — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas API converts your JPEG to PNG in milliseconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple JPGs to PNG simultaneously.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, unlimited use.' },
      { icon: 'formats', title: 'Any JPEG', desc: 'Supports .jpg and .jpeg files of any size up to 15 MB.' },
    ],
    steps: [
      { n: '1', title: 'Upload JPG', desc: 'Select or drag & drop your JPEG/JPG image.' },
      { n: '2', title: 'Convert', desc: 'The tool converts to PNG automatically.' },
      { n: '3', title: 'Download PNG', desc: 'Download your converted PNG file.' },
    ],
    faqs: [
      { q: 'Will converting JPG to PNG improve quality?', a: 'Converting to PNG adds transparency support and prevents further lossy compression, but cannot recover detail lost in the original JPEG.' },
      { q: 'Are files uploaded?', a: 'No. Conversion is 100% local in your browser.' },
    ],
    seo: 'Convert JPG to PNG online for free. Transform JPEG images to lossless PNG format with transparency support using your browser. No file uploads, no registration, instant results.',
  },
  {
    dir: 'png-to-jpg',
    component: 'PngToJpgPage',
    title: 'PNG to JPG Converter',
    subtitle: 'Convert PNG images to JPEG format to reduce file size. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'Smaller File Size', desc: 'JPEG format gives dramatically smaller files than PNG for photos.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Set JPEG quality from 5% to 100% to balance size vs sharpness.' },
      { icon: 'lock', title: '100% Private', desc: 'Runs entirely in your browser — nothing is uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas conversion completes in milliseconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple PNGs to JPEG in one session.' },
      { icon: 'free', title: 'Free Forever', desc: 'No registration, no watermark, no limits.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNG', desc: 'Select or drag & drop your PNG image.' },
      { n: '2', title: 'Set Quality', desc: 'Adjust JPEG quality to balance file size and clarity.' },
      { n: '3', title: 'Download JPG', desc: 'Download your converted JPEG file.' },
    ],
    faqs: [
      { q: 'Will transparency be preserved?', a: 'No — JPEG does not support transparency. Transparent areas will be filled with white.' },
      { q: 'How small will the output be?', a: 'JPEG at 80% quality is typically 60-80% smaller than the same PNG.' },
      { q: 'Are files uploaded?', a: 'No. All conversion happens locally in your browser.' },
    ],
    seo: 'Convert PNG to JPG online for free. Transform lossless PNG images to smaller JPEG format with adjustable quality. Browser-based, no upload, instant results.',
  },
  {
    dir: 'webp-to-jpg',
    component: 'WebpToJpgPage',
    title: 'WebP to JPG Converter',
    subtitle: 'Convert WebP images to JPEG for maximum compatibility. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'Universal JPG Output', desc: 'JPEG works everywhere — email, social, websites, and old software.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Adjust output JPEG quality from 5% to 100%.' },
      { icon: 'lock', title: '100% Private', desc: 'Runs locally in your browser — no uploads ever.' },
      { icon: 'lightning', title: 'Instant', desc: 'Conversion finishes in milliseconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple WebP files at once.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, unlimited use.' },
    ],
    steps: [
      { n: '1', title: 'Upload WebP', desc: 'Select your WebP image file.' },
      { n: '2', title: 'Convert', desc: 'The tool converts to JPEG instantly.' },
      { n: '3', title: 'Download JPG', desc: 'Save your compatible JPEG file.' },
    ],
    faqs: [
      { q: 'Why convert WebP to JPG?', a: 'JPEG has wider compatibility with older software, email clients, and social platforms that don\'t support WebP.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs in your browser.' },
    ],
    seo: 'Convert WebP to JPG online for free. Transform WebP images to universally compatible JPEG format instantly in your browser. No file uploads, complete privacy, instant download.',
  },
  {
    dir: 'webp-to-png',
    component: 'WebpToPngPage',
    title: 'WebP to PNG Converter',
    subtitle: 'Convert WebP images to lossless PNG format with transparency support. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'Lossless PNG', desc: 'PNG preserves all image detail and supports full transparency.' },
      { icon: 'lock', title: '100% Private', desc: 'Conversion happens in your browser — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas conversion completes in milliseconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple WebP files to PNG in one session.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
      { icon: 'formats', title: 'Full Transparency', desc: 'Transparent WebP images retain their alpha channel in PNG.' },
    ],
    steps: [
      { n: '1', title: 'Upload WebP', desc: 'Select your WebP file.' },
      { n: '2', title: 'Convert', desc: 'Automatic conversion to PNG.' },
      { n: '3', title: 'Download PNG', desc: 'Download your lossless PNG.' },
    ],
    faqs: [
      { q: 'Is transparency preserved?', a: 'Yes — WebP transparency maps directly to PNG alpha channel.' },
      { q: 'Are files uploaded?', a: 'No. All processing is in-browser.' },
    ],
    seo: 'Convert WebP to PNG online for free. Transform WebP images to lossless PNG with transparency support directly in your browser. No uploads, instant results.',
  },
  {
    dir: 'png-to-svg',
    component: 'PngToSvgPage',
    title: 'PNG to SVG Converter',
    subtitle: 'Convert raster PNG images to scalable SVG vector format. Free, browser-based tool.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'vector', title: 'Scalable Output', desc: 'SVG scales to any size without pixelation — perfect for logos and icons.' },
      { icon: 'lock', title: '100% Private', desc: 'Conversion runs in your browser — no uploads.' },
      { icon: 'lightning', title: 'Instant', desc: 'Get your SVG in seconds.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNG', desc: 'Select your PNG image.' },
      { n: '2', title: 'Convert', desc: 'The tool traces and generates SVG.' },
      { n: '3', title: 'Download SVG', desc: 'Save your scalable SVG file.' },
    ],
    faqs: [
      { q: 'Will the SVG look exactly like the PNG?', a: 'Simple images like logos convert well. Complex photos may have reduced detail.' },
      { q: 'Are files uploaded?', a: 'No. Everything is browser-based.' },
    ],
    seo: 'Convert PNG to SVG online for free. Transform raster PNG images into scalable vector graphics in your browser. No uploads, instant results.',
  },
  {
    dir: 'heic-to-jpg',
    component: 'HeicToJpgPage',
    title: 'HEIC to JPG Converter',
    subtitle: 'Convert iPhone HEIC/HEIF photos to universally compatible JPEG format. Free, fast, private.',
    import: `import { HeicConverter } from '@/components/HeicConverter';`,
    features: [
      { icon: 'convert', title: 'iPhone Compatible', desc: 'Opens HEIC/HEIF files from iPhone, iPad, and macOS cameras.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Set JPEG quality for the perfect size vs clarity balance.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based — your photos never leave your device.' },
      { icon: 'lightning', title: 'Fast', desc: 'Converts HEIC to JPEG in a few seconds.' },
      { icon: 'bulk', title: 'Batch Convert', desc: 'Convert multiple HEIC photos at once.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, no limits.' },
    ],
    steps: [
      { n: '1', title: 'Upload HEIC', desc: 'Select your HEIC or HEIF photo.' },
      { n: '2', title: 'Convert', desc: 'The tool converts to JPEG automatically.' },
      { n: '3', title: 'Download JPG', desc: 'Download your JPEG file.' },
    ],
    faqs: [
      { q: 'What is HEIC format?', a: 'HEIC (High Efficiency Image Container) is Apple\'s default photo format used on iPhone and iPad since iOS 11.' },
      { q: 'Why convert to JPG?', a: 'JPEG is universally compatible with all devices, websites, and applications.' },
      { q: 'Are files uploaded?', a: 'No. Conversion runs locally in your browser.' },
    ],
    seo: 'Convert HEIC to JPG online for free. Transform iPhone HEIC/HEIF photos to universally compatible JPEG format in your browser. No uploads, no software required, instant results.',
  },
  {
    dir: 'gif-converter',
    component: 'GifConverterPage',
    title: 'GIF Converter',
    subtitle: 'Convert GIF images to JPEG, PNG or WebP. Or convert images to GIF format. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'convert', title: 'GIF to Any Format', desc: 'Export GIF frames as JPEG, PNG, or WebP.' },
      { icon: 'lock', title: '100% Private', desc: 'All conversion runs in your browser.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast canvas-based conversion.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload GIF', desc: 'Select your GIF file.' },
      { n: '2', title: 'Choose Format', desc: 'Pick output: JPEG, PNG, or WebP.' },
      { n: '3', title: 'Download', desc: 'Download your converted image.' },
    ],
    faqs: [
      { q: 'Will animation be preserved?', a: 'When converting to still formats (JPEG/PNG/WebP), the first frame is exported.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs in your browser.' },
    ],
    seo: 'Convert GIF images online for free. Transform GIF to JPEG, PNG, or WebP, or convert images to GIF format. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'svg-converter',
    component: 'SvgConverterPage',
    title: 'SVG Converter',
    subtitle: 'Convert SVG vector files to PNG, JPEG or WebP raster images at any resolution. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'vector', title: 'Any Resolution', desc: 'Export SVG to raster at any pixel dimension you need.' },
      { icon: 'lock', title: '100% Private', desc: 'Runs entirely in your browser — no uploads.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast canvas rendering.' },
      { icon: 'formats', title: 'PNG, JPEG, WebP', desc: 'Export to the raster format that suits your use case.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload SVG', desc: 'Select your SVG vector file.' },
      { n: '2', title: 'Set Size', desc: 'Choose output pixel dimensions.' },
      { n: '3', title: 'Download', desc: 'Download your raster image.' },
    ],
    faqs: [
      { q: 'What output resolution can I use?', a: 'Any resolution — enter the desired pixel dimensions before exporting.' },
      { q: 'Are files uploaded?', a: 'No. All conversion is browser-based.' },
    ],
    seo: 'Convert SVG to PNG or JPEG online for free. Render SVG vector files to any pixel resolution in your browser. No uploads, instant results.',
  },
  {
    dir: 'pdf-converter',
    component: 'PdfConverterPage',
    title: 'PDF Converter',
    subtitle: 'Convert PDF pages to images or images to PDF. Free online tool — browser-based with full privacy.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'PDF to Image', desc: 'Convert each PDF page to a high-quality JPEG or PNG image.' },
      { icon: 'convert', title: 'Image to PDF', desc: 'Combine multiple images into a single PDF document.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based — no files uploaded to any server.' },
      { icon: 'lightning', title: 'Fast', desc: 'Instant conversion using browser-native PDF.js.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload', desc: 'Upload your PDF or image files.' },
      { n: '2', title: 'Convert', desc: 'Select direction: PDF to images or images to PDF.' },
      { n: '3', title: 'Download', desc: 'Download your converted file(s).' },
    ],
    faqs: [
      { q: 'Can I convert multi-page PDFs?', a: 'Yes — each page is exported as a separate image file.' },
      { q: 'Are my files uploaded?', a: 'No. All conversion runs in your browser.' },
    ],
    seo: 'Convert PDF to images or images to PDF online for free. Browser-based PDF converter with no uploads, no registration, and full privacy.',
  },
  {
    dir: 'image-to-pdf',
    component: 'ImageToPdfPage',
    title: 'Image to PDF',
    subtitle: 'Combine multiple images into a single PDF document. Free, browser-based — no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'Multi-Image PDF', desc: 'Combine multiple JPEG, PNG, or WebP images into one PDF.' },
      { icon: 'reorder', title: 'Reorder Pages', desc: 'Drag to rearrange image order before generating the PDF.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast PDF generation.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload Images', desc: 'Select or drag JPEG, PNG, or WebP files.' },
      { n: '2', title: 'Arrange', desc: 'Reorder images for the correct page sequence.' },
      { n: '3', title: 'Download PDF', desc: 'Download your combined PDF.' },
    ],
    faqs: [
      { q: 'How many images can I add?', a: 'The tool supports multiple images per PDF. For best performance, keep it under 50.' },
      { q: 'Are files uploaded?', a: 'No. PDF generation runs locally in your browser.' },
    ],
    seo: 'Convert images to PDF online for free. Combine JPEG, PNG, and WebP images into a single PDF document in your browser. No uploads, instant results.',
  },
  {
    dir: 'jpg-to-pdf',
    component: 'JpgToPdfPage',
    title: 'JPG to PDF Converter',
    subtitle: 'Convert JPEG images to PDF documents. Combine multiple JPGs into one PDF. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'One or Many', desc: 'Convert a single JPG or combine multiple into one PDF.' },
      { icon: 'lock', title: '100% Private', desc: 'All processing runs in your browser.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast PDF generation.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload JPGs', desc: 'Select one or more JPEG files.' },
      { n: '2', title: 'Arrange', desc: 'Order the pages as needed.' },
      { n: '3', title: 'Download PDF', desc: 'Download your PDF.' },
    ],
    faqs: [
      { q: 'Can I merge multiple JPGs into one PDF?', a: 'Yes — each JPEG becomes one page in the PDF.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs in your browser.' },
    ],
    seo: 'Convert JPG to PDF online for free. Merge multiple JPEG images into a single PDF document in your browser. No uploads, instant results.',
  },
  {
    dir: 'png-to-pdf',
    component: 'PngToPdfPage',
    title: 'PNG to PDF Converter',
    subtitle: 'Convert PNG images to PDF documents. Combine multiple PNGs into one PDF. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'Lossless PDF', desc: 'PNG images are embedded losslessly in the PDF.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast PDF generation.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNGs', desc: 'Select one or more PNG files.' },
      { n: '2', title: 'Arrange', desc: 'Order pages as needed.' },
      { n: '3', title: 'Download PDF', desc: 'Download your PDF.' },
    ],
    faqs: [
      { q: 'Is transparency supported?', a: 'Yes — PNG transparency is preserved in the PDF.' },
      { q: 'Are files uploaded?', a: 'No. All processing is local.' },
    ],
    seo: 'Convert PNG to PDF online for free. Combine PNG images into a PDF document in your browser. No uploads, instant results.',
  },
  {
    dir: 'pdf-to-images',
    component: 'PdfToImagesPage',
    title: 'PDF to Images',
    subtitle: 'Extract pages from a PDF and save them as JPEG or PNG images. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'Page Extraction', desc: 'Export every PDF page as a high-quality image.' },
      { icon: 'quality', title: 'High Resolution', desc: 'Set DPI for sharp image output.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based — no uploads.' },
      { icon: 'lightning', title: 'Fast', desc: 'Renders pages with PDF.js in seconds.' },
      { icon: 'formats', title: 'JPEG & PNG', desc: 'Choose your preferred output format.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PDF', desc: 'Select your PDF file.' },
      { n: '2', title: 'Set Options', desc: 'Choose output format and resolution.' },
      { n: '3', title: 'Download', desc: 'Download all pages as images.' },
    ],
    faqs: [
      { q: 'Are all pages extracted?', a: 'Yes — each page becomes a separate image file.' },
      { q: 'Are files uploaded?', a: 'No. PDF.js renders pages locally in your browser.' },
    ],
    seo: 'Convert PDF pages to images online for free. Extract each page from a PDF as a JPEG or PNG in your browser. No uploads, instant download.',
  },
  {
    dir: 'compress-jpg',
    component: 'CompressJpgPage',
    title: 'Compress JPG',
    subtitle: 'Reduce JPEG file sizes without visible quality loss. Set a target KB size or adjust quality manually.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'compress', title: 'Smart JPEG Compression', desc: 'Binary search finds the optimal quality setting for your target size.' },
      { icon: 'quality', title: 'Quality Slider', desc: 'Drag the quality slider from 5% to 100% for full control.' },
      { icon: 'lock', title: '100% Private', desc: 'All compression runs locally — nothing uploaded.' },
      { icon: 'lightning', title: 'Instant Preview', desc: 'Live preview updates as you adjust settings.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload JPG', desc: 'Select your JPEG image.' },
      { n: '2', title: 'Set Quality', desc: 'Adjust quality or set a target KB size.' },
      { n: '3', title: 'Download', desc: 'Download your compressed JPEG.' },
    ],
    faqs: [
      { q: 'How much can I compress a JPEG?', a: 'JPEG compression can reduce sizes by 50-90% with minimal visible quality loss.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs in your browser.' },
    ],
    seo: 'Compress JPEG images online for free. Reduce JPG file sizes by up to 80% with adjustable quality control. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'compress-png',
    component: 'CompressPngPage',
    title: 'Compress PNG',
    subtitle: 'Reduce PNG file sizes while preserving transparency. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'compress', title: 'PNG Compression', desc: 'Optimize PNG metadata and palette to reduce file size.' },
      { icon: 'formats', title: 'Transparency Preserved', desc: 'Alpha channel and transparency are kept intact after compression.' },
      { icon: 'lock', title: '100% Private', desc: 'All processing runs in your browser.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast browser-based compression.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNG', desc: 'Select your PNG image.' },
      { n: '2', title: 'Compress', desc: 'Tool optimizes the PNG automatically.' },
      { n: '3', title: 'Download', desc: 'Download your smaller PNG.' },
    ],
    faqs: [
      { q: 'Is transparency preserved?', a: 'Yes — PNG alpha channel is fully preserved during compression.' },
      { q: 'How much can PNG be compressed?', a: 'Typically 20-50% reduction depending on image content.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs locally.' },
    ],
    seo: 'Compress PNG images online for free. Reduce PNG file sizes while preserving transparency. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'compress-gif',
    component: 'CompressGifPage',
    title: 'Compress GIF',
    subtitle: 'Reduce animated GIF file sizes without breaking the animation. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'compress', title: 'GIF Optimization', desc: 'Reduce colors and optimize frames to shrink GIF file size.' },
      { icon: 'preview', title: 'Animation Preview', desc: 'Preview the compressed animation before downloading.' },
      { icon: 'lock', title: '100% Private', desc: 'All processing is browser-based.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload GIF', desc: 'Select your animated GIF.' },
      { n: '2', title: 'Compress', desc: 'Tool reduces file size automatically.' },
      { n: '3', title: 'Download', desc: 'Download your compressed GIF.' },
    ],
    faqs: [
      { q: 'Will animation be preserved?', a: 'Yes — animation frames are kept intact.' },
      { q: 'Are files uploaded?', a: 'No. Browser-based only.' },
    ],
    seo: 'Compress GIF files online for free. Reduce animated GIF file sizes while preserving animation. Browser-based, no uploads.',
  },
  {
    dir: 'compress-pdf',
    component: 'CompressPdfPage',
    title: 'Compress PDF',
    subtitle: 'Reduce PDF file sizes by compressing embedded images. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'pdf', title: 'PDF Compression', desc: 'Compress embedded images within PDF pages to reduce overall size.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Set image compression quality inside the PDF.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based using PDF.js — nothing uploaded.' },
      { icon: 'lightning', title: 'Fast', desc: 'Efficient compression for quick results.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PDF', desc: 'Select your PDF file.' },
      { n: '2', title: 'Set Quality', desc: 'Adjust image compression level.' },
      { n: '3', title: 'Download', desc: 'Download your compressed PDF.' },
    ],
    faqs: [
      { q: 'Does this compress all PDF content?', a: 'It compresses embedded images which are typically the largest part of PDF files.' },
      { q: 'Are files uploaded?', a: 'No. Everything runs in your browser.' },
    ],
    seo: 'Compress PDF files online for free. Reduce PDF file sizes by compressing embedded images in your browser. No uploads, instant results.',
  },
  {
    dir: 'resize-jpg',
    component: 'ResizeJpgPage',
    title: 'Resize JPG',
    subtitle: 'Resize JPEG images to exact pixel dimensions. Lock aspect ratio, set target file size, export as JPEG. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';\nimport { getMimeForSaveFormat, getExtensionForMime, compressCanvasToBlob } from '@/lib/imageUtils';`,
    features: [
      { icon: 'resize', title: 'Pixel-Perfect', desc: 'Set exact width and height in pixels with aspect-ratio lock.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Set JPEG output quality after resizing.' },
      { icon: 'lock', title: '100% Private', desc: 'Canvas-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Resize finishes in milliseconds.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload JPG', desc: 'Select your JPEG image.' },
      { n: '2', title: 'Set Size', desc: 'Enter width and height in pixels.' },
      { n: '3', title: 'Download', desc: 'Download your resized JPEG.' },
    ],
    faqs: [
      { q: 'Will quality be preserved?', a: 'Yes. Bicubic resampling keeps the image sharp.' },
      { q: 'Are files uploaded?', a: 'No. All processing is local.' },
    ],
    seo: 'Resize JPEG images online for free. Set exact pixel dimensions with aspect-ratio lock. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'resize-png',
    component: 'ResizePngPage',
    title: 'Resize PNG',
    subtitle: 'Resize PNG images to exact pixel dimensions while preserving transparency. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';\nimport { getMimeForSaveFormat, getExtensionForMime, compressCanvasToBlob } from '@/lib/imageUtils';`,
    features: [
      { icon: 'resize', title: 'Pixel-Perfect PNG', desc: 'Resize to exact dimensions with transparency preserved.' },
      { icon: 'formats', title: 'Transparency Intact', desc: 'Alpha channel preserved through all resize operations.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas resize finishes immediately.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNG', desc: 'Select your PNG image.' },
      { n: '2', title: 'Set Size', desc: 'Enter target width and height.' },
      { n: '3', title: 'Download', desc: 'Download your resized PNG.' },
    ],
    faqs: [
      { q: 'Is transparency preserved?', a: 'Yes — PNG alpha is fully preserved.' },
      { q: 'Are files uploaded?', a: 'No. All processing is local.' },
    ],
    seo: 'Resize PNG images online for free. Set exact pixel dimensions while preserving transparency. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'resize-webp',
    component: 'ResizeWebpPage',
    title: 'Resize WebP',
    subtitle: 'Resize WebP images to any pixel dimension. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';\nimport { getMimeForSaveFormat, getExtensionForMime, compressCanvasToBlob } from '@/lib/imageUtils';`,
    features: [
      { icon: 'resize', title: 'WebP Resize', desc: 'Resize WebP images while keeping the efficient WebP format.' },
      { icon: 'quality', title: 'Quality Control', desc: 'Adjust output quality for lossy WebP compression.' },
      { icon: 'lock', title: '100% Private', desc: 'All processing is browser-based.' },
      { icon: 'lightning', title: 'Instant', desc: 'Fast canvas resize.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload WebP', desc: 'Select your WebP file.' },
      { n: '2', title: 'Set Size', desc: 'Enter target dimensions.' },
      { n: '3', title: 'Download', desc: 'Download your resized WebP.' },
    ],
    faqs: [
      { q: 'Can I keep WebP format after resizing?', a: 'Yes — the output can be saved as WebP with quality control.' },
      { q: 'Are files uploaded?', a: 'No. Everything is local.' },
    ],
    seo: 'Resize WebP images online for free. Set exact pixel dimensions and export as WebP, JPEG, or PNG. Browser-based, no uploads.',
  },
  {
    dir: 'crop-jpg',
    component: 'CropJpgPage',
    title: 'Crop JPG',
    subtitle: 'Crop JPEG images to any region or preset aspect ratio. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'crop', title: 'Freeform Crop', desc: 'Select any rectangular region of your JPEG to crop.' },
      { icon: 'ratios', title: 'Preset Ratios', desc: 'Crop to 1:1, 16:9, 4:3 and other common aspect ratios.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas crop finishes immediately.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload JPG', desc: 'Select your JPEG image.' },
      { n: '2', title: 'Select Region', desc: 'Drag to select the crop area.' },
      { n: '3', title: 'Download', desc: 'Download your cropped JPEG.' },
    ],
    faqs: [
      { q: 'Can I crop to an exact pixel size?', a: 'Yes — enter precise crop coordinates or use the drag handles.' },
      { q: 'Are files uploaded?', a: 'No. Everything is browser-based.' },
    ],
    seo: 'Crop JPEG images online for free. Select any region or preset aspect ratio and export as JPEG. Browser-based, no uploads, instant results.',
  },
  {
    dir: 'crop-png',
    component: 'CropPngPage',
    title: 'Crop PNG',
    subtitle: 'Crop PNG images to any region while preserving transparency. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'crop', title: 'Freeform Crop', desc: 'Select any rectangular region of your PNG.' },
      { icon: 'formats', title: 'Transparency Preserved', desc: 'Alpha channel is maintained in the cropped output.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based, nothing uploaded.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload PNG', desc: 'Select your PNG image.' },
      { n: '2', title: 'Select Crop', desc: 'Draw the crop region.' },
      { n: '3', title: 'Download', desc: 'Download your cropped PNG.' },
    ],
    faqs: [
      { q: 'Is transparency preserved?', a: 'Yes — PNG alpha is kept in the cropped output.' },
      { q: 'Are files uploaded?', a: 'No. All local.' },
    ],
    seo: 'Crop PNG images online for free. Trim PNG to any region while preserving transparency. Browser-based, no uploads.',
  },
  {
    dir: 'crop-webp',
    component: 'CropWebpPage',
    title: 'Crop WebP',
    subtitle: 'Crop WebP images to any region. Free, browser-based, no upload required.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'crop', title: 'Freeform Crop', desc: 'Select any region of your WebP image to crop.' },
      { icon: 'lock', title: '100% Private', desc: 'Browser-based, nothing uploaded.' },
      { icon: 'lightning', title: 'Instant', desc: 'Canvas crop completes immediately.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark.' },
    ],
    steps: [
      { n: '1', title: 'Upload WebP', desc: 'Select your WebP file.' },
      { n: '2', title: 'Select Crop', desc: 'Draw the crop region.' },
      { n: '3', title: 'Download', desc: 'Download your cropped WebP.' },
    ],
    faqs: [
      { q: 'Can I export as a different format?', a: 'Yes — choose JPEG, PNG, or WebP as output.' },
      { q: 'Are files uploaded?', a: 'No. All local.' },
    ],
    seo: 'Crop WebP images online for free. Trim WebP to any region and export as WebP, JPEG, or PNG. Browser-based, no uploads.',
  },
  {
    dir: 'collage',
    component: 'CollagePage',
    title: 'Photo Collage Maker',
    subtitle: 'Create beautiful photo collages from multiple images. Choose grid layouts and download as JPEG or PNG. Free, browser-based.',
    import: `import UploadBox from '@/components/UploadBox';\nimport { saveAs } from 'file-saver';\nimport { saveHistory } from '@/lib/storage';`,
    features: [
      { icon: 'collage', title: 'Grid Layouts', desc: 'Choose from multiple grid templates — 2x1, 2x2, 3x1, and more.' },
      { icon: 'resize', title: 'Custom Size', desc: 'Set the output canvas size in pixels.' },
      { icon: 'lock', title: '100% Private', desc: 'All collage creation happens in your browser.' },
      { icon: 'lightning', title: 'Instant Preview', desc: 'See your collage update in real time.' },
      { icon: 'formats', title: 'JPEG & PNG', desc: 'Export your collage in your preferred format.' },
      { icon: 'free', title: 'Free Forever', desc: 'No account, no watermark, no limits.' },
    ],
    steps: [
      { n: '1', title: 'Upload Photos', desc: 'Select multiple images for your collage.' },
      { n: '2', title: 'Choose Layout', desc: 'Pick a grid layout template.' },
      { n: '3', title: 'Download', desc: 'Download your finished collage.' },
    ],
    faqs: [
      { q: 'How many photos can I add?', a: 'Up to the number of cells in your chosen grid layout.' },
      { q: 'What output size can I use?', a: 'You can set a custom canvas size before generating.' },
      { q: 'Are files uploaded?', a: 'No. All rendering happens in your browser.' },
    ],
    seo: 'Create photo collages online for free. Combine multiple images into grid layouts and export as JPEG or PNG. Browser-based, no uploads, instant results.',
  },
];

/* ─── Icon map ───────────────────────────────────────────────────────────── */
const icons = {
  resize: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
  percent: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M16 8L8 16"/></svg>`,
  lock: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  lightning: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  formats: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  free: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  compress: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
  quality: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  rotate: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a10 10 0 1010 10"/><path d="M22 2l-2 4-4-2"/></svg>`,
  preview: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`,
  flip: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 3v18"/></svg>`,
  crop: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/></svg>`,
  ratios: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>`,
  convert: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3l4 4-4 4M16 21l-4-4 4-4"/><path d="M12 7H5a2 2 0 00-2 2v2M12 17h7a2 2 0 002-2v-2"/></svg>`,
  bulk: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>`,
  vector: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  pdf: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2a1 1 0 010 2H8zm0 3h2a1 1 0 010 2H8z"/></svg>`,
  reorder: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  collage: `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
};

/* ─── Generate page content ──────────────────────────────────────────────── */
function genFeatureArray(features) {
  return features.map(f => {
    const svg = icons[f.icon] || icons.formats;
    return `    { icon: (${svg}), title: '${f.title}', desc: '${f.desc}' }`;
  }).join(',\n');
}

function genStepArray(steps) {
  return steps.map(s => `    { n: '${s.n}', title: '${s.title}', desc: '${s.desc}' }`).join(',\n');
}

function genFaqArray(faqs) {
  return faqs.map(f => `    { q: '${f.q.replace(/'/g,"\\'")}', a: '${f.a.replace(/'/g,"\\'")}' }`).join(',\n');
}

function generatePage(tool) {
  const existing = path.join(APP_DIR, tool.dir, 'page.js');
  
  // Read existing page for the functional tool content (preserve the actual tool logic)
  let existingContent = '';
  try { existingContent = fs.readFileSync(existing, 'utf8'); } catch(_) {}
  
  // Extract the functional JSX from the existing page (between the return statement of the component)
  // We'll keep the existing tool logic but wrap it in the new shell
  
  const newContent = `"use client";

import React from 'react';
import ToolPageShell from '@/components/ToolPageShell';
import UploadBox from '@/components/UploadBox';
import { useToolState } from './useToolState';

// NOTE: This page wraps the existing tool UI in the premium ToolPageShell layout.
// The actual tool logic remains in the original component.

const features = [
${genFeatureArray(tool.features)}
];

const steps = [
${genStepArray(tool.steps)}
];

const faqs = [
${genFaqArray(tool.faqs)}
];

export { features, steps, faqs };
`;

  // Instead of replacing the whole page, inject the ToolPageShell wrapper
  // We do a targeted inject to preserve tool logic
  const shellImport = `import ToolPageShell from '@/components/ToolPageShell';\n`;
  
  if (!existingContent) return;
  
  // Check if already updated
  if (existingContent.includes('ToolPageShell')) {
    console.log(`  ⏭  ${tool.dir} — already updated`);
    return;
  }
  
  // Inject import after the last import line
  const lastImportIdx = [...existingContent.matchAll(/^import .+$/gm)].reduce((last, m) => Math.max(last, m.index + m[0].length), 0);
  
  let updated = existingContent.slice(0, lastImportIdx) + '\n' + shellImport + existingContent.slice(lastImportIdx);
  
  // Now wrap the return value in the main component with ToolPageShell
  // Find the main return statement and wrap its content
  // Strategy: find "return (" at root level and wrap with ToolPageShell
  
  const featuresDef = `
const _FEATURES = [
${genFeatureArray(tool.features)}
];

const _STEPS = [
${genStepArray(tool.steps)}
];

const _FAQS = [
${genFaqArray(tool.faqs)}
];

`;

  // Add features/steps/faqs defs before the default export
  const exportIdx = updated.indexOf('export default function');
  if (exportIdx === -1) {
    console.log(`  ⚠  ${tool.dir} — no default export found, skipping`);
    return;
  }
  
  updated = updated.slice(0, exportIdx) + featuresDef + updated.slice(exportIdx);
  
  // Find the return statement inside the component and wrap it
  // We need to wrap the top-level <div> inside the return with ToolPageShell
  // Find: return (\n    <div className="bg-lightbg...
  // Replace with: return (<ToolPageShell title="..." ...>...existing workspace JSX...</ToolPageShell>)
  
  // More targeted: find the outer wrapper div and replace it
  const returnMatch = updated.match(/return\s*\(\s*\n\s*<div[^>]*className="[^"]*bg-lightbg[^"]*"[^>]*>/);
  
  if (returnMatch) {
    const insertPos = returnMatch.index;
    const beforeReturn = updated.slice(0, insertPos);
    const afterReturn = updated.slice(insertPos);
    
    // Replace the outer div wrapper with ToolPageShell
    // Find the matching closing div
    // For simplicity, inject a wrapper comment and change the class
    updated = beforeReturn + 
      `return (\n    <ToolPageShell\n      title="${tool.title}"\n      subtitle="${tool.subtitle}"\n      features={_FEATURES}\n      steps={_STEPS}\n      faqs={_FAQS}\n      seoText="${tool.seo.slice(0, 200)}"\n    >\n` +
      afterReturn;
    
    // Find the matching last closing div before the final ); and replace it  
    const lastClosingDiv = updated.lastIndexOf('    </div>\n  );\n}');
    if (lastClosingDiv !== -1) {
      updated = updated.slice(0, lastClosingDiv) + '    </ToolPageShell>\n  );\n}' + updated.slice(lastClosingDiv + '    </div>\n  );\n}'.length);
    }
  } else {
    console.log(`  ⚠  ${tool.dir} — return pattern not found, skipping`);
    return;
  }
  
  fs.writeFileSync(existing, updated, 'utf8');
  console.log(`  ✅  ${tool.dir} — updated`);
}

/* ─── Run ────────────────────────────────────────────────────────────────── */
console.log('🔄 Updating tool pages to use ToolPageShell...\n');
tools.forEach(tool => {
  try {
    generatePage(tool);
  } catch(e) {
    console.log(`  ❌  ${tool.dir} — error: ${e.message}`);
  }
});
console.log('\n✅ Done!');
