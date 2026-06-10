"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'bn', 'si', 'nl', 'ja', 'zh-CN', 'ko', 'sv', 'tr', 'id', 'pl'
];

// Helper to set translation cookie
const setTranslationCookie = (lang) => {
  const cookieValue = `/en/${lang}`;
  document.cookie = `googtrans=${cookieValue}; path=/;`;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    if (domainParts.length > 2) {
      const rootDomain = `.${domainParts.slice(-2).join('.')}`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${rootDomain};`;
    }
  }
};

// Helper to trigger Google Translate combo dropdown without page reload
const triggerGoogleTranslate = (lang) => {
  try {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = lang;
      const event = document.createEvent('HTMLEvents');
      event.initEvent('change', true, true);
      combo.dispatchEvent(event);
    }
  } catch (e) {
    console.warn('Failed to trigger Google Translate dropdown:', e);
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const detectLanguage = async () => {
      // 1. Check manual override in sessionStorage
      const manual = sessionStorage.getItem('imagepine_lang_manual');
      if (manual && SUPPORTED_LANGUAGES.includes(manual)) {
        setLanguage(manual);
        setTranslationCookie(manual);
        setIsLoaded(true);
        return;
      }

      // 2. Check session cache in sessionStorage
      const session = sessionStorage.getItem('imagepine_lang_detected');
      if (session && SUPPORTED_LANGUAGES.includes(session)) {
        setLanguage(session);
        setTranslationCookie(session);
        setIsLoaded(true);
        return;
      }

      // Helper to map code to supported code
      const getMappedCode = (rawCode) => {
        if (!rawCode) return 'en';
        const code = rawCode.split('-')[0].toLowerCase();
        if (code === 'zh') {
          return 'zh-CN';
        }
        if (SUPPORTED_LANGUAGES.includes(code)) {
          return code;
        }
        return 'en';
      };

      let detected = 'en';

      // 3. Fetch IP-based language code
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.languages) {
          const ipLangs = data.languages.split(',');
          for (let lang of ipLangs) {
            const mapped = getMappedCode(lang);
            if (mapped !== 'en') {
              detected = mapped;
              break;
            }
          }
        }
      } catch (err) {
        console.warn('IP language detection failed, falling back to browser language:', err);
      }

      // 4. Fallback to navigator.language if IP fails or is english
      if (detected === 'en' && typeof navigator !== 'undefined' && navigator.language) {
        detected = getMappedCode(navigator.language);
      }

      sessionStorage.setItem('imagepine_lang_detected', detected);
      setLanguage(detected);
      setTranslationCookie(detected);
      setIsLoaded(true);
      
      // Reload on first detect to apply Google Translate cleanly
      if (detected !== 'en') {
        document.documentElement.classList.add('lang-loading');
        window.location.reload();
      }
    };

    detectLanguage();
  }, []);

  const changeLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguage(lang);
      sessionStorage.setItem('imagepine_lang_manual', lang);
      setTranslationCookie(lang);
      document.documentElement.classList.add('lang-loading');
      window.location.reload();
    }
  };

  const t = (key) => {
    if (!key) return '';
    if (language === 'en') return key;
    const langTrans = translations[language];
    if (langTrans && langTrans[key] !== undefined) {
      return langTrans[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
