import React from 'react';
import { X } from 'lucide-react';
import { Question } from '@eduforge/shared';

interface StudentPreviewDrawerProps {
  isOpen: boolean;
  question?: Question | null;
  onClose: () => void;
}

export const StudentPreviewDrawer: React.FC<StudentPreviewDrawerProps> = ({
  isOpen,
  question,
  onClose
}) => {
  if (!isOpen) return null;

  const defaultQuestionText = question?.rawText || 'Identify the structure shown below.';
  const defaultCode = question?.id ? `BIO-CELL-${question.id.slice(-4)}` : 'BIO-CELL-0016';
  const defaultOptions = question?.options && question.options.length > 0
    ? question.options
    : [
        { key: 'A', rawText: 'Nucleus' },
        { key: 'B', rawText: 'Mitochondria' },
        { key: 'C', rawText: 'Ribosome' },
        { key: 'D', rawText: 'Golgi apparatus' }
      ];

  const imageSrc = question?.imageUrl || question?.imageUrls?.[0];

  return (
    <>
      {/* Background Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-150"
      />

      {/* Right Slide-over Panel */}
      <aside className="fixed right-0 top-0 w-full sm:w-[520px] h-full bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-sans">
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h3 className="font-bold text-sm text-slate-900">Student Preview</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-slate-800">
          <span className="text-xs font-mono text-slate-400 block">{defaultCode}</span>
          <h3 className="text-base font-bold text-slate-900">Question Preview</h3>

          <div
            className="text-base leading-relaxed text-slate-900 font-medium"
            dangerouslySetInnerHTML={{ __html: defaultQuestionText }}
          />

          {imageSrc && (
            <div className="my-3 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
              <img src={imageSrc} alt="Question preview illustration" className="max-h-48 object-contain rounded" />
            </div>
          )}

          {question?.diagramSvg && (
            <div className="my-3 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
              <div dangerouslySetInnerHTML={{ __html: question.diagramSvg }} />
            </div>
          )}

          <div className="space-y-2 pt-2">
            {defaultOptions.map((opt, idx) => (
              <div
                key={opt.key || idx}
                className="p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2.5 text-sm font-medium"
              >
                <span className="text-slate-400 font-bold">○</span>
                <span className="font-bold text-slate-900">{opt.key?.toUpperCase() || String.fromCharCode(65 + idx)}.</span>
                <span dangerouslySetInnerHTML={{ __html: opt.rawText || '' }} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
