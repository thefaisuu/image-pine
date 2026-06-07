import React from 'react';

interface Preferences {
  defaultFormat: 'jpeg' | 'png';
  jpegQuality: number;
  autoDownload: boolean;
}

interface PreferenceSettingsProps {
  prefs: Preferences;
  onUpdate: (key: keyof Preferences, value: any) => void;
}

export default function PreferenceSettings({ prefs, onUpdate }: PreferenceSettingsProps) {
  return (
    <div className="bg-white rounded-xl border border-bordercolor p-6 shadow-sm flex flex-col">
      <h2 className="font-semibold text-textmain flex items-center gap-2 text-sm md:text-base mb-4">
        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        App Settings
      </h2>

      <div className="space-y-4">
        {/* Default Format */}
        <div>
          <label className="block text-xs font-semibold text-textmain mb-1.5">
            Default Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['jpeg', 'png'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => onUpdate('defaultFormat', format)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 focus:outline-none ${
                  prefs.defaultFormat === format
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-bordercolor hover:border-gray-400 text-gray-600'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* JPEG Quality */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-textmain">
              JPEG Export Quality
            </label>
            <span className="text-[10px] font-mono font-bold text-primary">
              {Math.round(prefs.jpegQuality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={prefs.jpegQuality}
            onChange={(e) => onUpdate('jpegQuality', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Auto Download Toggle */}
        <div className="flex justify-between items-center pt-3.5 border-t border-bordercolor">
          <div className="pr-2">
            <label className="block text-xs font-semibold text-textmain">
              Instant Download
            </label>
            <span className="text-[9px] text-gray-400 font-medium block mt-0.5 leading-tight">
              Download files as soon as processing completes
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate('autoDownload', !prefs.autoDownload)}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 focus:outline-none flex-shrink-0 ${
              prefs.autoDownload ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                prefs.autoDownload ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
