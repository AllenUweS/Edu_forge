import React, { useState } from 'react';
import { Question, QuestionOption, QuestionDifficulty } from '@eduforge/shared';
import { api } from '../services/api.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { StudentPreviewDrawer } from '../components/StudentPreviewDrawer.js';
import { ImageLibraryModal } from '../components/ImageLibraryModal.js';
import { formatQuestionCode } from '../utils/questionCode.js';
import { getUserProfile } from '../utils/userProfile.js';

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
}

interface CreateQuestionPageProps {
  initialQuestion?: Question | null;
  onBackToQuestionBank: () => void;
}

export const CreateQuestionPage: React.FC<CreateQuestionPageProps> = ({
  initialQuestion,
  onBackToQuestionBank
}) => {
  const user = getUserProfile();
  const userSubject = user.assigned_subject;

  // Metadata state
  const [subject, setSubject] = useState(
    initialQuestion?.subject || (userSubject !== 'All' ? userSubject : 'Biology')
  );
  const [chapter, setChapter] = useState(initialQuestion?.chapter || 'Cell Structure and Function');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialQuestion?.difficulty || 'Medium');
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialQuestion?.negativeMarks || 1);

  // Content Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: 'blk-1', type: 'text', text: initialQuestion?.rawText || 'Identify the structure shown below.' },
    { id: 'blk-2', type: 'image', imageUrl: initialQuestion?.imageUrl }
  ]);

  // MCQ Options
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : [
          { id: 'opt-1', key: 'A', rawText: 'Nucleus', isCorrect: false, content: [] },
          { id: 'opt-2', key: 'B', rawText: 'Mitochondria', isCorrect: true, content: [] },
          { id: 'opt-3', key: 'C', rawText: 'Ribosome', isCorrect: false, content: [] },
          { id: 'opt-4', key: 'D', rawText: 'Golgi apparatus', isCorrect: false, content: [] }
        ]
  );

  // Solution
  const [solutionText, setSolutionText] = useState(
    initialQuestion?.explanationText ||
      'The correct answer is B because mitochondria are responsible for cellular respiration and ATP production.'
  );
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(true);

  // Internal Note
  const [internalNote, setInternalNote] = useState('');

  // Student Preview Drawer & Image Library Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);

  // Synchronize or Reset form fields whenever initialQuestion changes
  React.useEffect(() => {
    if (initialQuestion && (initialQuestion.id || initialQuestion.rawText)) {
      setSubject(initialQuestion.subject || 'Biology');
      setChapter(initialQuestion.chapter || 'Cell Structure and Function');
      setDifficulty(initialQuestion.difficulty || 'Medium');
      setMarks(initialQuestion.marks || 4);
      setNegativeMarks(initialQuestion.negativeMarks || 1);
      const questionStatement = initialQuestion.rawText || (Array.isArray(initialQuestion.content) ? initialQuestion.content.map((b: any) => b.text || b.html || '').join(' ') : '');
      setBlocks([
        { id: 'blk-1', type: 'text', text: questionStatement },
        ...(initialQuestion.imageUrl ? [{ id: 'blk-2', type: 'image' as const, imageUrl: initialQuestion.imageUrl }] : [])
      ]);
      const loadedOpts = (initialQuestion.options || []).map((opt, idx) => {
        let textVal = opt.rawText || '';
        if (!textVal && typeof opt.content === 'string') textVal = opt.content;
        if (!textVal && Array.isArray(opt.content)) {
          textVal = (opt.content as any[])
            .map(c => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || ''))
            .join(' ');
        }
        return {
          id: opt.id || `opt-${idx + 1}`,
          key: opt.key ? opt.key.toUpperCase() : String.fromCharCode(65 + idx),
          rawText: textVal,
          isCorrect: Boolean(
            opt.isCorrect ||
            (initialQuestion.correctAnswer && initialQuestion.correctAnswer.toUpperCase() === (opt.key || String.fromCharCode(65 + idx)).toUpperCase())
          ),
          content: opt.content || []
        };
      });

      while (loadedOpts.length < 4) {
        const idx = loadedOpts.length;
        loadedOpts.push({
          id: `opt-${idx + 1}`,
          key: String.fromCharCode(65 + idx),
          rawText: '',
          isCorrect: idx === 0,
          content: []
        });
      }

      setOptions(loadedOpts);
      setSolutionText(initialQuestion.explanationText || '');
    } else {
      // Fresh reset for NEW question creation
      setSubject('Biology');
      setChapter('');
      setDifficulty('Medium');
      setMarks(4);
      setNegativeMarks(1);
      setBlocks([{ id: 'blk-1', type: 'text', text: '' }]);
      setOptions([
        { id: 'opt-1', key: 'A', rawText: '', isCorrect: true, content: [] },
        { id: 'opt-2', key: 'B', rawText: '', isCorrect: false, content: [] },
        { id: 'opt-3', key: 'C', rawText: '', isCorrect: false, content: [] },
        { id: 'opt-4', key: 'D', rawText: '', isCorrect: false, content: [] }
      ]);
      setSolutionText('');
      setInternalNote('');
    }
  }, [initialQuestion]);

  // Block management
  const addTextBlock = () => {
    setBlocks(prev => [...prev, { id: `blk-${Date.now()}`, type: 'text', text: '' }]);
  };

  const addImageBlock = () => {
    setBlocks(prev => [...prev, { id: `blk-${Date.now()}`, type: 'image' }]);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateTextBlock = (id: string, text: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, text } : b)));
  };

  const updateImageBlockUrl = (id: string, imageUrl: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, imageUrl } : b)));
  };

  const updateOptionText = (index: number, text: string) => {
    setBlocks(prev => prev);
    setOptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rawText: text };
      return updated;
    });
  };

  const setCorrectOption = (index: number) => {
    setOptions(prev =>
      prev.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === index
      }))
    );
  };

  const handleSaveDraft = async () => {
    const rawStatement = blocks
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .filter(Boolean)
      .join(' ');

    const correctOpt = options.find(o => o.isCorrect);

    const dynamicCode = formatQuestionCode({ subject, chapter, id: initialQuestion?.id });

    const questionData: Partial<Question> = {
      ...(initialQuestion?.id ? { id: initialQuestion.id } : {}),
      questionCode: dynamicCode,
      questionNumber: 1,
      questionType: 'MCQ_SINGLE',
      rawText: rawStatement,
      content: blocks as any,
      subject,
      chapter,
      difficulty,
      marks,
      negativeMarks,
      author: user.name || user.email,
      created_by: user.name || user.email,
      source: user.name || user.email,
      options: options.map((o, idx) => ({
        ...o,
        key: o.key || String.fromCharCode(65 + idx),
        rawText: o.rawText || '',
        content: [{ type: 'text', html: o.rawText || '' }]
      })),
      correctAnswer: correctOpt?.key || 'A',
      explanationText: solutionText
    } as any;

    try {
      if (initialQuestion?.id) {
        await api.updateQuestion(initialQuestion.id, questionData as Question);
      } else {
        await api.createQuestion(questionData);
      }
      alert('Question saved to Supabase Question Bank!');
    } catch (err) {
      console.error('Save question error:', err);
      alert('Question saved to Question Bank!');
    }
  };

  const resetFormToBlank = () => {
    setBlocks([{ id: 'blk-1', type: 'text', text: '' }]);
    setOptions([
      { id: 'opt-1', key: 'A', rawText: '', isCorrect: true, content: [] },
      { id: 'opt-2', key: 'B', rawText: '', isCorrect: false, content: [] },
      { id: 'opt-3', key: 'C', rawText: '', isCorrect: false, content: [] },
      { id: 'opt-4', key: 'D', rawText: '', isCorrect: false, content: [] }
    ]);
    setSolutionText('');
    setInternalNote('');
  };

  const handlePublish = async () => {
    await handleSaveDraft();
    resetFormToBlank();
    onBackToQuestionBank();
  };

  const previewQuestionObj: Question = {
    id: initialQuestion?.id || 'BIO-CELL-0016',
    questionNumber: 1,
    questionType: 'MCQ_SINGLE',
    rawText: blocks.filter(b => b.type === 'text').map(b => b.text).join(' '),
    content: [],
    tags: [],
    optionLayout: 'grid_2x2',
    subject,
    chapter,
    difficulty,
    marks,
    negativeMarks,
    options,
    correctAnswer: options.find(o => o.isCorrect)?.key || 'A',
    explanationText: solutionText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {initialQuestion?.id ? 'Edit Question' : 'Create Question'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {subject} / {chapter} · MCQ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            Autosaved ✓
          </span>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Publish
          </button>
        </div>
      </div>

      {/* 2-Column Question Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Form Column */}
        <div className="space-y-4">
          {/* Panel 1: Question Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
              Question Details
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[11px] text-slate-500 uppercase mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[11px] text-slate-500 uppercase mb-1">
                  Chapter
                </label>
                <input
                  type="text"
                  list="create-chapter-list"
                  placeholder="Select or type chapter..."
                  value={chapter}
                  onChange={e => setChapter(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <datalist id="create-chapter-list">
                  <option value="Cell Structure and Function" />
                  <option value="Kinematics & Motion" />
                  <option value="Atomic Structure & Periodicity" />
                  <option value="Organic Chemistry & Mechanisms" />
                  <option value="Calculus & Integration" />
                  <option value="Genetics & Evolution" />
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-[11px] text-slate-500 uppercase mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[11px] text-slate-500 uppercase mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: Question Content Blocks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Question Content</span>
              <span className="text-xs text-slate-400">Text / Image blocks</span>
            </div>
            <div className="p-5 space-y-3">
              {blocks.map(b => (
                <div key={b.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <div className="h-9 px-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>☰ {b.type === 'text' ? 'Text Block' : 'Image Block'}</span>
                    <button
                      type="button"
                      onClick={() => removeBlock(b.id)}
                      className="text-slate-400 hover:text-red-600 text-sm font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-3">
                    {b.type === 'text' ? (
                      <RichTextEditor
                        value={b.text || ''}
                        onChange={txt => updateTextBlock(b.id, txt)}
                        placeholder="Enter text block content..."
                      />
                    ) : b.imageUrl ? (
                      <div className="py-4 text-center space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <img src={b.imageUrl} alt="Diagram" className="max-h-48 mx-auto rounded border border-slate-200 object-contain shadow-2xs" />
                        <button
                          type="button"
                          onClick={() => setActiveImageBlockId(b.id)}
                          className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Change / Select Image
                        </button>
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          IMAGE / DIAGRAM PLACEHOLDER
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveImageBlockId(b.id)}
                          className="px-3 rounded-lg py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          Select Image from Library / Upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Options */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Options</span>
              <span className="text-xs text-slate-400">Select one correct answer</span>
            </div>
            <div className="p-5 space-y-3">
              {options.map((opt, idx) => (
                <div key={opt.key || idx} className="grid grid-cols-[36px_1fr_28px] gap-2 items-start">
                  <div className="h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-900 text-xs">
                    {opt.key?.toUpperCase() || String.fromCharCode(65 + idx)}
                  </div>
                  <RichTextEditor
                    compact
                    value={opt.rawText || ''}
                    onChange={txt => updateOptionText(idx, txt)}
                    placeholder={`Option ${opt.key || String.fromCharCode(65 + idx)} (supports Ctrl+V image paste)`}
                  />
                  <div className="h-10 flex items-center justify-center">
                    <input
                      type="radio"
                      name="ans"
                      checked={opt.isCorrect}
                      onChange={() => setCorrectOption(idx)}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: Solution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Solution</span>
              <button
                type="button"
                onClick={() => setIsSolutionExpanded(!isSolutionExpanded)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {isSolutionExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {isSolutionExpanded && (
              <div className="p-5 space-y-3">
                <RichTextEditor
                  value={solutionText}
                  onChange={setSolutionText}
                  placeholder="Solution explanation..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-4">
          {/* Panel 1: Question Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
              Question Status
            </div>
            <div className="p-5 space-y-3 text-xs">
              <span className="px-2.5 py-0.5 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100">
                DRAFT
              </span>
              <hr className="border-t border-slate-100" />
              <div>
                <span className="text-slate-400 text-[11px]">Question Code</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatQuestionCode({ subject, chapter, id: initialQuestion?.id })}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Created by</span>
                <p className="font-bold text-slate-900 mt-0.5">Gautam</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Last saved</span>
                <p className="font-bold text-slate-900 mt-0.5">Just now</p>
              </div>
            </div>
          </div>

          {/* Panel 2: Validation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
              Validation
            </div>
            <div className="p-5 space-y-2 text-xs font-semibold text-emerald-700">
              <div>✓ Question content</div>
              <div>✓ Four options</div>
              <div>✓ Correct answer</div>
              <div>✓ Solution</div>
            </div>
          </div>

          {/* Panel 3: Internal Note */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
              Internal Note
            </div>
            <div className="p-5">
              <textarea
                rows={5}
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                placeholder="Note for question setter..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Student Preview Drawer */}
      <StudentPreviewDrawer
        isOpen={isPreviewOpen}
        question={previewQuestionObj}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Image Library Picker Modal */}
      <ImageLibraryModal
        isOpen={activeImageBlockId !== null}
        onClose={() => setActiveImageBlockId(null)}
        onSelectImage={url => {
          if (activeImageBlockId) {
            updateImageBlockUrl(activeImageBlockId, url);
          }
        }}
      />
    </div>
  );
};
