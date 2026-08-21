import React, { useState } from 'react';
import { MathAST } from '@eduforge/shared';
import { KaTeXRenderer } from './KaTeXRenderer.js';
import { EquationPalette } from './EquationPalette.js';
import { Sigma, X, Check, ArrowRight, Sparkles, Code } from 'lucide-react';

interface EquationEditorModalProps {
  isOpen: boolean;
  initialLatex?: string;
  onClose: () => void;
  onSave: (latex: string, ast: MathAST) => void;
}

export const EquationEditorModal: React.FC<EquationEditorModalProps> = ({
  isOpen,
  initialLatex = '',
  onClose,
  onSave
}) => {
  const [latex, setLatex] = useState<string>(initialLatex);
  const [activeTab, setActiveTab] = useState<'palette' | 'latex'>('palette');

  if (!isOpen) return null;

  const handleInsertSnippet = (snippet: string) => {
    setLatex(prev => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleSave = () => {
    if (!latex.trim()) {
      alert('Please enter a LaTeX equation expression');
      return;
    }
    const defaultAst: MathAST = {
      version: '1.0',
      nodes: [],
      rawLatex: latex.trim()
    };
    onSave(latex.trim(), defaultAst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white text-black rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Equation Editor & Math AST Builder</h3>
              <p className="text-xs text-slate-600 font-medium">Construct high-resolution mathematical formulas for questions and documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-black hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="p-6 bg-slate-950 text-white flex flex-col items-center justify-center min-h-[110px] border-b border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> High-Resolution Formula Preview
          </div>
          <div className="text-xl md:text-2xl text-white px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 w-full text-center overflow-x-auto">
            {latex ? (
              <KaTeXRenderer math={latex} block={true} className="text-white" />
            ) : (
              <span className="text-slate-400 italic text-sm">Formula will appear here...</span>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('palette')}
            className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'palette'
                ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-black'
            }`}
          >
            <Sigma className="w-4 h-4" /> Visual Construct Palette
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('latex')}
            className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'latex'
                ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-black'
            }`}
          >
            <Code className="w-4 h-4" /> Raw LaTeX Script
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[360px]">
          {activeTab === 'palette' ? (
            <EquationPalette onInsertConstruct={handleInsertSnippet} />
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-black">
                LaTeX Formula Expression
              </label>
              <textarea
                value={latex}
                onChange={e => setLatex(e.target.value)}
                rows={4}
                placeholder="e.g. \frac{u^2 \sin^2\theta}{2g} or \int_{0}^{\infty} e^{-x^2} dx"
                className="w-full font-mono text-sm font-semibold p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white text-black shadow-2xs placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Standard LaTeX math syntax supported with AMSMath extensions.</span>
                <button
                  type="button"
                  onClick={() => setLatex('')}
                  className="text-red-600 font-bold hover:underline"
                >
                  Clear Expression
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-black font-bold font-mono truncate max-w-sm">
            {latex ? `LaTeX: ${latex}` : 'No equation'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-black hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" /> Insert Equation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
