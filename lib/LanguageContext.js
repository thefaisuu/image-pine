"use client";

import React, { createContext, useContext } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const changeLanguage = () => {};
  const t = (key) => key;

  return (
    <LanguageContext.Provider value={{ language: 'en', changeLanguage, t, isLoaded: true }}>
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
