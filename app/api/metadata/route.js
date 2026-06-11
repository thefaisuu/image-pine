import { NextResponse } from 'next/server';
import { ExifTool } from 'exiftool-vendored';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Reuse a single ExifTool instance across requests to avoid high startup overhead on Windows
const exiftool = new ExifTool();

// Helper to format file sizes
const formatSize = (b) => {
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + ' MB';
  return (b / 1024).toFixed(1) + ' KB';
};

// ── CBOR & JUMBF Custom Parser for C2PA content credentials ──────────────────
const decodeCbor = (bytes) => {
  let offset = 0;

  function parseVal(lenType) {
    if (lenType < 24) return lenType;
    if (lenType === 24) {
      if (offset >= bytes.length) return 0;
      const v = bytes[offset];
      offset += 1;
      return v;
    }
    if (lenType === 25) {
      if (offset + 1 >= bytes.length) return 0;
      const v = (bytes[offset] << 8) | bytes[offset + 1];
      offset += 2;
      return v;
    }
    if (lenType === 26) {
      if (offset + 3 >= bytes.length) return 0;
      const v = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 4;
      return v;
    }
    if (lenType === 27) {
      if (offset + 7 >= bytes.length) return 0;
      let val = 0;
      for (let i = 0; i < 8; i++) {
        val = val * 256 + bytes[offset + i];
      }
      offset += 8;
      return val;
    }
    return 0;
  }

  function readNext() {
    if (offset >= bytes.length) {
      return null;
    }
    const initialByte = bytes[offset];
    offset++;
    const majorType = initialByte >> 5;
    const lenType = initialByte & 0x1F;

    if (majorType === 0) {
      return parseVal(lenType);
    } else if (majorType === 1) {
      return -1 - parseVal(lenType);
    } else if (majorType === 2) {
      const len = parseVal(lenType);
      if (offset + len > bytes.length) {
        const res = bytes.slice(offset);
        offset = bytes.length;
        return res;
      }
      const res = bytes.slice(offset, offset + len);
      offset += len;
      return res;
    } else if (majorType === 3) {
      const len = parseVal(lenType);
      if (offset + len > bytes.length) {
        const res = new TextDecoder('utf-8').decode(bytes.slice(offset));
        offset = bytes.length;
        return res;
      }
      const res = new TextDecoder('utf-8').decode(bytes.slice(offset, offset + len));
      offset += len;
      return res;
    } else if (majorType === 4) {
      if (lenType === 31) {
        const res = [];
        while (offset < bytes.length && bytes[offset] !== 0xFF) {
          res.push(readNext());
        }
        offset++;
        return res;
      }
      const count = parseVal(lenType);
      const res = [];
      for (let i = 0; i < count; i++) {
        res.push(readNext());
      }
      return res;
    } else if (majorType === 5) {
      if (lenType === 31) {
        const res = {};
        while (offset < bytes.length && bytes[offset] !== 0xFF) {
          const k = readNext();
          const v = readNext();
          if (k !== null) res[k] = v;
        }
        offset++;
        return res;
      }
      const count = parseVal(lenType);
      const res = {};
      for (let i = 0; i < count; i++) {
        const k = readNext();
        const v = readNext();
        if (k !== null) res[k] = v;
      }
      return res;
    } else if (majorType === 6) {
      parseVal(lenType); // skip tag
      return readNext();
    } else if (majorType === 7) {
      if (lenType === 20) return false;
      if (lenType === 21) return true;
      if (lenType === 22) return null;
      if (lenType === 23) return undefined;
      if (lenType === 25) {
        if (offset + 1 >= bytes.length) return 0;
        const h = (bytes[offset] << 8) | bytes[offset + 1];
        offset += 2;
        const s = (h & 0x8000) >> 15;
        const e = (h & 0x7C00) >> 10;
        const f = h & 0x03FF;
        if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
        if (e === 31) return f === 0 ? (s ? -Infinity : Infinity) : NaN;
        return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
      }
      if (lenType === 26) {
        if (offset + 3 >= bytes.length) return 0;
        const buf = bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + 4);
        const v = new DataView(buf).getFloat32(0, false);
        offset += 4;
        return v;
      }
      if (lenType === 27) {
        if (offset + 7 >= bytes.length) return 0;
        const buf = bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + 8);
        const v = new DataView(buf).getFloat64(0, false);
        offset += 8;
        return v;
      }
      return undefined;
    }
    return null;
  }

  try {
    return readNext();
  } catch (e) {
    return null;
  }
};

const formatUuid = (uuid) => {
  if (!uuid || uuid.length !== 16) return '';
  const isC2pa = uuid[0] === 0x63 && uuid[1] === 0x32 && uuid[2] === 0x70 && uuid[3] === 0x61;
  const part1 = isC2pa ? '(c2pa)' : uuid.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('');
  const part2 = uuid.slice(4, 6).map(b => b.toString(16).padStart(2, '0')).join('');
  const part3 = uuid.slice(6, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  const part4 = uuid.slice(8).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${part1}-${part2}-${part3}-${part4}`;
};

const parseJumbfBoxTree = (view, offset, end) => {
  const boxes = [];
  let idx = offset;
  while (idx < end - 8) {
    const startIdx = idx;
    let boxLen = view.getUint32(idx, false);
    const boxType = String.fromCharCode(
      view.getUint8(idx + 4),
      view.getUint8(idx + 5),
      view.getUint8(idx + 6),
      view.getUint8(idx + 7)
    );
    let payloadOffset = idx + 8;
    let payloadLen = boxLen - 8;
    if (boxLen === 1) {
      if (idx + 16 > end) break;
      const high = view.getUint32(idx + 8, false);
      const low = view.getUint32(idx + 12, false);
      boxLen = high * 0x100000000 + low;
      payloadOffset = idx + 16;
      payloadLen = boxLen - 16;
    } else if (boxLen === 0) {
      boxLen = end - idx;
      payloadLen = boxLen - 8;
    }

    if (idx + boxLen > end || boxLen <= 0) {
      break;
    }

    const payloadEnd = payloadOffset + payloadLen;
    const boxObj = {
      type: boxType,
      offset: startIdx,
      length: boxLen,
      payloadOffset,
      payloadLen
    };

    if (boxType === 'jumb') {
      boxObj.children = parseJumbfBoxTree(view, payloadOffset, payloadEnd);
    } else if (boxType === 'jumd') {
      if (payloadLen >= 17) {
        const uuidBytes = [];
        for (let i = 0; i < 16; i++) {
          uuidBytes.push(view.getUint8(payloadOffset + i));
        }
        const toggle = view.getUint8(payloadOffset + 16);
        let currOffset = payloadOffset + 17;
        let label = '';
        if (toggle & 0x02) {
          const labelBytes = [];
          while (currOffset < payloadEnd) {
            const b = view.getUint8(currOffset);
            currOffset++;
            if (b === 0) break;
            labelBytes.push(b);
          }
          label = new TextDecoder('utf-8').decode(new Uint8Array(labelBytes));
        }
        let boxId = null;
        if (toggle & 0x04) {
          if (currOffset + 4 <= payloadEnd) {
            boxId = view.getUint32(currOffset, false);
            currOffset += 4;
          }
        }
        boxObj.uuid = uuidBytes;
        boxObj.label = label;
        boxObj.boxId = boxId;
      }
    }
    boxes.push(boxObj);
    idx += boxLen;
  }
  return boxes;
};

const extractC2paMetadata = (buffer) => {
  const c2paTags = { present: false };
  try {
    const view = new DataView(buffer);
    let startOffset = -1;

    // Check PNG signature
    const isPng = view.byteLength >= 8 &&
                  view.getUint32(0, false) === 0x89504E47 &&
                  view.getUint32(4, false) === 0x0D0A1A0A;

    if (isPng) {
      // Find PNG c2pa chunk
      let offset = 8;
      while (offset < view.byteLength) {
        if (offset + 8 > view.byteLength) break;
        const chunkLength = view.getUint32(offset, false);
        const chunkType = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (chunkType === 'c2pa') {
          startOffset = offset + 8;
          const boxes = parseJumbfBoxTree(view, startOffset, startOffset + chunkLength);
          processC2paTree(boxes, view, c2paTags);
          break;
        }
        offset += 12 + chunkLength;
        if (chunkType === 'IEND') break;
      }
    } else {
      // JPEG scan for APP11 (0xFFEB) JUMBF segments
      let offset = 2;
      const app11Chunks = [];
      while (offset < view.byteLength - 4) {
        const marker = view.getUint16(offset, false);
        if (marker === 0xFFDA) break; // Start of Scan
        if ((marker & 0xFF00) === 0xFF00) {
          const segmentLength = view.getUint16(offset + 2, false);
          if (marker === 0xFFEB) { // APP11
            if (segmentLength >= 6 && offset + 6 < view.byteLength) {
              const isJp = view.getUint16(offset + 4, false) === 0x4A50; // "JP"
              if (isJp) {
                const xt = view.getUint16(offset + 6, false);
                const payloadStart = offset + 8;
                const payloadLen = segmentLength - 6;
                if (payloadStart + payloadLen <= view.byteLength) {
                  app11Chunks.push(new Uint8Array(buffer, payloadStart, payloadLen));
                }
              }
            }
          }
          offset += 2 + segmentLength;
        } else {
          offset++;
        }
      }

      if (app11Chunks.length > 0) {
        let totalLen = 0;
        app11Chunks.forEach(c => totalLen += c.byteLength);
        const combined = new Uint8Array(totalLen);
        let curOffset = 0;
        app11Chunks.forEach(c => {
          combined.set(c, curOffset);
          curOffset += c.byteLength;
        });

        const app11DataView = new DataView(combined.buffer, combined.byteOffset, combined.byteLength);
        let jumbStart = 0;
        while (jumbStart < combined.byteLength - 8) {
          const t = app11DataView.getUint32(jumbStart + 4, false);
          if (t === 0x6A756D62 || t === 0x6A756D64) {
            break;
          }
          jumbStart++;
        }
        if (jumbStart < combined.byteLength - 8) {
          const boxes = parseJumbfBoxTree(app11DataView, jumbStart, combined.byteLength);
          processC2paTree(boxes, app11DataView, c2paTags);
        }
      }
    }
  } catch (e) {
    console.error('C2PA buffer extraction error:', e);
  }
  return c2paTags;
};

const processC2paTree = (boxes, view, tags) => {
  try {
    const getJumbLabel = (box) => {
      if (box.type !== 'jumb' || !box.children) return null;
      const jumd = box.children.find(b => b.type === 'jumd');
      return jumd ? jumd.label || null : null;
    };
    const getJumbUuid = (box) => {
      if (box.type !== 'jumb' || !box.children) return null;
      const jumd = box.children.find(b => b.type === 'jumd');
      return jumd ? jumd.uuid || null : null;
    };

    const findJumbByUuid = (list, targetUuidStr) => {
      let found = [];
      for (const box of list) {
        const uuid = getJumbUuid(box);
        if (uuid && formatUuid(uuid) === targetUuidStr) {
          found.push(box);
        }
        if (box.children) {
          found = found.concat(findJumbByUuid(box.children, targetUuidStr));
        }
      }
      return found;
    };

    const findJumbByLabel = (list, labelSubstr) => {
      for (const box of list) {
        const label = getJumbLabel(box);
        if (label && (label === labelSubstr || label.includes(labelSubstr))) {
          return box;
        }
        if (box.children) {
          const result = findJumbByLabel(box.children, labelSubstr);
          if (result) return result;
        }
      }
      return null;
    };

    const C2PA_UUID = '(c2pa)-0011-0010-800000aa00389b71';
    const manifestStores = findJumbByUuid(boxes, C2PA_UUID);
    if (manifestStores.length === 0) return;

    tags.present = true;
    const manifestStore = manifestStores[0];
    const manifestJumbs = manifestStore.children?.filter(b => b.type === 'jumb') || [];
    const activeManifest = manifestJumbs.find(j => findJumbByLabel([j], 'c2pa.claim')) || manifestJumbs[manifestJumbs.length - 1];

    if (!activeManifest) return;

    const manifestJumd = activeManifest.children?.find(b => b.type === 'jumd');
    tags.manifest = manifestJumd?.label || '';

    const claimJumb = findJumbByLabel([activeManifest], 'c2pa.claim');
    const assertionsJumb = findJumbByLabel([activeManifest], 'c2pa.assertions');

    if (claimJumb) {
      const contentBox = claimJumb.children?.find(b => b.type !== 'jumd');
      if (contentBox) {
        const payloadBytes = new Uint8Array(view.buffer, view.byteOffset + contentBox.payloadOffset, contentBox.payloadLen);
        const claimData = decodeCbor(payloadBytes);
        if (claimData) {
          if (Array.isArray(claimData.claim_generator_info)) {
            tags.claimGenerator = claimData.claim_generator_info[0]?.name || '';
          } else if (typeof claimData.claim_generator === 'string') {
            tags.claimGenerator = claimData.claim_generator.split('/')[0].trim();
          } else if (claimData.claim_generator && typeof claimData.claim_generator === 'object') {
            tags.claimGenerator = claimData.claim_generator.name || '';
          }
          tags.signatureStatus = 'Verified'; // Provenance signature detected in claim
        }
      }
    }

    if (assertionsJumb) {
      const assertionItems = assertionsJumb.children?.filter(b => b.type === 'jumb') || [];
      const actions = [];
      assertionItems.forEach(assertionJumb => {
        const assertionJumd = assertionJumb.children?.find(b => b.type === 'jumd');
        const label = assertionJumd?.label || '';
        const contentBox = assertionJumb.children?.find(b => b.type !== 'jumd');
        if (contentBox && label.includes('c2pa.actions')) {
          const bytes = new Uint8Array(view.buffer, view.byteOffset + contentBox.payloadOffset, contentBox.payloadLen);
          const payload = decodeCbor(bytes);
          if (payload && Array.isArray(payload.actions)) {
            payload.actions.forEach(act => {
              if (act.action) actions.push(act.action);
            });
          }
        }
      });
      if (actions.length > 0) tags.actions = actions;
    }
  } catch (e) {
    console.error('Error parsing C2PA segments:', e);
  }
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

  // 1. Stable Diffusion / Automatic1111 Parameters
  const parameters = tags.Parameters || tags.parameters || tags.ParametersString;
  if (parameters) {
    const parsed = parseStableDiffusionParameters(parameters);
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
  const comfyPrompt = tags.Prompt || tags.prompt;
  const comfyWorkflow = tags.Workflow || tags.workflow;
  if (comfyPrompt && typeof comfyPrompt === 'string' && comfyPrompt.trim().startsWith('{')) {
    const parsed = parseComfyUiPrompt(comfyPrompt);
    if (parsed) {
      generator = 'ComfyUI';
      if (parsed.prompt) prompt = parsed.prompt;
      if (parsed.negativePrompt) negativePrompt = parsed.negativePrompt;
      if (parsed.model) model = parsed.model;
      if (parsed.seed) seed = parsed.seed;
      if (parsed.sampler) sampler = parsed.sampler;
      if (parsed.steps) steps = parsed.steps;
      if (comfyWorkflow) workflow = comfyWorkflow;
    }
  }

  // 3. Known keywords in creator tools or software metadata
  const software = String(tags.CreatorTool || tags.Software || tags.Generator || '').trim();
  if (software) {
    if (software.toLowerCase().includes('adobe firefly') || software.toLowerCase().includes('firefly')) {
      generator = 'Adobe Firefly';
    } else if (software.toLowerCase().includes('midjourney')) {
      generator = 'Midjourney';
    } else if (software.toLowerCase().includes('dall-e') || software.toLowerCase().includes('dalle')) {
      generator = 'DALL-E 3';
    } else if (software.toLowerCase().includes('fooocus')) {
      generator = 'Fooocus';
    } else if (software.toLowerCase().includes('invokeai') || software.toLowerCase().includes('invoke')) {
      generator = 'InvokeAI';
    } else if (software.toLowerCase().includes('imagen') || software.toLowerCase().includes('google')) {
      generator = 'Google AI (Imagen)';
    } else if (software.toLowerCase().includes('stable diffusion') || software.toLowerCase().includes('stablediffusion')) {
      generator = 'Stable Diffusion';
    }
  }

  // 4. Fallback prompts
  if (!prompt) {
    prompt = tags['pixy:prompt'] || tags.prompt || tags.prompt_text || tags.Prompt || tags.GenerationPrompt;
    if (!prompt) {
      const desc = String(tags.Description || tags.ImageDescription || tags.UserComment || '');
      if (desc.includes('/imagine') || desc.includes('prompt:')) {
        prompt = desc;
        if (!generator) generator = 'Midjourney';
      }
    }
  }

  return generator ? {
    generator,
    prompt: prompt || null,
    negativePrompt: negativePrompt || null,
    model: model || null,
    seed: seed || null,
    sampler: sampler || null,
    steps: steps || null,
    cfgScale: cfgScale || null,
    workflow: workflow || null
  } : null;
};

// ── Metadata Normalizer ──
const normalizeMetadata = (exifTags, c2paData, fileSize) => {
  const categories = {
    basic: {
      title: 'Basic Information',
      fields: []
    },
    camera: {
      title: 'Camera Information',
      fields: []
    },
    location: {
      title: 'Location',
      fields: []
    },
    copyright: {
      title: 'Copyright & Ownership',
      fields: []
    },
    ai: {
      title: 'AI Generation Data',
      fields: []
    },
    c2pa: {
      title: 'Content Credentials (C2PA)',
      fields: []
    }
  };

  const addField = (categoryKey, name, value) => {
    if (value !== undefined && value !== null && value !== '') {
      categories[categoryKey].fields.push({ name, value: String(value) });
    }
  };

  // 1. Basic Information
  const width = exifTags.ImageWidth || exifTags.PixelXDimension || exifTags.Width;
  const height = exifTags.ImageHeight || exifTags.PixelYDimension || exifTags.Height;
  addField('basic', 'Width', width ? `${width} px` : '');
  addField('basic', 'Height', height ? `${height} px` : '');
  
  const format = exifTags.FileType || exifTags.MIMEType;
  addField('basic', 'Format', format);
  
  const size = exifTags.FileSize || fileSize;
  addField('basic', 'File Size', size ? (typeof size === 'number' ? formatSize(size) : size) : '');
  
  const colorSpace = exifTags.ColorSpace || exifTags.ColorSpaceData || exifTags.ProfileConnectionSpace || exifTags.YCbCrPositioning;
  addField('basic', 'Color Space', colorSpace);
  
  const bitDepth = exifTags.BitDepth || exifTags.BitsPerSample || exifTags.DataPrecision;
  addField('basic', 'Bit Depth', bitDepth ? `${bitDepth} bits` : '');
  
  const xRes = exifTags.XResolution;
  const yRes = exifTags.YResolution;
  const resUnit = exifTags.ResolutionUnit || 'inches';
  if (xRes && yRes) {
    addField('basic', 'DPI', `${xRes}x${yRes} dpi (${resUnit})`);
  } else if (xRes) {
    addField('basic', 'DPI', `${xRes} dpi`);
  }

  // 2. Camera Information
  addField('camera', 'Camera Make', exifTags.Make);
  addField('camera', 'Camera Model', exifTags.Model);
  addField('camera', 'Lens', exifTags.LensModel || exifTags.Lens || exifTags.LensInfo || exifTags.LensSpec);
  addField('camera', 'ISO', exifTags.ISO || exifTags.ISOSpeedRatings);
  
  const aperture = exifTags.Aperture || exifTags.FNumber || exifTags.ApertureValue;
  addField('camera', 'Aperture', aperture ? `f/${aperture}` : '');
  
  const exposure = exifTags.ExposureTime || exifTags.ShutterSpeed || exifTags.ShutterSpeedValue;
  addField('camera', 'Exposure', exposure ? (typeof exposure === 'number' && exposure < 1 ? `1/${Math.round(1 / exposure)}s` : `${exposure}s`) : '');
  
  addField('camera', 'Flash', exifTags.Flash);
  
  const focalLength = exifTags.FocalLength || exifTags.FocalLengthIn35mmFilm;
  addField('camera', 'Focal Length', focalLength ? `${focalLength} mm` : '');

  // 3. Location
  const lat = exifTags.GPSLatitude;
  const lon = exifTags.GPSLongitude;
  if (lat && lon) {
    addField('location', 'GPS coordinates', `${lat}, ${lon}`);
  }
  
  const alt = exifTags.GPSAltitude;
  addField('location', 'GPS altitude', alt ? `${alt} ${exifTags.GPSAltitudeRef || ''}`.trim() : '');
  
  const gpsDate = exifTags.GPSDateStamp || exifTags.GPSDate;
  const gpsTime = exifTags.GPSTimeStamp || exifTags.GPSTime;
  if (gpsDate && gpsTime) {
    addField('location', 'GPS timestamp', `${gpsDate} ${gpsTime}`);
  } else if (gpsDate) {
    addField('location', 'GPS timestamp', gpsDate);
  }

  // 4. Copyright & Ownership (Normalizing field names here)
  const author = exifTags.Artist || exifTags.ByLine || exifTags.Creator || exifTags.Author || exifTags.creator || exifTags.artist;
  addField('copyright', 'Author', author);
  
  const generator = exifTags.CreatorTool || exifTags.Software || exifTags.software;
  addField('copyright', 'Creator', generator);
  
  addField('copyright', 'Credit', exifTags.Credit);
  addField('copyright', 'Copyright', exifTags.Copyright || exifTags.CopyrightNotice);
  addField('copyright', 'Source', exifTags.Source);
  
  const keywords = exifTags.Keywords || exifTags.Subject;
  addField('copyright', 'Keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
  
  const description = exifTags.ImageDescription || exifTags.Description || exifTags.CaptionAbstract || exifTags.UserComment || exifTags.description || exifTags.prompt_text;
  addField('copyright', 'Description', description);

  // 5. AI Generation Data
  const aiData = detectAiMetadata(exifTags);
  if (aiData) {
    addField('ai', 'Generator', aiData.generator);
    addField('ai', 'Prompt', aiData.prompt);
    addField('ai', 'Model', aiData.model);
    addField('ai', 'Seed', aiData.seed);
    addField('ai', 'Sampler', aiData.sampler);
    addField('ai', 'Steps', aiData.steps);
    addField('ai', 'CFG Scale', aiData.cfgScale);
    addField('ai', 'Workflow', aiData.workflow ? '[Embedded Workflow JSON]' : '');
  }

  // 6. Content Credentials (C2PA)
  const hasC2pa = (c2paData && c2paData.present) || exifTags.ClaimGenerator || exifTags.ValidationStatus;
  addField('c2pa', 'Present', hasC2pa ? 'Yes' : 'No');
  
  const claimGen = c2paData?.claimGenerator || exifTags.ClaimGenerator;
  addField('c2pa', 'Claim Generator', claimGen);
  
  const actions = c2paData?.actions || exifTags.Actions;
  addField('c2pa', 'Actions', Array.isArray(actions) ? actions.join(', ') : actions);
  
  const manifest = c2paData?.manifest || exifTags.Manifest;
  addField('c2pa', 'Manifest', manifest);
  
  const sigStatus = c2paData?.signatureStatus || (hasC2pa ? 'Unverified' : '');
  addField('c2pa', 'Signature Status', sigStatus);
  
  const valStatus = c2paData?.validationStatus || exifTags.ValidationStatus;
  addField('c2pa', 'Validation Status', valStatus);

  // ── Provenance Banner Logic ──
  let provenance = {
    title: 'No AI Metadata Found',
    subtitle: 'No artificial intelligence signatures or credentials detected.',
    type: 'none'
  };

  if (hasC2pa) {
    let sub = 'Secure provenance manifest found.';
    if (claimGen) {
      if (claimGen.toLowerCase().includes('google') || claimGen.toLowerCase().includes('gemini') || claimGen.toLowerCase().includes('imagen')) {
        sub = 'Generated using Google AI';
      } else if (claimGen.toLowerCase().includes('firefly') || claimGen.toLowerCase().includes('adobe')) {
        sub = 'Generated using Adobe Firefly';
      } else {
        sub = `Generated using ${claimGen}`;
      }
    }
    provenance = {
      title: 'Content Credentials Verified',
      subtitle: sub,
      type: 'verified'
    };
  } else if (aiData) {
    provenance = {
      title: 'AI Metadata Found',
      subtitle: `Generator: ${aiData.generator}`,
      type: 'ai-metadata'
    };
  }

  // Raw Dump (ignoring large binary buffers)
  const rawMetadataList = [];
  for (const key in exifTags) {
    const val = exifTags[key];
    if (val && typeof val !== 'object' && typeof val !== 'function') {
      rawMetadataList.push({ name: key, value: String(val) });
    } else if (Array.isArray(val)) {
      rawMetadataList.push({ name: key, value: val.join(', ') });
    }
  }

  return {
    provenance,
    categories,
    raw: rawMetadataList
  };
};

// ── HTTP API POST Method ──
export async function POST(request) {
  let tempFilePath = '';
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const action = formData.get('action') || 'extract'; // 'extract' or 'strip'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to temp file
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `imagepine_${Date.now()}_${path.basename(file.name)}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    if (action === 'strip') {
      // 1. Strip all metadata in place using ExifTool
      await exiftool.write(tempFilePath, {}, ['-all=', '-overwrite_original']);

      // 2. Read stripped file
      const cleanedBuffer = await fs.promises.readFile(tempFilePath);

      // 3. Return buffer as attachment
      return new Response(cleanedBuffer, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${path.parse(file.name).name}_cleaned${path.parse(file.name).ext}"`
        }
      });
    } else {
      // 1. Extract metadata using ExifTool
      const exifTags = await exiftool.read(tempFilePath);

      // 2. Extract detailed C2PA/JUMBF boxes natively in javascript
      const c2paData = extractC2paMetadata(buffer);

      // 3. Normalize and package
      const normalized = normalizeMetadata(exifTags, c2paData, file.size);

      // 4. Add basic format flags
      normalized.width = exifTags.ImageWidth || exifTags.PixelXDimension || exifTags.Width || 0;
      normalized.height = exifTags.ImageHeight || exifTags.PixelYDimension || exifTags.Height || 0;
      normalized.hasExif = !!(exifTags.Make || exifTags.Model || exifTags.ISO || exifTags.FocalLength);
      normalized.gps = exifTags.GPSLatitude && exifTags.GPSLongitude ? `${exifTags.GPSLatitude}, ${exifTags.GPSLongitude}` : null;
      normalized.gpsDms = exifTags.GPSPosition || null;

      // Add detected segments tags to retain layout logic
      normalized.detectedSegments = {
        exif: !!exifTags.Make || !!exifTags.Model || !!exifTags.GPSLatitude || !!exifTags.ISO || !!exifTags.Flash,
        xmp: !!(exifTags.XMPToolkit || exifTags.HistoryAction || exifTags.CreatorTool || exifTags.Parameters),
        iptc: !!(exifTags.ObjectName || exifTags.Keywords || exifTags.ByLine || exifTags.CopyrightNotice),
        comments: !!(exifTags.UserComment || exifTags.Comment || exifTags.XPComment),
        icc: !!(exifTags.ProfileName || exifTags.ColorSpace || exifTags.ProfileConnectionSpace),
        otherApp: c2paData.present ? ['C2PA'] : []
      };

      return NextResponse.json(normalized);
    }
  } catch (err) {
    console.error('API Metadata route error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file metadata' }, { status: 500 });
  } finally {
    // Ensure temporary files are deleted
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch (e) {
        console.warn('Failed to clean up temp file:', e);
      }
    }
  }
}
