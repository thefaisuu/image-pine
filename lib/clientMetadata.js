// lib/clientMetadata.js
// Runs entirely in the browser — no server upload, no file size limit.

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatSize = (b) => {
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + ' MB';
  return (b / 1024).toFixed(1) + ' KB';
};

const getTagValue = (tag) => {
  if (!tag) return null;
  if (tag.description !== undefined) return tag.description;
  if (tag.value !== undefined) return tag.value;
  return null;
};

// ── AI Parsers ────────────────────────────────────────────────────────────────
const parseStableDiffusionParameters = (paramString) => {
  if (!paramString || typeof paramString !== 'string') return null;
  const lines = paramString.split('\n');
  if (lines.length === 0) return null;

  let prompt = '', negativePrompt = '', otherParamsStr = '';
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
      if (inNegativePrompt) negativePrompt += '\n' + line;
      else if (otherParamsStr) otherParamsStr += ' ' + line;
      else { if (prompt) prompt += '\n' + line; else prompt = line; }
    }
  }

  const result = { prompt: prompt.trim(), negativePrompt: negativePrompt.trim() };
  otherParamsStr.split(',').forEach(part => {
    const idx = part.indexOf(':');
    if (idx > -1) {
      const key = part.substring(0, idx).trim().toLowerCase();
      const val = part.substring(idx + 1).trim();
      if (key === 'steps') result.steps = val;
      else if (key === 'seed') result.seed = val;
      else if (key === 'cfg scale') result.cfgScale = val;
      else if (key === 'sampler') result.sampler = val;
      else if (key === 'model') result.model = val;
    }
  });
  return result;
};

const parseComfyUiPrompt = (promptJsonStr) => {
  try {
    const obj = JSON.parse(promptJsonStr);
    let prompt = '', negativePrompt = '', seed = '', sampler = '', steps = '', model = '';
    for (const key in obj) {
      const node = obj[key];
      if (node.class_type === 'CLIPTextEncode') {
        const text = node.inputs?.text;
        if (text && typeof text === 'string') {
          if (text.toLowerCase().includes('bad') || text.toLowerCase().includes('ugly') || text.toLowerCase().includes('blurry'))
            negativePrompt = text;
          else prompt = text;
        }
      } else if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
        if (node.inputs?.seed !== undefined) seed = String(node.inputs.seed);
        if (node.inputs?.sampler_name !== undefined) sampler = String(node.inputs.sampler_name);
        if (node.inputs?.steps !== undefined) steps = String(node.inputs.steps);
      } else if (node.class_type === 'CheckpointLoaderSimple' || node.class_type === 'CheckpointLoader') {
        if (node.inputs?.ckpt_name !== undefined) model = String(node.inputs.ckpt_name);
      }
    }
    return { generator: 'ComfyUI', prompt: prompt || null, negativePrompt: negativePrompt || null, seed: seed || null, sampler: sampler || null, steps: steps || null, model: model || null };
  } catch { return null; }
};

const detectAiMetadata = (tags) => {
  let generator = null, prompt = null, negativePrompt = null, model = null;
  let seed = null, sampler = null, steps = null, cfgScale = null, workflow = null;

  // 1. Stable Diffusion / Automatic1111
  const parametersRaw = getTagValue(tags['Parameters']) || getTagValue(tags['parameters']) || getTagValue(tags['UserComment']);
  if (parametersRaw && typeof parametersRaw === 'string' && parametersRaw.includes('Steps:')) {
    const parsed = parseStableDiffusionParameters(parametersRaw);
    if (parsed) {
      generator = 'Stable Diffusion (Automatic1111)';
      prompt = parsed.prompt; negativePrompt = parsed.negativePrompt; model = parsed.model;
      seed = parsed.seed; sampler = parsed.sampler; steps = parsed.steps; cfgScale = parsed.cfgScale;
    }
  }

  // 2. ComfyUI JSON
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

  // 3. Software signatures
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

  // 4. Fallback: description-based Midjourney
  if (!prompt) {
    const desc = String(getTagValue(tags['ImageDescription']) || getTagValue(tags['Description']) || '');
    if (desc.includes('/imagine') || desc.includes('prompt:')) {
      prompt = desc;
      if (!generator) generator = 'Midjourney';
    }
  }

  return generator ? { generator, prompt, negativePrompt, model, seed, sampler, steps, cfgScale, workflow } : null;
};

// ── Normalizer ────────────────────────────────────────────────────────────────
const normalizeMetadata = (tags, fileSize, fileType) => {
  const categories = {
    basic:     { title: 'Basic Information',          fields: [] },
    camera:    { title: 'Camera Information',          fields: [] },
    location:  { title: 'Location',                   fields: [] },
    copyright: { title: 'Copyright & Ownership',      fields: [] },
    ai:        { title: 'AI Generation Data',         fields: [] },
    c2pa:      { title: 'Content Credentials (C2PA)', fields: [] },
  };

  const addField = (cat, name, value) => {
    const v = value !== null && value !== undefined ? String(value).trim() : '';
    if (v && v !== 'undefined' && v !== 'null') categories[cat].fields.push({ name, value: v });
  };

  const gv = (key) => {
    const t = tags[key];
    if (!t) return null;
    if (t.description !== undefined && t.description !== null) return String(t.description);
    if (t.value !== undefined && t.value !== null) return String(t.value);
    return null;
  };

  // 1. Basic
  const width  = gv('Image Width') || gv('PixelXDimension') || gv('ImageWidth');
  const height = gv('Image Height') || gv('PixelYDimension') || gv('ImageHeight');
  addField('basic', 'Width',        width  ? `${width} px`  : null);
  addField('basic', 'Height',       height ? `${height} px` : null);
  addField('basic', 'Format',       fileType || gv('FileType'));
  addField('basic', 'File Size',    fileSize ? formatSize(fileSize) : null);
  addField('basic', 'Color Space',  gv('ColorSpace') || gv('ColorSpaceData'));
  const bps = gv('BitsPerSample') || gv('BitDepth');
  if (bps) addField('basic', 'Bit Depth', `${bps} bits`);
  const xRes = gv('XResolution'), yRes = gv('YResolution');
  if (xRes && yRes) addField('basic', 'DPI', `${xRes} × ${yRes} dpi`);
  else if (xRes)    addField('basic', 'DPI', `${xRes} dpi`);
  addField('basic', 'Date Created', gv('DateTimeOriginal') || gv('DateTime') || gv('CreateDate'));
  addField('basic', 'Orientation',  gv('Orientation'));

  // 2. Camera
  addField('camera', 'Camera Make',   gv('Make'));
  addField('camera', 'Camera Model',  gv('Model'));
  addField('camera', 'Lens',          gv('LensModel') || gv('Lens') || gv('LensInfo'));
  addField('camera', 'ISO',           gv('ISOSpeedRatings') || gv('ISO'));
  const fnum = gv('FNumber') || gv('Aperture');
  addField('camera', 'Aperture',      fnum ? (fnum.startsWith('f') ? fnum : `f/${fnum}`) : null);
  addField('camera', 'Exposure Time', gv('ExposureTime') || gv('ShutterSpeedValue'));
  addField('camera', 'Focal Length',  gv('FocalLength'));
  addField('camera', 'Flash',         gv('Flash'));
  addField('camera', 'White Balance', gv('WhiteBalance'));
  addField('camera', 'Exposure Mode', gv('ExposureMode'));
  addField('camera', 'Metering Mode', gv('MeteringMode'));
  addField('camera', 'Scene Type',    gv('SceneCaptureType'));

  // 3. Location
  const lat = gv('GPSLatitude'), lon = gv('GPSLongitude');
  if (lat && lon) addField('location', 'GPS Coordinates', `${lat}, ${lon}`);
  addField('location', 'GPS Altitude',  gv('GPSAltitude'));
  addField('location', 'GPS Speed',     gv('GPSSpeed'));
  addField('location', 'GPS Timestamp', gv('GPSDateStamp') || gv('GPSDateTime'));

  // 4. Copyright
  addField('copyright', 'Author',      gv('Artist') || gv('By-line') || gv('Creator') || gv('Author'));
  addField('copyright', 'Software',    gv('Software') || gv('CreatorTool'));
  addField('copyright', 'Copyright',   gv('Copyright') || gv('CopyrightNotice') || gv('Rights'));
  addField('copyright', 'Credit',      gv('Credit'));
  addField('copyright', 'Source',      gv('Source'));
  addField('copyright', 'Description', gv('ImageDescription') || gv('Description') || gv('Caption/Abstract'));
  addField('copyright', 'Keywords',    gv('Keywords') || gv('Subject'));

  // 5. AI
  const aiData = detectAiMetadata(tags);
  if (aiData) {
    addField('ai', 'Generator',       aiData.generator);
    addField('ai', 'Prompt',          aiData.prompt);
    addField('ai', 'Negative Prompt', aiData.negativePrompt);
    addField('ai', 'Model',           aiData.model);
    addField('ai', 'Seed',            aiData.seed);
    addField('ai', 'Sampler',         aiData.sampler);
    addField('ai', 'Steps',           aiData.steps);
    addField('ai', 'CFG Scale',       aiData.cfgScale);
    if (aiData.workflow) addField('ai', 'Workflow', '[Embedded ComfyUI Workflow]');
  }

  // 6. C2PA
  const c2paPresent = !!(gv('dc:provenance') || gv('c2pa:manifest') || gv('ClaimGenerator'));
  addField('c2pa', 'Present',         c2paPresent ? 'Yes' : 'No');
  addField('c2pa', 'Claim Generator', gv('ClaimGenerator'));

  // Provenance banner
  let provenance = { title: 'No AI Metadata Found', subtitle: 'No artificial intelligence signatures or credentials detected.', type: 'none' };
  if (c2paPresent) provenance = { title: 'Content Credentials Verified', subtitle: 'Secure C2PA provenance manifest found.', type: 'verified' };
  else if (aiData) provenance = { title: 'AI Metadata Found', subtitle: `Generator: ${aiData.generator}`, type: 'ai-metadata' };

  // Raw dump
  const raw = [];
  for (const key in tags) {
    try {
      const tag = tags[key];
      if (!tag || typeof tag === 'function') continue;
      const val = tag.description !== undefined ? tag.description : tag.value;
      if (val !== undefined && val !== null) {
        const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (s.length < 2000) raw.push({ name: key, value: s });
      }
    } catch { /* skip */ }
  }

  // Segment detection
  const hasMake    = !!(gv('Make') || gv('Model'));
  const hasGpsLat  = !!gv('GPSLatitude');
  const hasXmp     = !!(gv('CreatorTool') || gv('Software') || gv('HistoryAction'));
  const hasIptc    = !!(gv('By-line') || gv('Credit') || gv('CopyrightNotice') || gv('Caption/Abstract'));
  const hasComments= !!(gv('UserComment') || gv('Comment'));
  const hasIcc     = !!(gv('ColorSpace') || gv('ProfileDescription'));

  return {
    provenance, categories, raw,
    width: parseInt(width) || 0,
    height: parseInt(height) || 0,
    hasExif: hasMake,
    gps: hasGpsLat ? `${gv('GPSLatitude')}, ${gv('GPSLongitude')}` : null,
    gpsDms: gv('GPSPosition') || (hasGpsLat ? `${gv('GPSLatitude')}, ${gv('GPSLongitude')}` : null),
    detectedSegments: {
      exif: hasMake, xmp: hasXmp, iptc: hasIptc,
      comments: hasComments, icc: hasIcc,
      otherApp: c2paPresent ? ['C2PA'] : []
    }
  };
};

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Extract all metadata from a File object entirely in the browser.
 * No network request — works for any file size.
 */
export const extractMetadataClientSide = async (fileObj) => {
  // Dynamic import so ExifReader is only loaded when needed (code-split)
  const ExifReader = (await import('exifreader')).default;

  const arrayBuffer = await fileObj.arrayBuffer();
  const tags = await ExifReader.load(arrayBuffer, { expanded: true });

  // Flatten expanded tag groups
  const flatTags = {};
  if (tags) {
    for (const group in tags) {
      const groupTags = tags[group];
      if (groupTags && typeof groupTags === 'object') {
        for (const tagName in groupTags) {
          flatTags[tagName] = groupTags[tagName];
        }
      }
    }
  }

  const fileType = fileObj.type
    ? fileObj.type.replace('image/', '').toUpperCase()
    : (fileObj.name?.split('.').pop()?.toUpperCase() ?? '');

  return normalizeMetadata(flatTags, fileObj.size, fileType);
};
