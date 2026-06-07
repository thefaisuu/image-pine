import React from 'react';

interface HistoryItem {
  id: string;
  timestamp: string;
  toolName: string;
  fileName: string;
}

interface HistoryLogProps {
  history: HistoryItem[];
  onClear: () => void;
}

export default function HistoryLog({ history, onClear }: HistoryLogProps) {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-bordercolor p-6 shadow-sm flex flex-col h-full min-h-[300px] max-h-[380px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-textmain flex items-center gap-2 text-sm md:text-base">
          <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity History
        </h2>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-600 transition-colors font-medium focus:outline-none"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">No recent activity</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Your conversions will appear here</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              className="p-3 bg-lightbg rounded-lg border border-transparent hover:border-bordercolor transition-all duration-200 flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] font-semibold text-primary px-2 py-0.5 bg-blue-50 rounded border border-blue-100">
                  {item.toolName}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <p className="text-xs text-textmain font-medium truncate" title={item.fileName}>
                {item.fileName}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
