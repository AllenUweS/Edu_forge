import React, { useState, useEffect } from 'react';
import { QuestionOption, OptionLayoutType } from '@eduforge/shared';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { Edit3, Check, Sparkles, Plus, Trash2 } from 'lucide-react';

interface OptionLayoutRendererProps {
  options: QuestionOption[];
  layoutType: OptionLayoutType;
  showAnswers?: boolean;
  onSelectOption?: (optionId: string) => void;
  onUpdateOptionText?: (optionId: string, newText: string) => void;
  onToggleCorrectOption?: (optionId: string) => void;
  onRemoveOption?: (optionId: string) => void;
  className?: string;
  textColorClass?: string;
  isEditable?: boolean;
}

const EditableOptionItem: React.FC<{
  opt: QuestionOption;
  label: string;
  isCorrect: boolean;
  showAnswers: boolean;
  isEditable: boolean;
  onSelectOption?: (optionId: string) => void;
  onUpdateOptionText?: (optionId: string, newText: string) => void;
  onToggleCorrectOption?: (optionId: string) => void;
  onRemoveOption?: (optionId: string) => void;
  textColorClass: string;
}> = ({
  opt,
  label,
  isCorrect,
  showAnswers,
  isEditable,
  onSelectOption,
  onUpdateOptionText,
  onToggleCorrectOption,
  onRemoveOption,
  textColorClass
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [optText, setOptText] = useState(opt.rawText || '');

  useEffect(() => {
    setOptText(opt.rawText || '');
  }, [opt.rawText]);

  // Drop handler: drop science formulas/constants directly into this option
  const handleDropOnOption = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const eduData = e.dataTransfer.getData('application/eduforge-item');
      let inserted = '';
      if (eduData) {
        const item = JSON.parse(eduData);
        inserted = item.latex || item.symbol || item.value || item.formula || '';
      } else {
        inserted = e.dataTransfer.getData('text/plain') || '';
      }

      if (inserted && onUpdateOptionText) {
        const current = opt.rawText || '';
        const updated = current ? `${current} ${inserted}` : inserted;
        setOptText(updated);
        onUpdateOptionText(opt.id, updated);
      }
    } catch (err) {
      console.error('Error dropping on option:', err);
    }
  };

  const handleCommitText = () => {
    setIsEditing(false);
    if (onUpdateOptionText && optText !== opt.rawText) {
      onUpdateOptionText(opt.id, optText);
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDropOnOption}
      className={`flex items-start gap-1.5 text-sm leading-snug p-1 rounded-md transition-all group/opt ${
        isCorrect && showAnswers ? 'bg-emerald-50 text-emerald-950 font-bold' : ''
      } ${textColorClass}`}
    >
      {/* Option Key Label (a), (b) etc. */}
      <span
        onClick={() => onToggleCorrectOption && onToggleCorrectOption(opt.id)}
        className={`font-black min-w-[24px] select-none text-slate-800 ${
          isEditable ? 'cursor-pointer hover:text-emerald-700' : ''
        }`}
        title={isEditable ? 'Click to toggle correct answer' : undefined}
      >
        {label}
      </span>

      {/* Option Body (Editable & Formatted as Equation) */}
      {isEditing && isEditable ? (
        <input
          type="text"
          autoFocus
          value={optText}
          onChange={e => setOptText(e.target.value)}
          onBlur={handleCommitText}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCommitText();
          }}
          className="flex-1 text-xs font-semibold px-1.5 py-0.5 border border-sky-400 rounded bg-white text-black outline-hidden min-w-[60px] shadow-2xs"
        />
      ) : (
        <div
          onClick={(e) => {
            if (isEditable && onUpdateOptionText) {
              e.stopPropagation();
              setIsEditing(true);
            } else if (onSelectOption) {
              onSelectOption(opt.id);
            }
          }}
          className={`flex-1 font-semibold ${
            isEditable
              ? 'cursor-pointer hover:bg-sky-50/70 hover:border-sky-300 border border-transparent rounded px-1 transition-all'
              : ''
          }`}
          title={isEditable ? 'Click to edit option text or drop science formula' : undefined}
        >
          <MathTextRenderer text={opt.rawText || ''} />
        </div>
      )}

      {/* Correct answer indicator */}
      {showAnswers && isCorrect && (
        <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-200">
          Ans
        </span>
      )}

      {/* Quick remove option button */}
      {isEditable && onRemoveOption && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveOption(opt.id);
          }}
          className="opacity-0 group-hover/opt:opacity-100 p-0.5 text-slate-400 hover:text-red-600 rounded transition-opacity cursor-pointer no-print"
          title="Remove option"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const OptionLayoutRenderer: React.FC<OptionLayoutRendererProps> = ({
  options,
  layoutType,
  showAnswers = false,
  onSelectOption,
  onUpdateOptionText,
  onToggleCorrectOption,
  onRemoveOption,
  className = '',
  textColorClass = 'text-current',
  isEditable = false
}) => {
  if (!options || options.length === 0) return null;

  const getOptionKeyLabel = (opt: QuestionOption, index: number) => {
    if (layoutType === 'grid_2x2_upper') {
      return `${String.fromCharCode(65 + index)}.`;
    }
    const key = opt.key || String.fromCharCode(97 + index);
    return `(${key})`;
  };

  // 2x2 Grid Layout (default for 4 options)
  if ((layoutType === 'grid_2x2' || layoutType === 'grid_2x2_upper' || layoutType === 'auto') && options.length === 4) {
    return (
      <div className={`grid grid-cols-2 gap-x-6 gap-y-1.5 my-1.5 pl-4 ${className}`}>
        {options.map((opt, idx) => (
          <EditableOptionItem
            key={opt.id || idx}
            opt={opt}
            label={getOptionKeyLabel(opt, idx)}
            isCorrect={Boolean(opt.isCorrect)}
            showAnswers={showAnswers}
            isEditable={isEditable}
            onSelectOption={onSelectOption}
            onUpdateOptionText={onUpdateOptionText}
            onToggleCorrectOption={onToggleCorrectOption}
            onRemoveOption={onRemoveOption}
            textColorClass={textColorClass}
          />
        ))}
      </div>
    );
  }

  // Horizontal Inline Layout
  if (layoutType === 'horizontal') {
    return (
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-1.5 my-1.5 pl-4 ${className}`}>
        {options.map((opt, idx) => (
          <EditableOptionItem
            key={opt.id || idx}
            opt={opt}
            label={getOptionKeyLabel(opt, idx)}
            isCorrect={Boolean(opt.isCorrect)}
            showAnswers={showAnswers}
            isEditable={isEditable}
            onSelectOption={onSelectOption}
            onUpdateOptionText={onUpdateOptionText}
            onToggleCorrectOption={onToggleCorrectOption}
            onRemoveOption={onRemoveOption}
            textColorClass={textColorClass}
          />
        ))}
      </div>
    );
  }

  // Vertical Stack Layout (Default fallback)
  return (
    <div className={`flex flex-col gap-y-1.5 my-1.5 pl-4 ${className}`}>
      {options.map((opt, idx) => (
        <EditableOptionItem
          key={opt.id || idx}
          opt={opt}
          label={getOptionKeyLabel(opt, idx)}
          isCorrect={Boolean(opt.isCorrect)}
          showAnswers={showAnswers}
          isEditable={isEditable}
          onSelectOption={onSelectOption}
          onUpdateOptionText={onUpdateOptionText}
          onToggleCorrectOption={onToggleCorrectOption}
          onRemoveOption={onRemoveOption}
          textColorClass={textColorClass}
        />
      ))}
    </div>
  );
};
