import React, { useState } from 'react';
import { Question, QuestionOption, OptionLayoutType, QuestionDifficulty } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { HelpCircle, X, Check, Plus, Trash2, Sigma, Sparkles, BookOpen } from 'lucide-react';

interface QuestionBuilderModalProps {
  isOpen: boolean;
  initialQuestion?: Partial<Question>;
  onClose: () => void;
  onSave: (question: Question) => void;
}

export const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  isOpen,
  initialQuestion,
  onClose,
  onSave
}) => {
  const [questionNumber, setQuestionNumber] = useState<string | number>(initialQuestion?.questionNumber || 1);
  const [rawText, setRawText] = useState(initialQuestion?.rawText || '');
  const [subject, setSubject] = useState(initialQuestion?.subject || 'Physics');
  const [chapter, setChapter] = useState(initialQuestion?.chapter || '');
  const [topic, setTopic] = useState(initialQuestion?.topic || '');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialQuestion?.difficulty || 'Medium');
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialQuestion?.negativeMarks !== undefined ? initialQuestion.negativeMarks : 1);
  const [optionLayout, setOptionLayout] = useState<OptionLayoutType>(initialQuestion?.optionLayout || 'grid_2x2');
  const [tagsInput, setTagsInput] = useState<string>((initialQuestion?.tags || []).join(', '));
  const [explanationText, setExplanationText] = useState(initialQuestion?.explanationText || '');

  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : [
          { id: 'opt-1', key: 'a', rawText: '', isCorrect: true, content: [] },
          { id: 'opt-2', key: 'b', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-3', key: 'c', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-4', key: 'd', rawText: '', isCorrect: false, content: [] }
        ]
  );

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextKey = String.fromCharCode(97 + options.length);
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, key: nextKey, rawText: '', isCorrect: false, content: [] }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, idx) => idx !== index).map((opt, idx) => ({
      ...opt,
      key: String.fromCharCode(97 + idx)
    }));
    // If the removed one was correct, set first one as correct
    if (!updated.some(o => o.isCorrect) && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setOptions(updated);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].rawText = text;
    setOptions(updated);
  };

  const handleSetCorrect = (index: number) => {
    const updated = options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index
    }));
    setOptions(updated);
  };

  const handleSave = () => {
    const correctOpt = options.find(o => o.isCorrect);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const question: Question = {
      id: initialQuestion?.id || `q-${Date.now()}`,
      questionNumber,
      questionType: 'MCQ_SINGLE',
      rawText,
      content: [
        {
          id: `p-${Date.now()}`,
          type: 'paragraph',
          runs: [{ id: `t-${Date.now()}`, text: rawText }]
        }
      ],
      options: options.map(o => ({
        ...o,
        content: [{ id: `p-${Date.now()}`, type: 'paragraph', runs: [{ id: `t-${Date.now()}`, text: o.rawText || '' }] }]
      })),
      correctAnswer: correctOpt?.key || 'a',
      marks,
      negativeMarks,
      subject,
      chapter,
      topic,
      difficulty,
      tags,
      optionLayout,
      explanationText,
      isSystem: false,
      createdAt: initialQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(question);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white text-black rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">
                {initialQuestion?.id ? 'Edit MCQ Question' : 'Create New MCQ Question'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">Configure question statement, options, scoring, subject metadata, and answer key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-black hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Metadata Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Q. No.
              </label>
              <input
                type="text"
                value={questionNumber}
                onChange={e => setQuestionNumber(e.target.value)}
                className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="General Science">General Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(Number(e.target.value))}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  -ve Marks
                </label>
                <input
                  type="number"
                  value={negativeMarks}
                  onChange={e => setNegativeMarks(Number(e.target.value))}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Chapter & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Chapter / Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Kinematics, Thermodynamics, Electrostatics..."
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Projectile Motion, Carnot Engine..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Question Statement */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-black">
                Question Statement
              </label>
              <span className="text-[11px] text-slate-500 font-medium">LaTeX math formulas (e.g. \frac{"{a}"}{"{b}"}) supported</span>
            </div>
            <textarea
              rows={3}
              placeholder="Enter question text or math equation (e.g. A particle of mass m is projected with velocity u...)"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              className="w-full text-sm font-semibold p-3 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
            />
            {rawText && (rawText.includes('\\') || rawText.includes('$')) && (
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-300 rounded-md text-black">
                <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Math Preview:</span>
                <KaTeXRenderer math={rawText.replace(/^\$+|\$+$/g, '')} />
              </div>
            )}
          </div>

          {/* Options Header & Layout */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  Multiple Choice Options ({options.length} options)
                </h4>
                <span className="text-[11px] text-slate-600 font-medium">Select the radio button for the correct answer key</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-black font-bold">Layout:</span>
                  <select
                    value={optionLayout}
                    onChange={e => setOptionLayout(e.target.value as OptionLayoutType)}
                    className="text-xs font-bold p-1 border border-slate-300 rounded bg-white text-black shadow-2xs"
                  >
                    <option value="grid_2x2">2x2 Grid (a) (b) / (c) (d)</option>
                    <option value="grid_2x2_upper">2x2 Grid A. B. / C. D.</option>
                    <option value="vertical">Vertical Stack</option>
                    <option value="horizontal">Horizontal Inline</option>
                  </select>
                </div>

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-300 hover:border-sky-400 text-sky-800 text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <label className="flex items-center gap-1.5 cursor-pointer" title="Mark as correct answer">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={() => handleSetCorrect(idx)}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span className={`text-xs font-bold uppercase min-w-[20px] ${opt.isCorrect ? 'text-emerald-700 font-black' : 'text-black'}`}>
                      ({opt.key})
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder={`Option (${opt.key}) text or formula (e.g. H = \\frac{u^2}{2g})`}
                    value={opt.rawText || ''}
                    onChange={e => handleOptionTextChange(idx, e.target.value)}
                    className="flex-1 text-sm font-semibold p-1.5 border border-slate-300 rounded text-black bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 placeholder:text-slate-400"
                  />

                  {opt.rawText && (opt.rawText.includes('\\') || opt.rawText.includes('$')) && (
                    <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded max-w-[150px] overflow-hidden text-xs text-black">
                      <KaTeXRenderer math={opt.rawText.replace(/^\$+|\$+$/g, '')} />
                    </div>
                  )}

                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Solution / Explanation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Detailed step-by-step solution or rationale..."
                value={explanationText}
                onChange={e => setExplanationText(e.target.value)}
                className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. jee-main, formulas, mechanics, medium"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs font-bold text-black">
            {marks} Marks ({negativeMarks ? `-${negativeMarks} negative` : 'No negative marking'})
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
              <Check className="w-4 h-4" /> Save Question
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
