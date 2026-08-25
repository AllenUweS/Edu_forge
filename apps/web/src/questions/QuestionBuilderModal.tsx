import React, { useState, useRef } from 'react';
import { Question, QuestionOption, OptionLayoutType, QuestionDifficulty } from '@eduforge/shared';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { MathTypeEditor } from '../equation/MathTypeEditor.js';
import { DiagramStudioModal } from './DiagramStudioModal.js';
import { api } from '../services/api.js';
import {
  HelpCircle, X, Check, Plus, Trash2, Sigma, Sparkles,
  Image as ImageIcon, Palette, Upload, Loader2
} from 'lucide-react';

interface QuestionBuilderModalProps {
  isOpen: boolean;
  initialQuestion?: Partial<Question>;
  onClose: () => void;
  onSave: (question: Question) => void;
}

type MathTypeTarget =
  | { field: 'statement' }
  | { field: 'option'; index: number; key: string }
  | { field: 'explanation' };

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
  const [diagramSvg, setDiagramSvg] = useState<string>(initialQuestion?.diagramSvg || '');
  const [imageUrl, setImageUrl] = useState<string>(initialQuestion?.imageUrl || initialQuestion?.diagramUrl || '');
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState<boolean>(false);
  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null);

  // Hidden file input refs
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const optionImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // MathType Visual Equation Editor integration
  const [isMathTypeOpen, setIsMathTypeOpen] = useState<boolean>(false);
  const [mathTypeTarget, setMathTypeTarget] = useState<MathTypeTarget>({ field: 'statement' });
  const [mathTypeInitial, setMathTypeInitial] = useState<string>('');

  // Diagram Studio integration
  const [isDiagramStudioOpen, setIsDiagramStudioOpen] = useState<boolean>(false);

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
    updated[index] = { ...updated[index], rawText: text };
    setOptions(updated);
  };

  const handleSetCorrect = (index: number) => {
    const updated = options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index
    }));
    setOptions(updated);
  };

  // Upload Question Image from local file
  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingQuestionImage(true);
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
    } catch (err) {
      console.error('Question image upload error:', err);
    } finally {
      setIsUploadingQuestionImage(false);
      if (questionImageInputRef.current) questionImageInputRef.current.value = '';
    }
  };

  // Upload Option Image from local file
  const handleOptionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOptionIdx(index);
      const res = await api.uploadImage(file);
      const updated = [...options];
      updated[index] = { ...updated[index], imageUrl: res.url };
      setOptions(updated);
    } catch (err) {
      console.error('Option image upload error:', err);
    } finally {
      setUploadingOptionIdx(null);
      if (optionImageInputRefs.current[index]) {
        optionImageInputRefs.current[index]!.value = '';
      }
    }
  };

  const handleRemoveOptionImage = (index: number) => {
    const updated = [...options];
    updated[index] = { ...updated[index], imageUrl: undefined };
    setOptions(updated);
  };

  const openMathTypeForStatement = () => {
    setMathTypeTarget({ field: 'statement' });
    setMathTypeInitial(rawText);
    setIsMathTypeOpen(true);
  };

  const openMathTypeForOption = (index: number, key: string, currentText: string) => {
    setMathTypeTarget({ field: 'option', index, key });
    setMathTypeInitial(currentText);
    setIsMathTypeOpen(true);
  };

  const openMathTypeForExplanation = () => {
    setMathTypeTarget({ field: 'explanation' });
    setMathTypeInitial(explanationText);
    setIsMathTypeOpen(true);
  };

  const handleInsertMathTypeFormula = (formulaLatex: string) => {
    if (mathTypeTarget.field === 'statement') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      setRawText(prev => (prev.trim() ? `${prev.trim()} ${formatted}` : formatted));
    } else if (mathTypeTarget.field === 'option') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      handleOptionTextChange(mathTypeTarget.index, formatted);
    } else if (mathTypeTarget.field === 'explanation') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      setExplanationText(prev => (prev.trim() ? `${prev.trim()} ${formatted}` : formatted));
    }
  };

  const getTargetLabel = () => {
    if (mathTypeTarget.field === 'statement') return 'Question Statement';
    if (mathTypeTarget.field === 'option') return `Option (${mathTypeTarget.key})`;
    if (mathTypeTarget.field === 'explanation') return 'Solution / Explanation';
    return 'Question Field';
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
        imageUrl: o.imageUrl || undefined,
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
      diagramSvg: diagramSvg || undefined,
      imageUrl: imageUrl || undefined,
      diagramUrl: imageUrl || undefined,
      isSystem: false,
      createdAt: initialQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(question);
    onClose();
  };

  return (
    <>
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
                <p className="text-xs text-slate-600 font-medium">Configure statement, formulas with MathType, local image attachments, diagrams, and options</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
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

            {/* Question Statement with MathType, Local Image Upload & Diagram Studio */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Question Statement
                </label>
                <div className="flex items-center gap-2">
                  {/* Upload Image from Local System for Question */}
                  <input
                    ref={questionImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQuestionImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => questionImageInputRef.current?.click()}
                    disabled={isUploadingQuestionImage}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingQuestionImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{imageUrl ? 'Change Image' : 'Add Question Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openMathTypeForStatement}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Sigma className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>MathType Formula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDiagramStudioOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{diagramSvg ? 'Edit Diagram' : 'Draw Shapes'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Enter question statement (e.g. In the circuit shown below, determine the equivalent resistance...)"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full text-sm font-semibold p-3 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400"
              />

              {/* Uploaded Question Image Preview */}
              {imageUrl && (
                <div className="mt-2.5 p-3 bg-amber-50/70 border-2 border-amber-300 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 bg-white border border-amber-300 rounded-lg p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Attached Question Asset"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith('.heic') || target.src.endsWith('.HEIC')) {
                            target.src = target.src.replace(/\.heic$/i, '.jpg');
                          }
                        }}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-950 block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-amber-600" /> Question Image Attached (Local Upload)
                      </span>
                      <span className="text-[10px] text-slate-500">Will render directly with the question statement</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => questionImageInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attached SVG Diagram Preview */}
              {diagramSvg && (
                <div className="mt-2.5 p-3 bg-slate-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 bg-white border border-slate-300 rounded-lg p-1 overflow-hidden flex items-center justify-center">
                      <div className="w-full h-full scale-90" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> SVG Diagram Attached
                      </span>
                      <span className="text-[10px] text-slate-500">Will render cleanly above/below options on the question paper</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsDiagramStudioOpen(true)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramSvg('')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Remove diagram"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {rawText && (rawText.includes('\\') || rawText.includes('$')) && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-300 rounded-md text-black">
                  <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Math Preview:</span>
                  <MathTextRenderer text={rawText} />
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
                  <span className="text-[11px] text-slate-600 font-medium">Add text, formulas, or images from your local system for each option</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-black font-bold">Layout:</span>
                    <select
                      value={optionLayout}
                      onChange={e => setOptionLayout(e.target.value as OptionLayoutType)}
                      className="text-xs font-bold p-1 border border-slate-300 rounded bg-white text-black shadow-2xs cursor-pointer"
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
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-300 hover:border-sky-400 text-sky-800 text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={opt.id || idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-1.5 cursor-pointer" title="Mark as correct answer">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrect(idx)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                        className="flex-1 text-sm font-semibold p-1.5 border border-slate-300 rounded text-black bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                      />

                      {/* MathType Button for Option */}
                      <button
                        type="button"
                        onClick={() => openMathTypeForOption(idx, opt.key, opt.rawText || '')}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title={`Open MathType Formula Editor for Option (${opt.key})`}
                      >
                        <Sigma className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Math</span>
                      </button>

                      {/* Option Image Upload Trigger */}
                      <input
                        ref={el => (optionImageInputRefs.current[idx] = el)}
                        type="file"
                        accept="image/*"
                        onChange={e => handleOptionImageUpload(idx, e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => optionImageInputRefs.current[idx]?.click()}
                        disabled={uploadingOptionIdx === idx}
                        className={`p-1.5 border rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                          opt.imageUrl
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title={`Upload local image for Option (${opt.key})`}
                      >
                        {uploadingOptionIdx === idx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline text-[11px]">
                          {opt.imageUrl ? 'Image' : 'Add Img'}
                        </span>
                      </button>

                      {opt.rawText && (opt.rawText.includes('\\') || opt.rawText.includes('$')) && (
                        <div className="px-2 py-1 bg-slate-50 border border-slate-200 rounded max-w-[130px] overflow-hidden text-xs text-black">
                          <MathTextRenderer text={opt.rawText} />
                        </div>
                      )}

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Option Image Preview Thumbnail */}
                    {opt.imageUrl && (
                      <div className="pl-7 pt-1 flex items-center gap-3">
                        <div className="w-16 h-12 bg-slate-100 border border-amber-300 rounded p-0.5 flex items-center justify-center overflow-hidden">
                          <img
                            src={opt.imageUrl}
                            alt={`Option (${opt.key}) image`}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.endsWith('.heic') || target.src.endsWith('.HEIC')) {
                                target.src = target.src.replace(/\.heic$/i, '.jpg');
                              }
                            }}
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-900">
                            Option ({opt.key}) Image Attached
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionImage(idx)}
                            className="text-[10px] text-red-600 hover:text-red-800 underline font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Solution / Explanation (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={openMathTypeForExplanation}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sigma className="w-3 h-3" /> MathType
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Detailed step-by-step solution or rationale..."
                  value={explanationText}
                  onChange={e => setExplanationText(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400"
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
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400"
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
                className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Question
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded MathType Visual Equation Editor */}
      <MathTypeEditor
        isOpen={isMathTypeOpen}
        initialLatex={mathTypeInitial}
        targetFieldLabel={getTargetLabel()}
        onClose={() => setIsMathTypeOpen(false)}
        onInsertEquation={handleInsertMathTypeFormula}
      />

      {/* Embedded Diagram Studio Modal */}
      <DiagramStudioModal
        isOpen={isDiagramStudioOpen}
        initialSvg={diagramSvg}
        onClose={() => setIsDiagramStudioOpen(false)}
        onSaveDiagram={svg => setDiagramSvg(svg)}
      />
    </>
  );
};
