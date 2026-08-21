import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Template } from '@eduforge/shared';
import { LayoutTemplate, ArrowLeft, Plus, Check, Award, School, Columns } from 'lucide-react';
import { useTheme } from '../state/ThemeContext.js';

interface TemplatesPageProps {
  onBackToDashboard: () => void;
  onUseTemplate: (template: Template) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  onBackToDashboard,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (category: string) => {
    if (theme === 'white') {
      switch (category) {
        case 'competitive': return <Award className="w-6 h-6 text-black" />;
        case 'school': return <School className="w-6 h-6 text-black" />;
        default: return <Columns className="w-6 h-6 text-black" />;
      }
    }
    switch (category) {
      case 'competitive': return <Award className="w-6 h-6 text-amber-400" />;
      case 'school': return <School className="w-6 h-6 text-emerald-400" />;
      default: return <Columns className="w-6 h-6 text-sky-400" />;
    }
  };

  const getCardBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#0f1e36] border-[#1d3557] text-slate-100';
    return 'bg-slate-800/90 border-slate-700/80 text-slate-100';
  };

  const getInnerCardBg = () => {
    if (theme === 'white') return 'bg-slate-50 border-slate-200 text-black';
    if (theme === 'dark-blue') return 'bg-[#071329] border-[#1d3557]/60 text-slate-300';
    return 'bg-slate-900/60 border-slate-700/60 text-slate-300';
  };

  const getTitleColor = () => {
    if (theme === 'white') return 'text-slate-900';
    return 'text-white';
  };

  const getSubtitleColor = () => {
    if (theme === 'white') return 'text-slate-600 font-medium';
    if (theme === 'dark-blue') return 'text-sky-300/70';
    return 'text-slate-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-700/40 pb-4">
        <button
          type="button"
          onClick={onBackToDashboard}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'white'
              ? 'hover:bg-slate-100 text-black'
              : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`p-2.5 rounded-xl border ${
          theme === 'white'
            ? 'bg-slate-100 text-black border-slate-300'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          <LayoutTemplate className="w-6 h-6" />
        </div>
        <div>
          <h1 className={`text-xl font-black ${getTitleColor()}`}>Exam Layout Templates</h1>
          <p className={`text-xs ${getSubtitleColor()}`}>Standardized question paper templates for entrance exams, board tests, and generic evaluations</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className={`p-5 rounded-2xl border shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between ${getCardBg()}`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${
                    theme === 'white'
                      ? 'bg-slate-100 border-slate-300 text-black'
                      : 'bg-slate-800/40 border-slate-700/50'
                  }`}>
                    {getTemplateIcon(tpl.category)}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold leading-snug ${getTitleColor()}`}>{tpl.name}</h3>
                    <span className={`text-[11px] font-semibold capitalize ${getSubtitleColor()}`}>{tpl.category}</span>
                  </div>
                </div>
                {tpl.isSystem && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    theme === 'white'
                      ? 'bg-slate-100 text-black border-slate-300'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60'
                  }`}>
                    Built-in
                  </span>
                )}
              </div>

              <p className={`text-xs mb-4 leading-relaxed ${getSubtitleColor()}`}>{tpl.description}</p>

              <div className={`space-y-1.5 text-xs p-3 rounded-xl border mb-4 ${getInnerCardBg()}`}>
                <div className="flex justify-between">
                  <span className={getSubtitleColor()}>Columns:</span>
                  <span className="font-semibold">{tpl.settings.columns} Column Layout</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtitleColor()}>Font:</span>
                  <span className="font-semibold">{tpl.settings.defaultFont} ({tpl.settings.defaultFontSize}pt)</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtitleColor()}>Margins:</span>
                  <span className="font-semibold">{tpl.settings.margins.top}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className={getSubtitleColor()}>Header Box:</span>
                  <span className="font-semibold">{tpl.defaultMetadata.headerTemplate || 'Boxed'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUseTemplate(tpl)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-98"
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
