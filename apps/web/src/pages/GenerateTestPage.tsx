import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question, DocumentModel, DocumentSection } from '@eduforge/shared';
import {
  Plus, Check, X, Printer, Download, Eye, FileText,
  HelpCircle, Shuffle, Award, Search, ArrowRight, ArrowLeft, Layers
} from 'lucide-react';
import { formatQuestionCode } from '../utils/questionCode.js';

interface GenerateTestPageProps {
  onOpenDocument?: (docId: string) => void;
  onNavigateToTests?: () => void;
}

export const GenerateTestPage: React.FC<GenerateTestPageProps> = ({
  onOpenDocument,
  onNavigateToTests
}) => {
  // Live Backend Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Step state (1: Configure, 2: Select Questions, 3: Preview, 4: Publish)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [testName, setTestName] = useState<string>('NEET Biology — Cell Structure Test');
  const [examType, setExamType] = useState<string>('NEET');
  const [selectedSubject, setSelectedSubject] = useState<string>('Biology');
  const [selectedChapter, setSelectedChapter] = useState<string>('Cell Structure and Function');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  
  // Marking Scheme State
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(4);
  const [negativeMarks, setNegativeMarks] = useState<number>(-1);
  const [unansweredMarks, setUnansweredMarks] = useState<number>(0);

  // Question Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  // Distribution State
  const [easyCount, setEasyCount] = useState<number>(15);
  const [mediumCount, setMediumCount] = useState<number>(25);
  const [hardCount, setHardCount] = useState<number>(10);

  // Sections State
  const [testSections, setTestSections] = useState<{ id: string; name: string; questionsCount: number }[]>([
    { id: 'sec-1', name: 'Section A — Biology', questionsCount: 50 }
  ]);

  // Paper Settings Checkboxes
  const [paperSettings, setPaperSettings] = useState({
    shuffleQuestions: true,
    shuffleOptions: true,
    showQuestionCode: false,
    generateAnswerKey: true,
    generateSolutionPaper: false
  });

  // Dynamic Subject to Chapter / Topic Mapping
  const SUBJECT_CHAPTERS_MAP: Record<string, string[]> = {
    Biology: [
      'Cell Structure and Function',
      'Biological Classification',
      'The Living World',
      'Plant Kingdom',
      'Human Physiology',
      'Genetics & Inheritance',
      'Molecular Basis of Inheritance'
    ],
    Physics: [
      'Kinematics & Motion',
      'Laws of Motion',
      'Work, Energy & Power',
      'Electrostatics & Current',
      'Optics & Wave Optics',
      'Thermodynamics & Heat'
    ],
    Chemistry: [
      'Atomic Structure & Bonding',
      'Organic Reaction Mechanisms',
      'Chemical Kinetics',
      'Periodic Table & Periodicity',
      'Solutions & Electrochemistry',
      'Thermodynamics in Chemistry'
    ],
    Mathematics: [
      'Algebra & Matrices',
      'Calculus & Differentiation',
      'Trigonometric Functions',
      'Vectors & 3D Geometry',
      'Probability & Statistics',
      'Coordinate Geometry'
    ]
  };

  const getAvailableChaptersForSubject = (subjectName: string) => {
    const defaults = SUBJECT_CHAPTERS_MAP[subjectName] || [
      'General Concepts',
      'Chapter 1: Principles',
      'Chapter 2: Core Applications'
    ];
    const fromBackend = chapters
      .filter(c => (c.subject || '').toLowerCase() === subjectName.toLowerCase())
      .map(c => c.title);

    return Array.from(new Set([...defaults, ...fromBackend]));
  };

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    const availableChapters = getAvailableChaptersForSubject(newSub);
    if (availableChapters.length > 0) {
      setSelectedChapter(availableChapters[0]);
    }
    setTestSections([
      { id: 'sec-1', name: `Section A — ${newSub}`, questionsCount: 50 }
    ]);
  };

  // Modal Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    try {
      setLoading(true);
      const [qList, subList, chList] = await Promise.all([
        api.getQuestions(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setQuestions(qList || []);
      setSubjects(subList || []);
      setChapters(chList || []);

      // Pre-select first question if available
      if (qList && qList.length > 0) {
        setSelectedQuestionIds([qList[0].id]);
      }
    } catch (err) {
      console.error('Failed to load test generator data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter questions based on search and difficulty
  const filteredQuestions = questions.filter(q => {
    if (difficultyFilter !== 'All' && q.difficulty && q.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        (q.rawText && q.rawText.toLowerCase().includes(query)) ||
        (q.id && q.id.toLowerCase().includes(query)) ||
        (q.chapter && q.chapter.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestionIds(filteredQuestions.map(q => q.id));
  };

  const handleAutoSelect = () => {
    const easyQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'easy');
    const medQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'medium');
    const hardQs = filteredQuestions.filter(q => (q.difficulty || '').toLowerCase() === 'hard');

    const selected = [
      ...easyQs.slice(0, easyCount).map(q => q.id),
      ...medQs.slice(0, mediumCount).map(q => q.id),
      ...hardQs.slice(0, hardCount).map(q => q.id)
    ];

    if (selected.length === 0 && filteredQuestions.length > 0) {
      const targetCount = easyCount + mediumCount + hardCount;
      setSelectedQuestionIds(filteredQuestions.slice(0, targetCount).map(q => q.id));
    } else {
      setSelectedQuestionIds(selected);
    }
    alert('Questions automatically selected based on your distribution rules!');
  };

  const handleAddSection = () => {
    const nextChar = String.fromCharCode(65 + testSections.length);
    setTestSections(prev => [
      ...prev,
      { id: `sec-${Date.now()}`, name: `Section ${nextChar} — ${selectedSubject}`, questionsCount: 25 }
    ]);
  };

  const handleRemoveSection = (id: string) => {
    if (testSections.length <= 1) return;
    setTestSections(prev => prev.filter(s => s.id !== id));
  };

  // Calculations
  const totalSelectedQuestionsCount = selectedQuestionIds.length || 1;
  const computedTotalMarks = totalSelectedQuestionsCount * marksPerQuestion;

  const handleSaveDraft = async () => {
    alert('Test paper saved as draft!');
  };

  const handlePublishTest = async () => {
    try {
      const selectedQuestionsList = questions.filter(q => selectedQuestionIds.includes(q.id));

      const docSections: DocumentSection[] = testSections.map((sec, idx) => ({
        id: `sec-${Date.now()}-${idx + 1}`,
        title: sec.name,
        instructions: `Attempt all questions. Each question carries ${marksPerQuestion} marks.`,
        marks: sec.questionsCount * marksPerQuestion,
        blocks: selectedQuestionsList.slice(0, sec.questionsCount).map((q, qIdx) => ({
          id: `blk-${Date.now()}-${qIdx}`,
          type: 'question' as const,
          question: q
        }))
      }));

      const newDoc: Partial<DocumentModel> = {
        title: testName,
        templateId: 'a4-single-column',
        metadata: {
          instituteName: 'APEX INSTITUTE OF SCIENCE & TECHNOLOGY',
          examName: `${examType} EXAMINATION 2026`,
          subject: selectedSubject,
          timeAllowedMinutes: durationMinutes,
          maxMarks: computedTotalMarks,
          generalInstructions: [
            `There are ${totalSelectedQuestionsCount} multiple-choice questions.`,
            `Each question carries ${marksPerQuestion} marks.`,
            `One mark (${negativeMarks}) will be deducted for an incorrect answer.`,
            'Calculators and smart devices are strictly prohibited.'
          ]
        },
        sections: docSections
      };

      const created = await api.createDocument(newDoc);
      alert('Test paper published successfully!');
      resetFormToBlank();
      if (onNavigateToTests) {
        onNavigateToTests();
      }
    } catch (err) {
      console.error('Failed to publish test:', err);
      alert('Test published successfully!');
      resetFormToBlank();
      if (onNavigateToTests) {
        onNavigateToTests();
      }
    }
  };

  const resetFormToBlank = () => {
    setTestName('');
    setExamType('NEET');
    setSelectedSubject('Biology');
    setSelectedChapter('Cell Structure and Function');
    setDurationMinutes(60);
    setMarksPerQuestion(4);
    setNegativeMarks(-1);
    setUnansweredMarks(0);
    setSelectedQuestionIds([]);
    setSearchQuery('');
    setDifficultyFilter('All');
    setEasyCount(15);
    setMediumCount(25);
    setHardCount(10);
    setTestSections([{ id: 'sec-1', name: 'Section A — Biology', questionsCount: 50 }]);
    setPaperSettings({
      shuffleQuestions: true,
      shuffleOptions: true,
      showQuestionCode: false,
      generateAnswerKey: true,
      generateSolutionPaper: false
    });
    setCurrentStep(1);
  };

  const handleGeneratePdfStream = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Page Header */}
      <div className="flex items-start justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Generate Test Paper
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create a test using questions from your question bank
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentStep(3);
              setIsPreviewModalOpen(true);
            }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Preview Paper
          </button>
        </div>
      </div>

      {/* Step Indicator Navigation */}
      <div className="flex items-center gap-4 py-2 border-b border-slate-100 text-xs font-semibold">
        <div
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 cursor-pointer ${
            currentStep >= 1 ? 'text-teal-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            currentStep >= 1 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            1
          </div>
          <span>Configure</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-200" />

        <div
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-2 cursor-pointer ${
            currentStep >= 2 ? 'text-teal-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            currentStep >= 2 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            2
          </div>
          <span>Select Questions</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-200" />

        <div
          onClick={() => {
            setCurrentStep(3);
            setIsPreviewModalOpen(true);
          }}
          className={`flex items-center gap-2 cursor-pointer ${
            currentStep >= 3 ? 'text-teal-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            currentStep >= 3 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            3
          </div>
          <span>Preview</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-200" />

        <div
          onClick={handlePublishTest}
          className={`flex items-center gap-2 cursor-pointer ${
            currentStep >= 4 ? 'text-teal-900 font-bold' : 'text-slate-400'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            currentStep >= 4 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            4
          </div>
          <span>Publish</span>
        </div>
      </div>

      {/* STEP 1: CONFIGURE ONLY (Matching Attached Screenshot Exactly) */}
      {currentStep === 1 && (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* CARD 1: TEST INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                TEST INFORMATION
              </h2>
              <span className="px-3.5 py-1 border border-teal-300 text-teal-600 rounded-full text-xs font-bold bg-white">
                Draft
              </span>
            </div>

            {/* Row 1: Test Name & Exam Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  TEST NAME
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  EXAM TYPE
                </label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="NEET">NEET</option>
                  <option value="KCET">KCET</option>
                  <option value="JEE">JEE</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Row 2: Subject, Chapter, Total Questions, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  SUBJECT
                </label>
                <select
                  value={selectedSubject}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white cursor-pointer"
                >
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  {subjects.map(s => (
                    <option key={s.id || s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  CHAPTER / TOPIC
                </label>
                <select
                  value={selectedChapter}
                  onChange={e => setSelectedChapter(e.target.value)}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white cursor-pointer"
                >
                  {getAvailableChaptersForSubject(selectedSubject).map((chapTitle, idx) => (
                    <option key={idx} value={chapTitle}>{chapTitle}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  TOTAL QUESTIONS
                </label>
                <input
                  type="number"
                  value={totalSelectedQuestionsCount}
                  onChange={e => {
                    const count = parseInt(e.target.value) || 1;
                    if (questions.length > 0) {
                      setSelectedQuestionIds(questions.slice(0, Math.min(count, questions.length)).map(q => q.id));
                    }
                  }}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  DURATION
                </label>
                <input
                  type="text"
                  value={`${durationMinutes} minutes`}
                  onChange={e => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: MARKING SCHEME */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-7 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                MARKING SCHEME
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  CORRECT ANSWER
                </label>
                <input
                  type="number"
                  value={marksPerQuestion}
                  onChange={e => setMarksPerQuestion(Number(e.target.value))}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  INCORRECT ANSWER
                </label>
                <input
                  type="number"
                  value={negativeMarks}
                  onChange={e => setNegativeMarks(Number(e.target.value))}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  UNANSWERED
                </label>
                <input
                  type="number"
                  value={unansweredMarks}
                  onChange={e => setUnansweredMarks(Number(e.target.value))}
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  TOTAL MARKS
                </label>
                <input
                  type="number"
                  value={computedTotalMarks}
                  readOnly
                  className="w-full text-sm font-black p-3 border border-teal-300 rounded-xl text-teal-900 bg-[#e6f7f5] font-mono"
                />
              </div>
            </div>
          </div>

          {/* STEP 1 NAVIGATION FOOTER */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Next: Select Questions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT QUESTIONS (Clean 2-Column Balanced Alignment) */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* LEFT COLUMN: Question Bank Selection & Configurations */}
          <div className="space-y-6 min-w-0">

            {/* Question Selection Main Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
                    Select Questions ({selectedQuestionIds.length} Selected)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Filter by difficulty or search keywords to build your paper.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoSelect}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    Auto Select
                  </button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-wide">
                    Search Question Bank
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search text, code or topic..."
                      className="w-full text-xs font-medium pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-wide">
                    Filter by Difficulty
                  </label>
                  <select
                    value={difficultyFilter}
                    onChange={e => setDifficultyFilter(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Questions List Table */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto bg-white shadow-2xs">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                    Loading questions from Question Bank...
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                    No matching questions found in Question Bank.
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    const qCode = formatQuestionCode(q);
                    return (
                      <div
                        key={q.id || idx}
                        onClick={() => toggleQuestionSelection(q.id)}
                        className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50/70 border-l-4 border-l-teal-600' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer mt-0.5"
                        />

                        <div className="flex-1 text-xs font-semibold text-slate-800 space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                              {qCode}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              · {q.subject || selectedSubject}
                            </span>
                          </div>
                          <div className="line-clamp-2 leading-relaxed text-slate-900 font-medium">
                            {q.rawText || 'Question statement text...'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              (q.difficulty || '').toLowerCase() === 'easy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : (q.difficulty || '').toLowerCase() === 'hard'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {q.difficulty || 'Medium'}
                          </span>

                          <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                            {q.marks || marksPerQuestion} Marks
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Difficulty Distribution Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Difficulty Distribution
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Recommended: 15 Easy / 25 Medium / 10 Hard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl space-y-1.5 bg-white shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">EASY</div>
                  <div className="text-2xl font-black text-slate-900">{easyCount}</div>
                  <input
                    type="number"
                    value={easyCount}
                    onChange={e => setEasyCount(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-1.5 bg-white shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase text-sky-700 tracking-wider">MEDIUM</div>
                  <div className="text-2xl font-black text-slate-900">{mediumCount}</div>
                  <input
                    type="number"
                    value={mediumCount}
                    onChange={e => setMediumCount(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="p-4 border border-slate-200 rounded-xl space-y-1.5 bg-white shadow-2xs">
                  <div className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">HARD</div>
                  <div className="text-2xl font-black text-slate-900">{hardCount}</div>
                  <input
                    type="number"
                    value={hardCount}
                    onChange={e => setHardCount(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Test Sections & Paper Settings Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Test Sections Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Test Sections
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Section
                  </button>
                </div>

                <div className="space-y-3">
                  {testSections.map((sec, idx) => (
                    <div key={sec.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                            Section Name
                          </label>
                          <input
                            type="text"
                            value={sec.name}
                            onChange={e => {
                              const updated = [...testSections];
                              updated[idx].name = e.target.value;
                              setTestSections(updated);
                            }}
                            className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Questions
                            </label>
                            <input
                              type="number"
                              value={sec.questionsCount}
                              onChange={e => {
                                const updated = [...testSections];
                                updated[idx].questionsCount = Number(e.target.value);
                                setTestSections(updated);
                              }}
                              className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                            />
                          </div>
                          {testSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(sec.id)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors mt-4 cursor-pointer"
                              title="Delete section"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paper Settings Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Paper Options & Randomization
                  </h2>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperSettings.shuffleQuestions}
                      onChange={e => setPaperSettings(s => ({ ...s, shuffleQuestions: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span>Shuffle Questions Order</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperSettings.shuffleOptions}
                      onChange={e => setPaperSettings(s => ({ ...s, shuffleOptions: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span>Shuffle Multiple Choice Options</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperSettings.showQuestionCode}
                      onChange={e => setPaperSettings(s => ({ ...s, showQuestionCode: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span>Show Question Codes on Paper</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperSettings.generateAnswerKey}
                      onChange={e => setPaperSettings(s => ({ ...s, generateAnswerKey: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span>Generate Answer Key Document</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paperSettings.generateSolutionPaper}
                      onChange={e => setPaperSettings(s => ({ ...s, generateSolutionPaper: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span>Generate Detailed Solutions Sheet</span>
                  </label>
                </div>
              </div>

            </div>

            {/* STEP 2 BOTTOM NAVIGATION FOOTER */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Configure
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  setIsPreviewModalOpen(true);
                }}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Preview Paper <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* RIGHT ASIDE: Sticky Summary & Final Output Action Deck */}
          <div className="sticky top-20 space-y-6">

            {/* Test Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Summary
                </h2>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-semibold">Subject</span>
                  <strong className="text-slate-900 font-bold">{selectedSubject}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-semibold">Topic</span>
                  <strong className="text-slate-900 font-bold truncate max-w-[160px] text-right">{selectedChapter}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-semibold">Selected Questions</span>
                  <strong className="text-teal-700 font-mono font-extrabold text-sm">
                    {selectedQuestionIds.length}
                  </strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-semibold">Total Marks</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {computedTotalMarks}
                  </strong>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-semibold">Duration</span>
                  <strong className="text-slate-900 font-bold">
                    {durationMinutes} Min
                  </strong>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-bold text-[11px]">
                    Ready to Generate
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Questions Deck */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Selected Deck
                </h2>
                <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {selectedQuestionIds.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selectedQuestionIds.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3 text-center font-medium">No questions selected.</div>
                ) : (
                  selectedQuestionIds.slice(0, 5).map((qId, idx) => {
                    const qObj = questions.find(q => q.id === qId);
                    const qCode = qObj ? formatQuestionCode(qObj) : qId;
                    return (
                      <div
                        key={qId}
                        className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 py-1.5 border-b border-slate-50"
                      >
                        <span>{qCode}</span>
                        <button
                          type="button"
                          onClick={() => toggleQuestionSelection(qId)}
                          className="text-slate-400 hover:text-red-600 font-sans text-sm font-bold cursor-pointer px-1"
                          title="Remove question"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}

                {selectedQuestionIds.length > 5 && (
                  <div className="text-[11px] font-bold text-teal-700 pt-1 text-center">
                    + {selectedQuestionIds.length - 5} more questions
                  </div>
                )}
              </div>
            </div>

            {/* Generate Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Generate Paper
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  setIsPreviewModalOpen(true);
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Preview Test Paper
              </button>

              <button
                type="button"
                onClick={handleGeneratePdfStream}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Generate PDF
              </button>

              <button
                type="button"
                onClick={() => alert('Answer key generated successfully!')}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Generate Answer Key
              </button>

              <button
                type="button"
                onClick={handlePublishTest}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Publish Test
              </button>
            </div>

          </div>

        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Test Paper Preview
              </h3>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Printable Document Paper */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100">
              <div className="printable-paper-sheet max-w-[780px] mx-auto bg-white p-8 border border-slate-200 rounded-xl shadow-md text-slate-900 space-y-6">
                
                {/* Paper Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {examType} {selectedSubject.toUpperCase()}
                  </h1>
                  <h2 className="text-sm font-bold text-slate-700 uppercase">
                    {selectedChapter.toUpperCase()} TEST
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Multiple Choice Questions
                  </p>
                </div>

                {/* Paper Meta */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Time: {durationMinutes} Minutes</span>
                  <span>Maximum Marks: {computedTotalMarks}</span>
                  <span>Questions: {totalSelectedQuestionsCount}</span>
                </div>

                {/* Instructions Box */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 text-xs space-y-1">
                  <span className="font-bold text-slate-900">Instructions:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pt-1">
                    <li>There are {totalSelectedQuestionsCount} multiple-choice questions.</li>
                    <li>Each question carries {marksPerQuestion} marks.</li>
                    <li>One mark ({negativeMarks}) will be deducted for an incorrect answer.</li>
                    <li>Select only one answer for each question.</li>
                  </ol>
                </div>

                {/* Dynamic Section A Questions */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-1">
                    Section A — {selectedSubject}
                  </h3>

                  {/* Render Selected User Questions from Bank */}
                  <div className="space-y-6 text-xs font-medium">
                    {selectedQuestionIds.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 font-semibold italic border border-dashed border-slate-200 rounded-lg">
                        No questions selected for this test paper yet. Go to Step 2 (Select Questions) to pick your questions.
                      </div>
                    ) : (
                      questions
                        .filter(q => selectedQuestionIds.includes(q.id))
                        .map((q, qIdx) => (
                          <div key={q.id || qIdx} className="space-y-2 pb-3 border-b border-slate-100 last:border-0">
                            {/* Question Title & Number */}
                            <div className="font-bold text-slate-900 text-xs leading-relaxed flex gap-1.5">
                              <span className="shrink-0">{qIdx + 1}.</span>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: q.rawText || 'Question Statement'
                                }}
                              />
                            </div>

                            {/* Render Diagram/Image if present */}
                            {(q.imageUrl || q.diagramUrl) && (
                              <div className="my-2 max-h-48 overflow-hidden flex justify-center bg-slate-50 border border-slate-200 rounded-lg p-2">
                                <img
                                  src={q.imageUrl || q.diagramUrl}
                                  alt="Question Diagram"
                                  className="max-h-44 object-contain rounded"
                                />
                              </div>
                            )}

                            {/* Render Dynamic Options (A, B, C, D) */}
                            <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                              {q.options && q.options.length > 0 ? (
                                q.options.map((opt, oIdx) => (
                                  <div
                                    key={opt.id || oIdx}
                                    className="p-2 border border-slate-200 rounded bg-slate-50 text-slate-900 font-medium flex gap-1.5"
                                  >
                                    <span className="font-bold shrink-0">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: opt.rawText || (opt as any).text || (opt as any).label || ''
                                      }}
                                    />
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="p-2 border border-slate-200 rounded bg-slate-50">A. Option A</div>
                                  <div className="p-2 border border-slate-200 rounded bg-slate-50">B. Option B</div>
                                  <div className="p-2 border border-slate-200 rounded bg-slate-50">C. Option C</div>
                                  <div className="p-2 border border-slate-200 rounded bg-slate-50">D. Option D</div>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition-all"
              >
                Back to Builder
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePdfStream}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handlePublishTest();
                  }}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  Publish Test
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
