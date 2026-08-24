import React, { useState } from 'react';
import { QuestionOption, OptionLayoutType } from '@eduforge/shared';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';

interface OptionLayoutRendererProps {
  options: QuestionOption[];
  layoutType: OptionLayoutType;
  showAnswers?: boolean;
  onSelectOption?: (optionId: string) => void;
  onUpdateOptionText?: (optionId: string, newText: string) => void;
  className?: string;
  textColorClass?: string;
  isEditable?: boolean;
}

export const OptionLayoutRenderer: React.FC<OptionLayoutRendererProps> = ({
  options,
  layoutType,
  showAnswers = false,
  onSelectOption,
  onUpdateOptionText,
  className = '',
  textColorClass,
  isEditable = false
}) => {
  const [editingOptId, setEditingOptId] = useState<string | null>(null);

  if (!options || options.length === 0) return null;

  const getOptionKeyLabel = (opt: QuestionOption, index: number) => {
    if (layoutType === 'grid_2x2_upper') {
      return `${String.fromCharCode(65 + index)}.`;
    }
    const key = opt.key || String.fromCharCode(97 + index);
    return `(${key})`;
  };

  const normalTextColor = textColorClass || 'text-current';
  const correctTextColor = showAnswers ? 'text-emerald-500 font-bold' : normalTextColor;

  const renderOptionBody = (opt: QuestionOption, idx: number) => {
    if (isEditable && onUpdateOptionText && editingOptId === opt.id) {
      return (
        <input
          type="text"
          autoFocus
          defaultValue={opt.rawText || ''}
          onBlur={e => {
            setEditingOptId(null);
            onUpdateOptionText(opt.id, e.target.value);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setEditingOptId(null);
              onUpdateOptionText(opt.id, e.currentTarget.value);
            }
          }}
          className="flex-1 text-xs font-semibold px-1.5 py-0.5 border border-sky-400 rounded bg-white text-black outline-hidden min-w-[50px]"
        />
      );
    }

    return (
      <div
        onClick={(e) => {
          if (isEditable && onUpdateOptionText) {
            e.stopPropagation();
            setEditingOptId(opt.id);
          }
        }}
        className={`flex-1 font-semibold ${isEditable ? 'cursor-pointer hover:bg-sky-50/50 rounded px-1' : ''}`}
        title={isEditable ? 'Click to edit option formula/text' : undefined}
      >
        <MathTextRenderer text={opt.rawText || ''} />
      </div>
    );
  };

  // 2x2 Grid Layout (default for 4 options)
  if ((layoutType === 'grid_2x2' || layoutType === 'grid_2x2_upper' || layoutType === 'auto') && options.length === 4) {
    return (
      <div className={`grid grid-cols-2 gap-x-8 gap-y-2.5 my-2 pl-4 ${normalTextColor} ${className}`}>
        {options.map((opt, idx) => (
          <div
            key={opt.id || idx}
            onClick={() => onSelectOption && onSelectOption(opt.id)}
            className={`flex items-start gap-2 text-sm leading-snug select-text ${
              showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
            }`}
          >
            <span className={`font-black min-w-[24px] select-none ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {getOptionKeyLabel(opt, idx)}
            </span>
            {renderOptionBody(opt, idx)}
            {showAnswers && opt.isCorrect && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                Correct
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Horizontal Inline Layout
  if (layoutType === 'horizontal') {
    return (
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 my-2 pl-4 ${normalTextColor} ${className}`}>
        {options.map((opt, idx) => (
          <div
            key={opt.id || idx}
            onClick={() => onSelectOption && onSelectOption(opt.id)}
            className={`flex items-center gap-1.5 text-sm leading-snug select-text ${
              showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
            }`}
          >
            <span className={`font-black select-none ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {getOptionKeyLabel(opt, idx)}
            </span>
            {renderOptionBody(opt, idx)}
            {showAnswers && opt.isCorrect && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                ✓
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Vertical Stack Layout (Default fallback)
  return (
    <div className={`flex flex-col gap-y-2 my-2 pl-4 ${normalTextColor} ${className}`}>
      {options.map((opt, idx) => (
        <div
          key={opt.id || idx}
          onClick={() => onSelectOption && onSelectOption(opt.id)}
          className={`flex items-start gap-2 text-sm leading-snug select-text ${
            showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
          }`}
        >
          <span className={`font-black min-w-[24px] select-none ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
            {getOptionKeyLabel(opt, idx)}
          </span>
          {renderOptionBody(opt, idx)}
          {showAnswers && opt.isCorrect && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold ml-2">
              Correct Answer
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
