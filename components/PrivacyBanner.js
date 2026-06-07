"use client";

import React, { useState, useEffect } from 'react';

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        background: '#EDEDFB',
        borderBottom: '1px solid #D8D8F5',
        padding: '9px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      className="animate-fade-in"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        paddingRight: 32,
      }}>
        {/* Shield Icon */}
        <div style={{
          width: 18, height: 18,
          background: '#5B5BD6',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#3B3B99', letterSpacing: '-0.01em' }}>
          Privacy Guaranteed - your images are processed locally and never uploaded to any server.
        </span>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9898B5', padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
        className="hover:text-[#111128]"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
