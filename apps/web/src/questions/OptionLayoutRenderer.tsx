import React from 'react';
import { QuestionOption, OptionLayoutType } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';

interface OptionLayoutRendererProps {
  options: QuestionOption[];
  layoutType: OptionLayoutType;
  showAnswers?: boolean;
  onSelectOption?: (optionId: string) => void;
  className?: string;
  textColorClass?: string;
}

export const OptionLayoutRenderer: React.FC<OptionLayoutRendererProps> = ({
  options,
  layoutType,
  showAnswers = false,
  onSelectOption,
  className = '',
  textColorClass
}) => {
  if (!options || options.length === 0) return null;

  const renderOptionContent = (opt: QuestionOption) => {
    if (!opt.rawText) return null;
    const isMath = opt.rawText.includes('\\') || opt.rawText.includes('$') || opt.rawText.includes('{');
    if (isMath) {
      const cleanLatex = opt.rawText.replace(/^\$+|\$+$/g, '');
      return <KaTeXRenderer math={cleanLatex} />;
    }
    return <span>{opt.rawText}</span>;
  };

  const getOptionKeyLabel = (opt: QuestionOption, index: number) => {
    if (layoutType === 'grid_2x2_upper') {
      return `${String.fromCharCode(65 + index)}.`;
    }
    const key = opt.key || String.fromCharCode(97 + index);
    return `(${key})`;
  };

  const normalTextColor = textColorClass || 'text-current';
  const correctTextColor = showAnswers ? 'text-emerald-500 font-bold' : normalTextColor;

  // 2x2 Grid Layout (default for 4 options)
  if ((layoutType === 'grid_2x2' || layoutType === 'grid_2x2_upper' || layoutType === 'auto') && options.length === 4) {
    return (
      <div className={`grid grid-cols-2 gap-x-8 gap-y-2.5 my-2 pl-4 ${normalTextColor} ${className}`}>
        {options.map((opt, idx) => (
          <div
            key={opt.id || idx}
            onClick={() => onSelectOption && onSelectOption(opt.id)}
            className={`flex items-start gap-2 text-sm leading-snug cursor-default select-text ${
              showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
            }`}
          >
            <span className={`font-black min-w-[24px] ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {getOptionKeyLabel(opt, idx)}
            </span>
            <div className={`flex-1 font-semibold ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {renderOptionContent(opt)}
            </div>
            {showAnswers && opt.isCorrect && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
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
      <div className={`flex flex-wrap items-center gap-x-8 gap-y-2 my-2 pl-4 ${normalTextColor} ${className}`}>
        {options.map((opt, idx) => (
          <div
            key={opt.id || idx}
            onClick={() => onSelectOption && onSelectOption(opt.id)}
            className={`flex items-center gap-2 text-sm leading-snug ${
              showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
            }`}
          >
            <span className={`font-black ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {getOptionKeyLabel(opt, idx)}
            </span>
            <div className={`font-semibold ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
              {renderOptionContent(opt)}
            </div>
            {showAnswers && opt.isCorrect && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                Correct
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Vertical Stack Layout (1 per line)
  return (
    <div className={`flex flex-col gap-2 my-2 pl-4 ${normalTextColor} ${className}`}>
      {options.map((opt, idx) => (
        <div
          key={opt.id || idx}
          onClick={() => onSelectOption && onSelectOption(opt.id)}
          className={`flex items-start gap-2 text-sm leading-snug ${
            showAnswers && opt.isCorrect ? correctTextColor : normalTextColor
          }`}
        >
          <span className={`font-black min-w-[24px] ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
            {getOptionKeyLabel(opt, idx)}
          </span>
          <div className={`flex-1 font-semibold ${showAnswers && opt.isCorrect ? correctTextColor : normalTextColor}`}>
            {renderOptionContent(opt)}
          </div>
          {showAnswers && opt.isCorrect && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
              Correct
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
