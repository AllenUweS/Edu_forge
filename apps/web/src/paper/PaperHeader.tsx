import React from 'react';
import { PaperMetadata } from '@eduforge/shared';
import { Edit3 } from 'lucide-react';

interface PaperHeaderProps {
  metadata: PaperMetadata;
  onEditMetadata?: () => void;
}

export const PaperHeader: React.FC<PaperHeaderProps> = ({
  metadata,
  onEditMetadata
}) => {
  return (
    <div
      onClick={onEditMetadata}
      className="relative group border-2 border-black bg-white p-3.5 mb-4 rounded-xs cursor-pointer hover:bg-sky-50/30 transition-colors text-black"
      title="Click to edit paper header and metadata"
    >
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
        <button
          type="button"
          className="p-1 bg-slate-900 text-white rounded text-xs flex items-center gap-1 px-2 font-bold shadow-xs"
        >
          <Edit3 className="w-3 h-3" /> Edit Header
        </button>
      </div>

      {metadata.instituteName && (
        <h1 className="text-base sm:text-lg font-black tracking-wide text-black uppercase text-center mb-0.5">
          {metadata.instituteName}
        </h1>
      )}

      {metadata.examName && (
        <h2 className="text-xs sm:text-sm font-bold text-black text-center mb-2">
          {metadata.examName}
        </h2>
      )}

      <div className="flex items-center justify-between border-y border-black py-1.5 px-2 text-xs font-bold text-black mb-2">
        <span><strong>Subject:</strong> {metadata.subject || 'General Science'}</span>
        <span><strong>Time:</strong> {metadata.timeAllowedMinutes || 180} Mins</span>
        <span><strong>Max Marks:</strong> {metadata.maxMarks || 100}</span>
      </div>

      {metadata.generalInstructions && metadata.generalInstructions.length > 0 && (
        <div className="text-[10px] sm:text-[11px] text-black font-medium leading-snug">
          <span className="font-bold underline block mb-0.5">General Instructions:</span>
          <ol className="list-decimal list-inside space-y-0.5 pl-1">
            {metadata.generalInstructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
