"use client";

import React, { useState, useEffect, useRef } from 'react';
import UploadBox from '@/components/UploadBox';
import { saveAs } from 'file-saver';
import { saveHistory } from '@/lib/storage';
import ToolPageShell from '@/components/ToolPageShell';

const _FEATURES = [
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: '25+ Device Mockups',
    desc: 'Wrap screenshots inside MacBook Pro, iPhone 15 Pro, iPad Pro, iMac, Apple Watch, Safari, or Chrome browser frames.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
    title: 'Clean Backdrop Options',
    desc: 'Keep it clean with a Solid White backdrop, set a Transparent Alpha channel, or use a Custom color picker.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 17v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6" />
      </svg>
    ),
    title: '3D Angle Rotation',
    desc: 'Apply subtle horizontal skew and 3D angle rotation to give your screens a premium, dynamic feel.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    title: 'Custom Canvas Sizing',
    desc: 'Export mockups in standard 16:9, vertical 9:16, 1:1, 3:4, or specify exact pixel dimensions.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    title: 'High-Resolution Exports',
    desc: 'Exports vector elements and image clips onto a high-res HTML5 Canvas for crisp marketing assets.'
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: '100% Secure & Client-Side',
    desc: 'All mockup wrapping happens locally in your web browser. Your screenshots are never sent to a server.'
  }
];

const _STEPS = [
  { n: '1', title: 'Upload Screenshot', desc: 'Select or drag and drop any app screenshot or site design.' },
  { n: '2', title: 'Select Mockup Frame', desc: 'Choose from 26 laptop, phone, tablet, watch, or browser templates.' },
  { n: '3', title: 'Export & Share', desc: 'Download your finished design as a high-quality PNG instantly.' }
];

const _FAQS = [
  { q: 'What frames are included in Mockup Studio?', a: 'Mockup Studio includes 26 distinct options: 5 MacBook Pros, 7 iPhone 15 Pros (including landscape), 6 iPad Pros, 2 iMacs, 2 Apple Watches, and 4 Safari/Chrome browser frames.' },
  { q: 'Can I export with transparent backgrounds?', a: 'Yes! Select the Transparent Background option under Background Theme to export mockups with a clear background, perfect for layering.' },
  { q: 'How does custom dimension scaling work?', a: 'When you choose Custom under Canvas Ratio, you can enter any pixel width and height. The mockup will auto-scale to fit within your designated dimensions.' }
];

const MOCKUPS = [
  // Laptops
  { id: 'macbook_spacegray', name: 'MacBook Pro (Space Gray)', type: 'macbook', color: '#5E6368', accent: '#3C4043' },
  { id: 'macbook_silver', name: 'MacBook Pro (Silver)', type: 'macbook', color: '#D2D7DB', accent: '#A0A5A9' },
  { id: 'macbook_black', name: 'MacBook Pro (Space Black)', type: 'macbook', color: '#252629', accent: '#111213' },
  { id: 'macbook_clay_light', name: 'MacBook Pro (Clay Light)', type: 'macbook', color: '#F1F1F4', accent: '#E1E1E5' },
  { id: 'macbook_clay_dark', name: 'MacBook Pro (Clay Dark)', type: 'macbook', color: '#3E3E43', accent: '#2B2B30' },
  
  // iPhones
  { id: 'iphone_black', name: 'iPhone 15 Pro (Black Titanium)', type: 'iphone', color: '#1E1E22', accent: '#0D0D0F' },
  { id: 'iphone_natural', name: 'iPhone 15 Pro (Natural Titanium)', type: 'iphone', color: '#8E8B82', accent: '#626059' },
  { id: 'iphone_blue', name: 'iPhone 15 Pro (Blue Titanium)', type: 'iphone', color: '#3D4956', accent: '#212932' },
  { id: 'iphone_white', name: 'iPhone 15 Pro (White Titanium)', type: 'iphone', color: '#F2F1ED', accent: '#D2D1CD' },
  { id: 'iphone_clay_light', name: 'iPhone 15 Pro (Clay Light)', type: 'iphone', color: '#F5F5F7', accent: '#E5E5E7' },
  { id: 'iphone_clay_dark', name: 'iPhone 15 Pro (Clay Dark)', type: 'iphone', color: '#2F2F32', accent: '#1C1C1E' },
  { id: 'iphone_landscape', name: 'iPhone 15 Pro (Landscape)', type: 'iphone_landscape', color: '#1E1E22', accent: '#0D0D0F' },
  
  // iPads
  { id: 'ipad_portrait_gray', name: 'iPad Pro (Portrait - Space Gray)', type: 'ipad_portrait', color: '#5E6368', accent: '#1D1D20' },
  { id: 'ipad_landscape_gray', name: 'iPad Pro (Landscape - Space Gray)', type: 'ipad_landscape', color: '#5E6368', accent: '#1D1D20' },
  { id: 'ipad_portrait_silver', name: 'iPad Pro (Portrait - Silver)', type: 'ipad_portrait', color: '#D2D7DB', accent: '#E4E4EF' },
  { id: 'ipad_landscape_silver', name: 'iPad Pro (Landscape - Silver)', type: 'ipad_landscape', color: '#D2D7DB', accent: '#E4E4EF' },
  { id: 'ipad_clay_light', name: 'iPad Pro (Clay Light)', type: 'ipad_portrait', color: '#F5F5F7', accent: '#E5E5E7' },
  { id: 'ipad_clay_dark', name: 'iPad Pro (Clay Dark)', type: 'ipad_portrait', color: '#2F2F32', accent: '#1C1C1E' },
  
  // iMacs
  { id: 'imac_gray', name: 'iMac 24\" (Space Gray)', type: 'imac', color: '#4A4C50', accent: '#2F3033' },
  { id: 'imac_silver', name: 'iMac 24\" (Silver)', type: 'imac', color: '#D8DCE0', accent: '#AFB2B6' },
  
  // Watches
  { id: 'apple_watch_ultra', name: 'Apple Watch Ultra (Orange Alpine)', type: 'watch', color: '#E5DFD9', accent: '#FF5A00' },
  { id: 'apple_watch_series9', name: 'Apple Watch Series 9 (Midnight)', type: 'watch', color: '#2C2D30', accent: '#4F525A' },
  
  // Browsers
  { id: 'safari_light', name: 'Safari Browser (Light)', type: 'safari', theme: 'light' },
  { id: 'safari_dark', name: 'Safari Browser (Dark)', type: 'safari', theme: 'dark' },
  { id: 'chrome_light', name: 'Chrome Browser (Light)', type: 'chrome', theme: 'light' },
  { id: 'chrome_dark', name: 'Chrome Browser (Dark)', type: 'chrome', theme: 'dark' },
];

export default function MockupPage() {
  const [file, setFile] = useState(null);
  const [deviceType, setDeviceType] = useState('macbook_spacegray');
  const [canvasSize, setCanvasSize] = useState('16-9'); // '16-9' | '9-16' | '1-1' | '3-4' | 'custom'
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);
  const [bgGradient, setBgGradient] = useState('white'); // 'white' | 'transparent' | 'custom'
  const [customBg, setCustomBg] = useState('#7342e6');
  const [padding, setPadding] = useState(64);
  const [cardRadius, setCardRadius] = useState(12);
  const [shadowStrength, setShadowStrength] = useState(0.35);
  const [skewAngle, setSkewAngle] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFileSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setFile(selectedList[0]);
    } else {
      setFile(null);
    }
    setErrorMsg('');
  };

  const drawRoundedRect = (ctx, x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawRoundedRectTopOnly = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawRoundedRectBottomOnly = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.closePath();
  };

  const renderCanvas = () => {
    if (!file || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1600;
    let height = 900;
    
    if (canvasSize === '16-9') {
      width = 1600;
      height = 900;
    } else if (canvasSize === '9-16') {
      width = 900;
      height = 1600;
    } else if (canvasSize === '1-1') {
      width = 1200;
      height = 1200;
    } else if (canvasSize === '3-4') {
      width = 900;
      height = 1200;
    } else if (canvasSize === 'custom') {
      width = Math.max(100, Math.min(4000, parseInt(customWidth, 10) || 1200));
      height = Math.max(100, Math.min(4000, parseInt(customHeight, 10) || 800));
    }

    canvas.width = width;
    canvas.height = height;

    // Draw background
    if (bgGradient === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (bgGradient === 'custom') {
      ctx.fillStyle = customBg;
      ctx.fillRect(0, 0, width, height);
    } else if (bgGradient === 'transparent') {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);

    if (parseFloat(skewAngle) !== 0) {
      const rad = (parseFloat(skewAngle) * Math.PI) / 180;
      ctx.transform(1, Math.tan(rad) * 0.25, Math.tan(rad) * 0.1, 1, 0, 0);
      ctx.rotate(rad * 0.4);
    }

    const boundsW = width - padding * 2;
    const boundsH = height - padding * 2;

    const mockup = MOCKUPS.find(m => m.id === deviceType) || MOCKUPS[0];

    if (mockup.type === 'safari') {
      const isDark = mockup.theme === 'dark';
      let winW = boundsW;
      let winH = boundsW / 1.65;
      if (winH > boundsH) {
        winH = boundsH;
        winW = boundsH * 1.65;
      }

      const x = -winW / 2;
      const y = -winH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 24;

      ctx.fillStyle = isDark ? '#1E1E1E' : '#ffffff';
      drawRoundedRect(ctx, x, y, winW, winH, cardRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const barHeight = Math.max(30, winH * 0.08);
      ctx.fillStyle = isDark ? '#2D2D30' : '#F1F1F7';
      drawRoundedRectTopOnly(ctx, x, y, winW, barHeight, cardRadius);
      ctx.fill();

      const dotRadius = Math.max(4, barHeight * 0.18);
      const dotSpacing = dotRadius * 2.5;
      const dotY = y + barHeight / 2;
      const startX = x + barHeight * 0.5;

      ctx.fillStyle = '#FF5F56';
      ctx.beginPath(); ctx.arc(startX, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFBD2E';
      ctx.beginPath(); ctx.arc(startX + dotSpacing, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#27C93F';
      ctx.beginPath(); ctx.arc(startX + dotSpacing * 2, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();

      const addressW = winW * 0.52;
      const addressH = barHeight * 0.55;
      const addressX = x + (winW - addressW) / 2;
      const addressY = y + (barHeight - addressH) / 2;
      ctx.fillStyle = isDark ? '#3A3A3D' : '#ffffff';
      drawRoundedRect(ctx, addressX, addressY, addressW, addressH, 6);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#48484A' : '#E4E4EF';
      ctx.lineWidth = 1;
      ctx.stroke();

      const viewY = y + barHeight;
      const viewH = winH - barHeight;

      ctx.save();
      drawRoundedRectBottomOnly(ctx, x, viewY, winW, viewH, cardRadius);
      ctx.clip();
      ctx.drawImage(img, x, viewY, winW, viewH);
      ctx.restore();

    } else if (mockup.type === 'chrome') {
      const isDark = mockup.theme === 'dark';
      let winW = boundsW;
      let winH = boundsW / 1.65;
      if (winH > boundsH) {
        winH = boundsH;
        winW = boundsH * 1.65;
      }

      const x = -winW / 2;
      const y = -winH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 24;

      ctx.fillStyle = isDark ? '#1E1E1E' : '#ffffff';
      drawRoundedRect(ctx, x, y, winW, winH, cardRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const barHeight = Math.max(34, winH * 0.095);
      ctx.fillStyle = isDark ? '#202124' : '#EAECEF';
      drawRoundedRectTopOnly(ctx, x, y, winW, barHeight, cardRadius);
      ctx.fill();

      // Chrome tab style
      const tabX = x + barHeight * 1.6;
      const tabY = y + barHeight * 0.25;
      const tabW = winW * 0.22;
      const tabH = barHeight * 0.75;
      ctx.fillStyle = isDark ? '#1E1E1E' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(tabX, tabY + tabH);
      ctx.bezierCurveTo(tabX + 4, tabY + tabH, tabX + 6, tabY, tabX + 12, tabY);
      ctx.lineTo(tabX + tabW - 12, tabY);
      ctx.bezierCurveTo(tabX + tabW - 6, tabY, tabX + tabW - 4, tabY + tabH, tabX + tabW, tabY + tabH);
      ctx.closePath();
      ctx.fill();

      // Chrome control dots
      const dotRadius = Math.max(4, barHeight * 0.16);
      const dotSpacing = dotRadius * 2.5;
      const dotY = y + barHeight / 2;
      const startX = x + barHeight * 0.45;

      ctx.fillStyle = '#FF5F56';
      ctx.beginPath(); ctx.arc(startX, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFBD2E';
      ctx.beginPath(); ctx.arc(startX + dotSpacing, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#27C93F';
      ctx.beginPath(); ctx.arc(startX + dotSpacing * 2, dotY, dotRadius, 0, Math.PI * 2); ctx.fill();

      // Address/Omnibox
      const addressW = winW * 0.65;
      const addressH = barHeight * 0.48;
      const addressX = x + (winW - addressW) / 2;
      const addressY = y + barHeight - addressH - (barHeight * 0.08);
      ctx.fillStyle = isDark ? '#2D2F32' : '#F1F3F4';
      drawRoundedRect(ctx, addressX, addressY, addressW, addressH, addressH / 2);
      ctx.fill();

      const viewY = y + barHeight;
      const viewH = winH - barHeight;

      ctx.save();
      drawRoundedRectBottomOnly(ctx, x, viewY, winW, viewH, cardRadius);
      ctx.clip();
      ctx.drawImage(img, x, viewY, winW, viewH);
      ctx.restore();

    } else if (mockup.type === 'macbook') {
      let screenW = boundsW * 0.82;
      let screenH = screenW / 1.6;
      if (screenH > boundsH * 0.72) {
        screenH = boundsH * 0.72;
        screenW = screenH * 1.6;
      }

      const screenX = -screenW / 2;
      const screenY = -screenH / 2 - (screenH * 0.04);

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      const bezelThickness = Math.max(9, screenW * 0.02);
      ctx.fillStyle = '#0F0F11';
      drawRoundedRectTopOnly(ctx, screenX - bezelThickness, screenY - bezelThickness, screenW + bezelThickness * 2, screenH + bezelThickness, 12);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const cameraBarW = screenW * 0.13;
      const cameraBarH = bezelThickness * 0.5;
      ctx.fillStyle = '#000';
      drawRoundedRectBottomOnly(ctx, -cameraBarW / 2, screenY, cameraBarW, cameraBarH, 4);
      ctx.fill();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      const baseWidth = screenW * 1.22;
      const baseHeight = screenH * 0.075;
      const baseY = screenY + screenH;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength * 1.3})`;
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;

      ctx.fillStyle = mockup.color;
      ctx.beginPath();
      ctx.moveTo(-baseWidth / 2, baseY);
      ctx.lineTo(baseWidth / 2, baseY);
      ctx.lineTo(baseWidth / 2 - baseWidth * 0.02, baseY + baseHeight);
      ctx.lineTo(-baseWidth / 2 + baseWidth * 0.02, baseY + baseHeight);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = mockup.accent;
      const openerW = baseWidth * 0.14;
      const openerH = baseHeight * 0.35;
      drawRoundedRectBottomOnly(ctx, -openerW / 2, baseY, openerW, openerH, 3);
      ctx.fill();

      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(-baseWidth / 2, baseY, baseWidth, 1.2);

    } else if (mockup.type === 'iphone') {
      let phoneH = boundsH;
      let phoneW = boundsH * 0.49;
      if (phoneW > boundsW) {
        phoneW = boundsW;
        phoneH = boundsW / 0.49;
      }

      const x = -phoneW / 2;
      const y = -phoneH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 56;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 28;

      const frameRadius = 38;
      ctx.fillStyle = mockup.color;
      drawRoundedRect(ctx, x, y, phoneW, phoneH, frameRadius);
      ctx.fill();

      // Outer bezel line
      ctx.strokeStyle = mockup.accent;
      ctx.lineWidth = Math.max(1.5, phoneW * 0.008);
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const screenPadding = Math.max(6, phoneW * 0.026);
      const innerRadius = frameRadius - screenPadding;
      const screenX = x + screenPadding;
      const screenY = y + screenPadding;
      const screenW = phoneW - screenPadding * 2;
      const screenH = phoneH - screenPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, innerRadius);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      const islandW = screenW * 0.28;
      const islandH = screenH * 0.032;
      const islandX = -islandW / 2;
      const islandY = y + screenPadding + (screenH * 0.026);

      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, islandX, islandY, islandW, islandH, islandH / 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(islandX + islandW * 0.78, islandY + islandH / 2, 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

    } else if (mockup.type === 'iphone_landscape') {
      let phoneW = boundsW;
      let phoneH = boundsW * 0.49;
      if (phoneH > boundsH) {
        phoneH = boundsH;
        phoneW = boundsH / 0.49;
      }

      const x = -phoneW / 2;
      const y = -phoneH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 56;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 28;

      const frameRadius = 38;
      ctx.fillStyle = mockup.color;
      drawRoundedRect(ctx, x, y, phoneW, phoneH, frameRadius);
      ctx.fill();

      // Outer bezel line
      ctx.strokeStyle = mockup.accent;
      ctx.lineWidth = Math.max(1.5, phoneH * 0.008);
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const screenPadding = Math.max(6, phoneH * 0.026);
      const innerRadius = frameRadius - screenPadding;
      const screenX = x + screenPadding;
      const screenY = y + screenPadding;
      const screenW = phoneW - screenPadding * 2;
      const screenH = phoneH - screenPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, innerRadius);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      const islandH = screenH * 0.28;
      const islandW = screenW * 0.032;
      const islandX = x + screenPadding + (screenW * 0.026);
      const islandY = -islandH / 2;

      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, islandX, islandY, islandW, islandH, islandW / 2);
      ctx.fill();

      ctx.restore();

    } else if (mockup.type === 'ipad_portrait') {
      let ipadH = boundsH;
      let ipadW = boundsH * 0.73;
      if (ipadW > boundsW) {
        ipadW = boundsW;
        ipadH = boundsW / 0.73;
      }

      const x = -ipadW / 2;
      const y = -ipadH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 24;

      const frameRadius = 26;
      ctx.fillStyle = mockup.color;
      drawRoundedRect(ctx, x, y, ipadW, ipadH, frameRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const screenPadding = Math.max(10, ipadW * 0.035);
      const innerRadius = frameRadius - screenPadding * 0.75;
      const screenX = x + screenPadding;
      const screenY = y + screenPadding;
      const screenW = ipadW - screenPadding * 2;
      const screenH = ipadH - screenPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, innerRadius);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);
      ctx.restore();

      // Camera dot
      ctx.fillStyle = '#0F0F11';
      ctx.beginPath();
      ctx.arc(0, y + screenPadding / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (mockup.type === 'ipad_landscape') {
      let ipadW = boundsW;
      let ipadH = boundsW * 0.73;
      if (ipadH > boundsH) {
        ipadH = boundsH;
        ipadW = boundsH / 0.73;
      }

      const x = -ipadW / 2;
      const y = -ipadH / 2;

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 48;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 24;

      const frameRadius = 26;
      ctx.fillStyle = mockup.color;
      drawRoundedRect(ctx, x, y, ipadW, ipadH, frameRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const screenPadding = Math.max(10, ipadH * 0.035);
      const innerRadius = frameRadius - screenPadding * 0.75;
      const screenX = x + screenPadding;
      const screenY = y + screenPadding;
      const screenW = ipadW - screenPadding * 2;
      const screenH = ipadH - screenPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, innerRadius);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);
      ctx.restore();

      // Camera dot on the left
      ctx.fillStyle = '#0F0F11';
      ctx.beginPath();
      ctx.arc(x + screenPadding / 2, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (mockup.type === 'imac') {
      let screenW = boundsW * 0.85;
      let screenH = screenW / 1.78;
      if (screenH > boundsH * 0.62) {
        screenH = boundsH * 0.62;
        screenW = screenH * 1.78;
      }

      const screenX = -screenW / 2;
      const screenY = -screenH / 2 - (screenH * 0.12);

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;

      const bezel = Math.max(8, screenW * 0.015);
      ctx.fillStyle = '#FFFFFF'; // Front white glass bezel
      drawRoundedRectTopOnly(ctx, screenX - bezel, screenY - bezel, screenW + bezel * 2, screenH + bezel, 10);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.drawImage(img, screenX, screenY, screenW, screenH);

      // Chin color
      const chinH = screenH * 0.16;
      const chinY = screenY + screenH;
      ctx.fillStyle = mockup.color;
      drawRoundedRectBottomOnly(ctx, screenX - bezel, chinY, screenW + bezel * 2, chinH, 10);
      ctx.fill();

      // Stand / Neck
      const standW = screenW * 0.14;
      const standH = screenH * 0.38;
      const standY = chinY + chinH;
      ctx.fillStyle = mockup.accent;
      ctx.beginPath();
      ctx.moveTo(-standW * 0.8, standY);
      ctx.lineTo(standW * 0.8, standY);
      ctx.lineTo(standW * 1.1, standY + standH);
      ctx.lineTo(-standW * 1.1, standY + standH);
      ctx.closePath();
      ctx.fill();

    } else if (mockup.type === 'watch') {
      let watchH = boundsH * 0.68;
      let watchW = watchH * 0.82;
      if (watchW > boundsW * 0.68) {
        watchW = boundsW * 0.68;
        watchH = watchW / 0.82;
      }

      const x = -watchW / 2;
      const y = -watchH / 2;

      // Draw watch strap
      const strapW = watchW * 0.72;
      ctx.fillStyle = mockup.accent; // Strap color
      ctx.beginPath();
      ctx.moveTo(-strapW / 2, -height / 2);
      ctx.lineTo(strapW / 2, -height / 2);
      ctx.lineTo(strapW / 2, y + 10);
      ctx.lineTo(-strapW / 2, y + 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-strapW / 2, y + watchH - 10);
      ctx.lineTo(strapW / 2, y + watchH - 10);
      ctx.lineTo(strapW / 2, height / 2);
      ctx.lineTo(-strapW / 2, height / 2);
      ctx.closePath();
      ctx.fill();

      // Dial Frame shadow
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowStrength * 1.2})`;
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = 16;

      // Dial Frame
      const dialRadius = 32;
      ctx.fillStyle = mockup.color;
      drawRoundedRect(ctx, x, y, watchW, watchH, dialRadius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Digital Crown
      ctx.fillStyle = '#6F7275';
      const crownW = watchW * 0.08;
      const crownH = watchH * 0.22;
      drawRoundedRect(ctx, x + watchW, y + watchH * 0.2, crownW, crownH, 4);
      ctx.fill();

      const innerPadding = Math.max(6, watchW * 0.06);
      const screenX = x + innerPadding;
      const screenY = y + innerPadding;
      const screenW = watchW - innerPadding * 2;
      const screenH = watchH - innerPadding * 2;

      ctx.save();
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, dialRadius - innerPadding * 0.8);
      ctx.clip();

      ctx.drawImage(img, screenX, screenY, screenW, screenH);
      ctx.restore();
    }

    ctx.restore();
  };

  useEffect(() => {
    if (file) {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        renderCanvas();
      };
      img.src = file.preview;
    }
  }, [file, deviceType, canvasSize, customWidth, customHeight, bgGradient, customBg, padding, cardRadius, shadowStrength, skewAngle]);

  const triggerDownload = () => {
    if (!canvasRef.current || !file) return;
    setIsProcessing(true);
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) throw new Error('Render failed');
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        saveAs(blob, `${nameWithoutExt}_mockup.png`);
        saveHistory('Mockup Studio', `${file.name} Wrapped Mockup`);
        setIsProcessing(false);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to compile mockup. Please try again.');
      setIsProcessing(false);
    }
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
      title="Mockup Studio"
      subtitle="Wrap your website, portfolio, or app screenshots inside macOS Safari, Chrome, MacBook Pros, iPads, or iPhones with clean backdrops."
      features={_FEATURES}
      steps={_STEPS}
      faqs={_FAQS}
      seoText="Create styled app screenshots using browser wrappers, laptop templates, smartwatch frames, and smartphone outlines online. Customize background padding, shadow depth, and perspective skew local-first."
    >
      {!file ? (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <UploadBox
            onFileSelect={handleFileSelect}
            acceptedFormats={['.jpg', '.jpeg', '.png']}
            multiple={false}
            buttonLabel="Select Screenshot"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-scale-in">
          {/* Controls column */}
          <div className="col-span-1 lg:col-span-4" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F1F7', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111128', margin: 0 }}>Mockup Config</h3>
              <button
                onClick={() => { setFile(null); imgRef.current = null; }}
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear Photo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Device selector */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Device Mockup</label>
                <select
                  value={deviceType}
                  onChange={e => setDeviceType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128' }}
                >
                  <optgroup label="Laptops (MacBook Pro)">
                    {MOCKUPS.filter(m => m.type === 'macbook').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Smartphones (iPhone 15 Pro)">
                    {MOCKUPS.filter(m => m.type === 'iphone' || m.type === 'iphone_landscape').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Tablets (iPad Pro)">
                    {MOCKUPS.filter(m => m.type === 'ipad_portrait' || m.type === 'ipad_landscape').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Desktops (iMac)">
                    {MOCKUPS.filter(m => m.type === 'imac').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Wearables (Apple Watch)">
                    {MOCKUPS.filter(m => m.type === 'watch').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Web Browsers (Safari / Chrome)">
                    {MOCKUPS.filter(m => m.type === 'safari' || m.type === 'chrome').map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Size preset */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Canvas Ratio</label>
                <select
                  value={canvasSize}
                  onChange={e => setCanvasSize(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128', marginBottom: canvasSize === 'custom' ? 8 : 0 }}
                >
                  <option value="16-9">Full HD (16:9 - 1600x900)</option>
                  <option value="9-16">Mobile Portrait (9:16 - 900x1600)</option>
                  <option value="1-1">Square (1:1 - 1200x1200)</option>
                  <option value="3-4">Tablet Portrait (3:4 - 900x1200)</option>
                  <option value="custom">Custom Dimensions...</option>
                </select>
                {canvasSize === 'custom' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#9898B5', display: 'block', marginBottom: 4 }}>Width (px)</span>
                      <input
                        type="number"
                        min="100"
                        max="4000"
                        value={customWidth}
                        onChange={e => setCustomWidth(parseInt(e.target.value) || 1200)}
                        style={{ width: '100%', padding: '7px 10px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#9898B5', display: 'block', marginBottom: 4 }}>Height (px)</span>
                      <input
                        type="number"
                        min="100"
                        max="4000"
                        value={customHeight}
                        onChange={e => setCustomHeight(parseInt(e.target.value) || 800)}
                        style={{ width: '100%', padding: '7px 10px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Background solid preset */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Background Theme</label>
                <select
                  value={bgGradient}
                  onChange={e => setBgGradient(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#F7F7FB', border: '1px solid #E4E4EF', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#111128', marginBottom: bgGradient === 'custom' ? 8 : 0 }}
                >
                  <option value="white">Solid White Backdrop</option>
                  <option value="transparent">Transparent Background</option>
                  <option value="custom">Custom Solid Color...</option>
                </select>
                {bgGradient === 'custom' && (
                  <input
                    type="color"
                    value={customBg}
                    onChange={e => setCustomBg(e.target.value)}
                    style={{ width: '100%', height: 36, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 9 }}
                  />
                )}
              </div>

              {/* Sliders */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Device Padding</span>
                  <span style={{ color: '#111128' }}>{padding}px</span>
                </div>
                <input type="range" min="20" max="150" value={padding} onChange={e => setPadding(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {(deviceType.startsWith('safari') || deviceType.startsWith('chrome')) && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>Window Corner Radius</span>
                    <span style={{ color: '#111128' }}>{cardRadius}px</span>
                  </div>
                  <input type="range" min="0" max="28" value={cardRadius} onChange={e => setCardRadius(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Shadow Strength</span>
                  <span style={{ color: '#111128' }}>{Math.round(shadowStrength * 100)}%</span>
                </div>
                <input type="range" min="0" max="80" value={Math.round(shadowStrength * 100)} onChange={e => setShadowStrength(parseFloat(e.target.value) / 100)} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Perspective Skew</span>
                  <span style={{ color: '#111128' }}>{skewAngle}°</span>
                </div>
                <input type="range" min="-12" max="12" value={skewAngle} onChange={e => setSkewAngle(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              {errorMsg && (
                <div style={{ padding: 10, background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 11, fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerDownload}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7342e6 0%, #5b30c0 100%)',
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
                  boxShadow: '0 4px 14px rgba(115, 66, 230, 0.28)',
                  transition: 'all 0.18s',
                  marginTop: 10
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isProcessing ? 'Rendering Mockup...' : 'Download Wrapper PNG'}
              </button>
            </div>
          </div>

          {/* Preview column */}
          <div className="col-span-1 lg:col-span-8" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F7FB', minHeight: 480 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#9898B5', textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start', marginBottom: 12 }}>Live Canvas Preview</span>
            <div style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: 12, border: '1px solid #E4E4EF', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: 'auto', background: bgGradient === 'transparent' ? 'repeating-conic-gradient(#F1F1F7 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' : '#ffffff', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
