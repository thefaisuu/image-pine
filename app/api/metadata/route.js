import { NextResponse } from 'next/server';
import ExifReader from 'exifreader';

// Helper to format file sizes
const formatSize = (b) => {
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + ' MB';
  return (b / 1024).toFixed(1) + ' KB';
};

// ── AI Metadata Parsers & Detectors ──────────────────────────────────────────
const parseStableDiffusionParameters = (paramString) => {
  if (!paramString || typeof paramString !== 'string') return null;
  const lines = paramString.split('\n');
  if (lines.length === 0) return null;

  let prompt = '';
  let negativePrompt = '';
  let otherParamsStr = '';
  let inNegativePrompt = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Negative prompt:')) {
      negativePrompt = line.substring('Negative prompt:'.length).trim();
      inNegativePrompt = true;
    } else if (line.match(/^(Steps:|Seed:|CFG scale:|Sampler:)/i)) {
      otherParamsStr = line;
      inNegativePrompt = false;
    } else {
      if (inNegativePrompt) {
        negativePrompt += '\n' + line;
      } else if (otherParamsStr) {
        otherParamsStr += ' ' + line;
      } else {
        if (prompt) prompt += '\n' + line;
        else prompt = line;
      }
    }
  }

  const result = {
    prompt: prompt.trim(),
    negativePrompt: negativePrompt.trim(),
  };

  const parts = otherParamsStr.split(',');
  parts.forEach(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx > -1) {
      const key = part.substring(0, colonIdx).trim().toLowerCase();
      const value = part.substring(colonIdx + 1).trim();
      if (key === 'steps') result.steps = value;
      else if (key === 'seed') result.seed = value;
      else if (key === 'cfg scale') result.cfgScale = value;
      else if (key === 'sampler') result.sampler = value;
      else if (key === 'model') result.model = value;
    }
  });

  return result;
};

const parseComfyUiPrompt = (promptJsonStr) => {
  try {
    const promptObj = JSON.parse(promptJsonStr);
    let prompt = '';
    let negativePrompt = '';
    let seed = '';
    let sampler = '';
    let steps = '';
    let model = '';

    for (const key in promptObj) {
      const node = promptObj[key];
      if (node.class_type === 'CLIPTextEncode') {
        const text = node.inputs?.text;
        if (text && typeof text === 'string') {
          if (text.toLowerCase().includes('bad') || text.toLowerCase().includes('ugly') || text.toLowerCase().includes('blurry')) {
            negativePrompt = text;
          } else {
            prompt = text;
          }
        }
      } else if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
        if (node.inputs?.seed !== undefined) seed = String(node.inputs.seed);
        if (node.inputs?.sampler_name !== undefined) sampler = String(node.inputs.sampler_name);
        if (node.inputs?.steps !== undefined) steps = String(node.inputs.steps);
      } else if (node.class_type === 'CheckpointLoaderSimple' || node.class_type === 'CheckpointLoader') {
        if (node.inputs?.ckpt_name !== undefined) model = String(node.inputs.ckpt_name);
      }
    }

    return {
      generator: 'ComfyUI',
      prompt: prompt || null,
      negativePrompt: negativePrompt || null,
      seed: seed || null,
      sampler: sampler || null,
      steps: steps || null,
      model: model || null
    };
  } catch (e) {
    return null;
  }
};

const getTagValue = (tag) => {
  if (!tag) return null;
  if (tag.description !== undefined) return tag.description;
  if (tag.value !== undefined) return tag.value;
  return null;
};

const detectAiMetadata = (tags) => {
  let generator = null;
  let prompt = null;
  let negativePrompt = null;
  let model = null;
  let seed = null;
  let sampler = null;
  let steps = null;
  let cfgScale = null;
  let workflow = null;

  // 1. Stable Diffusion / Automatic1111 Parameters (stored in PNG tEXt chunks or EXIF UserComment)
  const parametersRaw = getTagValue(tags['Parameters']) || getTagValue(tags['parameters']) || getTagValue(tags['UserComment']);
  if (parametersRaw && typeof parametersRaw === 'string' && parametersRaw.includes('Steps:')) {
    const parsed = parseStableDiffusionParameters(parametersRaw);
    if (parsed) {
      generator = 'Stable Diffusion (Automatic1111)';
      prompt = parsed.prompt;
      negativePrompt = parsed.negativePrompt;
      model = parsed.model;
      seed = parsed.seed;
      sampler = parsed.sampler;
      steps = parsed.steps;
      cfgScale = parsed.cfgScale;
    }
  }

  // 2. ComfyUI JSON metadata
  const comfyPromptRaw = getTagValue(tags['prompt']) || getTagValue(tags['Prompt']);
  const comfyWorkflowRaw = getTagValue(tags['workflow']) || getTagValue(tags['Workflow']);
  if (!generator && comfyPromptRaw && typeof comfyPromptRaw === 'string' && comfyPromptRaw.trim().startsWith('{')) {
    const parsed = parseComfyUiPrompt(comfyPromptRaw);
    if (parsed) {
      generator = 'ComfyUI';
      if (parsed.prompt) prompt = parsed.prompt;
      if (parsed.negativePrompt) negativePrompt = parsed.negativePrompt;
      if (parsed.model) model = parsed.model;
      if (parsed.seed) seed = parsed.seed;
      if (parsed.sampler) sampler = parsed.sampler;
      if (parsed.steps) steps = parsed.steps;
      if (comfyWorkflowRaw) workflow = comfyWorkflowRaw;
    }
  }

  // 3. Known AI software signatures
  const software = String(getTagValue(tags['Software']) || getTagValue(tags['CreatorTool']) || getTagValue(tags['Creator']) || '').trim();
  if (software && !generator) {
    const sw = software.toLowerCase();
    if (sw.includes('adobe firefly') || sw.includes('firefly')) generator = 'Adobe Firefly';
    else if (sw.includes('midjourney')) generator = 'Midjourney';
    else if (sw.includes('dall-e') || sw.includes('dalle')) generator = 'DALL-E';
    else if (sw.includes('fooocus')) generator = 'Fooocus';
    else if (sw.includes('invokeai') || sw.includes('invoke')) generator = 'InvokeAI';
    else if (sw.includes('imagen') || sw.includes('google')) generator = 'Google AI (Imagen)';
    else if (sw.includes('stable diffusion') || sw.includes('stablediffusion')) generator = 'Stable Diffusion';
    else if (sw.includes('comfyui')) generator = 'ComfyUI';
  }

  // 4. Fallback prompts from description fields
  if (!prompt) {
    const desc = String(getTagValue(tags['ImageDescription']) || getTagValue(tags['Description']) || '');
    if (desc.includes('/imagine') || desc.includes('prompt:')) {
      prompt = desc;
      if (!generator) generator = 'Midjourney';
    }
  }

  return generator ? { generator, prompt, negativePrompt, model, seed, sampler, steps, cfgScale, workflow } : null;
};

// ── Metadata Normalizer ──────────────────────────────────────────────────────
const normalizeMetadata = (tags, fileSize, fileType) => {
  const categories = {
    basic: { title: 'Basic Information', fields: [] },
    camera: { title: 'Camera Information', fields: [] },
    location: { title: 'Location', fields: [] },
    copyright: { title: 'Copyright & Ownership', fields: [] },
    ai: { title: 'AI Generation Data', fields: [] },
    c2pa: { title: 'Content Credentials (C2PA)', fields: [] }
  };

  const addField = (cat, name, value) => {
    const v = value !== null && value !== undefined ? String(value).trim() : '';
    if (v && v !== 'undefined' && v !== 'null') {
      categories[cat].fields.push({ name, value: v });
    }
  };

  const gv = (key) => {
    const t = tags[key];
    if (!t) return null;
    if (t.description !== undefined && t.description !== null) return String(t.description);
    if (t.value !== undefined && t.value !== null) return String(t.value);
    return null;
  };

  // 1. Basic Information
  const width = gv('Image Width') || gv('PixelXDimension') || gv('ImageWidth');
  const height = gv('Image Height') || gv('PixelYDimension') || gv('ImageHeight');
  addField('basic', 'Width', width ? `${width} px` : null);
  addField('basic', 'Height', height ? `${height} px` : null);
  addField('basic', 'Format', fileType || gv('FileType'));
  addField('basic', 'File Size', fileSize ? formatSize(fileSize) : null);
  addField('basic', 'Color Space', gv('ColorSpace') || gv('ColorSpaceData'));
  addField('basic', 'Bit Depth', gv('BitsPerSample') || gv('BitDepth') ? `${gv('BitsPerSample') || gv('BitDepth')} bits` : null);
  const xRes = gv('XResolution');
  const yRes = gv('YResolution');
  if (xRes && yRes) addField('basic', 'DPI', `${xRes} × ${yRes} dpi`);
  else if (xRes) addField('basic', 'DPI', `${xRes} dpi`);
  addField('basic', 'Date Created', gv('DateTimeOriginal') || gv('DateTime') || gv('CreateDate'));
  addField('basic', 'Orientation', gv('Orientation'));

  // 2. Camera Information
  addField('camera', 'Camera Make', gv('Make'));
  addField('camera', 'Camera Model', gv('Model'));
  addField('camera', 'Lens', gv('LensModel') || gv('Lens') || gv('LensInfo'));
  addField('camera', 'ISO', gv('ISOSpeedRatings') || gv('ISO'));
  const fnum = gv('FNumber') || gv('Aperture');
  addField('camera', 'Aperture', fnum ? (fnum.startsWith('f') ? fnum : `f/${fnum}`) : null);
  addField('camera', 'Exposure Time', gv('ExposureTime') || gv('ShutterSpeedValue'));
  addField('camera', 'Focal Length', gv('FocalLength'));
  addField('camera', 'Flash', gv('Flash'));
  addField('camera', 'White Balance', gv('WhiteBalance'));
  addField('camera', 'Exposure Mode', gv('ExposureMode'));
  addField('camera', 'Metering Mode', gv('MeteringMode'));
  addField('camera', 'Scene Type', gv('SceneCaptureType'));

  // 3. Location
  const lat = gv('GPSLatitude');
  const lon = gv('GPSLongitude');
  if (lat && lon) addField('location', 'GPS Coordinates', `${lat}, ${lon}`);
  addField('location', 'GPS Altitude', gv('GPSAltitude'));
  addField('location', 'GPS Speed', gv('GPSSpeed'));
  addField('location', 'GPS Timestamp', gv('GPSDateStamp') || gv('GPSDateTime'));

  // 4. Copyright & Ownership
  addField('copyright', 'Author', gv('Artist') || gv('By-line') || gv('Creator') || gv('Author'));
  addField('copyright', 'Software', gv('Software') || gv('CreatorTool'));
  addField('copyright', 'Copyright', gv('Copyright') || gv('CopyrightNotice') || gv('Rights'));
  addField('copyright', 'Credit', gv('Credit'));
  addField('copyright', 'Source', gv('Source'));
  addField('copyright', 'Description', gv('ImageDescription') || gv('Description') || gv('Caption/Abstract'));
  const kw = gv('Keywords') || gv('Subject');
  addField('copyright', 'Keywords', kw);

  // 5. AI Generation Data
  const aiData = detectAiMetadata(tags);
  if (aiData) {
    addField('ai', 'Generator', aiData.generator);
    addField('ai', 'Prompt', aiData.prompt);
    addField('ai', 'Negative Prompt', aiData.negativePrompt);
    addField('ai', 'Model', aiData.model);
    addField('ai', 'Seed', aiData.seed);
    addField('ai', 'Sampler', aiData.sampler);
    addField('ai', 'Steps', aiData.steps);
    addField('ai', 'CFG Scale', aiData.cfgScale);
    if (aiData.workflow) addField('ai', 'Workflow', '[Embedded ComfyUI Workflow]');
  }

  // 6. C2PA (detected via XMP or special tags)
  const c2paPresent = !!(gv('dc:provenance') || gv('c2pa:manifest') || gv('ClaimGenerator'));
  addField('c2pa', 'Present', c2paPresent ? 'Yes' : 'No');
  addField('c2pa', 'Claim Generator', gv('ClaimGenerator'));

  // ── Provenance Banner ──
  let provenance = {
    title: 'No AI Metadata Found',
    subtitle: 'No artificial intelligence signatures or credentials detected.',
    type: 'none'
  };

  if (c2paPresent) {
    provenance = {
      title: 'Content Credentials Verified',
      subtitle: 'Secure C2PA provenance manifest found.',
      type: 'verified'
    };
  } else if (aiData) {
    provenance = {
      title: 'AI Metadata Found',
      subtitle: `Generator: ${aiData.generator}`,
      type: 'ai-metadata'
    };
  }

  // ── Raw Metadata Dump ──
  const rawMetadataList = [];
  for (const key in tags) {
    try {
      const tag = tags[key];
      if (!tag || typeof tag === 'function') continue;
      const val = tag.description !== undefined ? tag.description : tag.value;
      if (val !== undefined && val !== null) {
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (strVal.length < 2000) { // skip huge binary blobs
          rawMetadataList.push({ name: key, value: strVal });
        }
      }
    } catch (_) { /* skip unparseable tags */ }
  }

  // ── Segment Detection ──
  const hasMake = !!(gv('Make') || gv('Model'));
  const hasGpsLat = !!gv('GPSLatitude');
  const hasXmp = !!(gv('CreatorTool') || gv('Software') || gv('HistoryAction') || gv('parametersRaw'));
  const hasIptc = !!(gv('By-line') || gv('Credit') || gv('CopyrightNotice') || gv('Caption/Abstract'));
  const hasComments = !!(gv('UserComment') || gv('Comment'));
  const hasIcc = !!(gv('ColorSpace') || gv('ProfileDescription'));

  return {
    provenance,
    categories,
    raw: rawMetadataList,
    width: parseInt(width) || 0,
    height: parseInt(height) || 0,
    hasExif: hasMake,
    gps: hasGpsLat ? `${gv('GPSLatitude')}, ${gv('GPSLongitude')}` : null,
    gpsDms: gv('GPSPosition') || (hasGpsLat ? `${gv('GPSLatitude')}, ${gv('GPSLongitude')}` : null),
    detectedSegments: {
      exif: hasMake,
      xmp: hasXmp,
      iptc: hasIptc,
      comments: hasComments,
      icc: hasIcc,
      otherApp: c2paPresent ? ['C2PA'] : []
    }
  };
};

// ── Pure JS Lossless JPEG Metadata Stripper ──────────────────────────────────
const stripJpegMetadata = (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0, false) !== 0xFFD8) {
    throw new Error('Not a valid JPEG image');
  }

  let offset = 2;
  const length = view.byteLength;
  const segments = [new Uint8Array(arrayBuffer, 0, 2)]; // SOI

  while (offset < length) {
    if (offset + 4 > length) {
      segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
      break;
    }

    const marker = view.getUint16(offset, false);
    if (marker === 0xFFDA) { // SOS - Start of Scan (pixel data)
      segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
      break;
    }
    if (marker === 0xFFD9) { // EOI
      segments.push(new Uint8Array(arrayBuffer, offset, 2));
      break;
    }
    if ((marker & 0xFF00) !== 0xFF00) {
      offset++;
      continue;
    }

    const segLen = view.getUint16(offset + 2, false) + 2;
    if (offset + segLen > length) {
      segments.push(new Uint8Array(arrayBuffer, offset, length - offset));
      break;
    }

    // Keep: APP0 (JFIF), APP2 (ICC), APP14 (Adobe), DQT, SOF*, DHT, DRI
    const keep =
      marker === 0xFFE0 || // APP0 JFIF
      marker === 0xFFE2 || // APP2 ICC profile
      marker === 0xFFEE || // APP14 Adobe
      marker === 0xFFDB || // DQT quantization table
      marker === 0xFFC4 || // DHT huffman table
      marker === 0xFFDD || // DRI restart interval
      (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4 && marker !== 0xFFC8); // SOF frames

    if (keep) segments.push(new Uint8Array(arrayBuffer, offset, segLen));
    offset += segLen;
  }

  let totalSize = 0;
  segments.forEach(s => totalSize += s.byteLength);
  const result = new Uint8Array(totalSize);
  let cur = 0;
  segments.forEach(s => { result.set(s, cur); cur += s.byteLength; });
  return result.buffer;
};

// ── Pure JS Lossless PNG Metadata Stripper ────────────────────────────────────
const stripPngMetadata = (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 8 || view.getUint32(0, false) !== 0x89504E47 || view.getUint32(4, false) !== 0x0D0A1A0A) {
    throw new Error('Not a valid PNG image');
  }

  let offset = 8;
  const length = view.byteLength;
  const segments = [new Uint8Array(arrayBuffer, 0, 8)]; // PNG signature

  while (offset < length) {
    if (offset + 8 > length) break;
    const chunkLength = view.getUint32(offset, false);
    const chunkType = String.fromCharCode(
      view.getUint8(offset + 4), view.getUint8(offset + 5),
      view.getUint8(offset + 6), view.getUint8(offset + 7)
    );
    const totalChunkLen = 12 + chunkLength;
    if (offset + totalChunkLen > length) break;

    const essential = ['IHDR', 'PLTE', 'IDAT', 'IEND', 'iCCP', 'gAMA', 'cHRM', 'sRGB', 'pHYs', 'sBIT', 'tRNS'];
    if (essential.includes(chunkType)) {
      segments.push(new Uint8Array(arrayBuffer, offset, totalChunkLen));
    }

    offset += totalChunkLen;
    if (chunkType === 'IEND') break;
  }

  let totalSize = 0;
  segments.forEach(s => totalSize += s.byteLength);
  const result = new Uint8Array(totalSize);
  let cur = 0;
  segments.forEach(s => { result.set(s, cur); cur += s.byteLength; });
  return result.buffer;
};

// ── HTTP API POST Handler ─────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const action = formData.get('action') || 'extract';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (action === 'strip') {
      // Lossless metadata stripping
      const mimeType = file.type || '';
      const fileName = file.name || '';
      let strippedBuffer;

      try {
        if (mimeType === 'image/png' || fileName.toLowerCase().endsWith('.png')) {
          strippedBuffer = Buffer.from(stripPngMetadata(arrayBuffer));
        } else {
          // Default: JPEG stripping (also safe for WebP/TIFF partial support)
          strippedBuffer = Buffer.from(stripJpegMetadata(arrayBuffer));
        }
      } catch (stripErr) {
        // If stripping fails (e.g. unsupported format), return original file
        console.warn('Strip failed, returning original:', stripErr.message);
        strippedBuffer = buffer;
      }

      const nameParts = fileName.split('.');
      const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
      const baseName = nameParts.join('.');

      return new Response(strippedBuffer, {
        headers: {
          'Content-Type': mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${baseName}_cleaned.${ext}"`
        }
      });
    }

    // ── Extract metadata using ExifReader ──
    const tags = await ExifReader.load(buffer, { expanded: true });

    // Flatten the expanded object for easier access
    const flatTags = {};
    if (tags) {
      for (const group in tags) {
        const groupTags = tags[group];
        if (groupTags && typeof groupTags === 'object') {
          for (const tagName in groupTags) {
            // Later groups override earlier for same key name
            flatTags[tagName] = groupTags[tagName];
          }
        }
      }
    }

    const normalized = normalizeMetadata(flatTags, file.size, file.type || file.name?.split('.').pop()?.toUpperCase());
    return NextResponse.json(normalized);

  } catch (err) {
    console.error('API Metadata route error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file metadata' }, { status: 500 });
  }
}
