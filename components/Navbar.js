"use client";

import React, { useState, useRef, useEffect } from 'react';
import { routeMap, navbarSections as sections } from '@/lib/routes';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const mobileRef = useRef(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getHref = (item) => routeMap[item] || '#';

  return (
    <header
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E4E4EF',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* ── Logo ── */}
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div style={{
            width: 34, height: 34,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(91,91,214,0.35)',
            flexShrink: 0,
          }}>
            {/* Pine tree icon */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L8 8H5l7 7-2 2H9l3 5 3-5h-1l-2-2 7-7h-3L12 2z" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#111128', letterSpacing: '-0.03em' }}>
            Image<span style={{ color: '#5B5BD6' }}>Pine</span>
          </span>
        </a>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {Object.entries(sections).map(([key, section]) => (
            <div key={key} className="group" style={{ position: 'relative', padding: '8px 4px' }}>
              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 600, color: '#6B6B8A',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '5px 10px', borderRadius: 8,
                  transition: 'all 0.15s ease',
                }}
                className="group-hover:text-[#111128] group-hover:bg-[#F7F7FB]"
              >
                {section.title}
                <svg style={{ width: 12, height: 12, transition: 'transform 0.2s ease' }} className="group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                  minWidth: 200,
                  background: '#fff',
                  border: '1px solid #E4E4EF',
                  borderRadius: 12,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)',
                  padding: 6,
                  zIndex: 200,
                }}
                className="opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200"
              >
                {section.items.map((item) => {
                  const href = getHref(item);
                  return (
                    <a
                      key={item}
                      href={href}
                      onClick={href === '#' ? (e) => e.preventDefault() : undefined}
                      style={{
                        display: 'block',
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B6B8A',
                        borderRadius: 8,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                      className="hover:bg-[#F7F7FB] hover:text-[#111128]"
                    >
                      {item}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Right CTA ── */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#EDEDFB',
            color: '#5B5BD6',
            fontSize: 11, fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 99,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="3" />
            </svg>
            Free Online
          </span>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          style={{
            padding: 8, background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B6B8A',
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          style={{
            borderTop: '1px solid #E4E4EF',
            background: '#fff',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
            padding: '12px 16px 20px',
          }}
          className="lg:hidden animate-fade-in"
        >
          {Object.entries(sections).map(([key, section]) => (
            <div key={key} style={{ borderBottom: '1px solid #F1F1F7', marginBottom: 2 }}>
              <button
                onClick={() => setOpenSection(openSection === key ? null : key)}
                type="button"
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '10px 4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, color: '#111128',
                  letterSpacing: '0.02em', textTransform: 'uppercase',
                }}
              >
                {section.title}
                <svg
                  style={{ width: 13, height: 13, color: '#9898B5', transition: 'transform 0.2s', transform: openSection === key ? 'rotate(180deg)' : 'none' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSection === key && (
                <div style={{ padding: '4px 0 10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }} className="animate-fade-in">
                  {section.items.map((item) => {
                    const href = getHref(item);
                    return (
                      <a
                        key={item}
                        href={href}
                        onClick={href === '#' ? (e) => e.preventDefault() : undefined}
                        style={{
                          display: 'block',
                          padding: '7px 10px',
                          fontSize: 12, fontWeight: 600, color: '#6B6B8A',
                          borderRadius: 8, textDecoration: 'none',
                        }}
                        className="hover:bg-[#F7F7FB] hover:text-[#111128]"
                      >
                        {item}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
