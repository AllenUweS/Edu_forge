import React from 'react';
import { ZoomIn, ZoomOut, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useTheme } from '../state/ThemeContext.js';

interface StatusBarProps {
  pageCount: number;
  questionCount: number;
  wordCount: number;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  columns: 1 | 2;
  zoom: number;
  setZoom: (zoom: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  pageCount,
  questionCount,
  wordCount,
  autosaveStatus,
  lastSavedAt,
  columns,
  zoom,
  setZoom
}) => {
  const { theme } = useTheme();

  const getStatusBg = () => {
    if (theme === 'white') return 'bg-[#f1f5f9] text-slate-700 border-slate-300 shadow-xs';
    if (theme === 'dark-blue') return 'bg-[#060e1d] text-slate-200 border-[#1d3557] shadow-md';
    return 'bg-[#181a1f] text-slate-300 border-slate-800 shadow-md';
  };

  return (
    <footer className={`h-7 text-xs px-4 flex items-center justify-between border-t select-none no-print fixed bottom-0 left-0 right-0 z-40 transition-colors duration-200 ${getStatusBg()}`}>
      
      {/* Left Metadata */}
      <div className="flex items-center gap-4 text-[11px]">
        <span>
          <strong className={theme === 'white' ? 'text-slate-900' : 'text-white'}>{pageCount}</strong> Page{pageCount !== 1 ? 's' : ''} (A4)
        </span>
        <span className="text-slate-500">|</span>
        <span>
          <strong className={theme === 'white' ? 'text-slate-900' : 'text-white'}>{questionCount}</strong> Question{questionCount !== 1 ? 's' : ''}
        </span>
        <span className="text-slate-500">|</span>
        <span>
          <strong className={theme === 'white' ? 'text-slate-900' : 'text-white'}>{wordCount}</strong> Words
        </span>
        <span className="text-slate-500">|</span>
        <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded font-semibold text-[10px]">
          {columns} Column{columns > 1 ? 's' : ''}
        </span>
      </div>

      {/* Center Autosave Status */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {autosaveStatus === 'saving' ? (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
          </span>
        ) : autosaveStatus === 'error' ? (
          <span className="flex items-center gap-1 text-red-400 font-medium">
            <AlertCircle className="w-3 h-3" /> Save Error
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Check className="w-3 h-3" />
            {lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : 'Saved'}
          </span>
        )}
      </div>

      {/* Right Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="p-0.5 hover:text-sky-400 rounded"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-20 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />

        <button
          type="button"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="p-0.5 hover:text-sky-400 rounded"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className={`font-mono text-[10px] w-8 text-right font-bold ${theme === 'white' ? 'text-slate-800' : 'text-slate-200'}`}>
          {zoom}%
        </span>
      </div>

    </footer>
  );
};
