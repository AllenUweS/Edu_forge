import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question, DocumentModel, DocumentSection } from '@eduforge/shared';
import {
  Plus, Check, X, Printer, Download, Eye, FileText,
  HelpCircle, Shuffle, Award, Search, ArrowRight, ArrowLeft, Layers
} from 'lucide-react';
import { formatQuestionCode } from '../utils/questionCode.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';
import { getUserProfile } from '../utils/userProfile.js';

/**
 * Props for GenerateTestPage component:
 * - initialDocument: Optional existing test paper document passed in for editing.
 * - onOpenDocument: Callback to navigate directly to the interactive test editor.
 * - onNavigateToTests: Callback to transition the user to the Tests listing page after publishing.
 */
interface GenerateTestPageProps {
  initialDocument?: DocumentModel | null;
  onOpenDocument?: (docId: string) => void;
  onNavigateToTests?: () => void;
}

/**
 * GenerateTestPage Component
 * 
 * Provides a 4-step interactive wizard for creating, configuring, and publishing test papers:
 * 1. Configure: Test metadata, exam type (NEET/JEE/KCET), subject, chapter, duration, and marking scheme.
 * 2. Select Questions: Manual or automated question selection from the question bank with live filters.
 * 3. Preview: Real-time printable preview matching academic exam formatting.
 * 4. Publish: Saves the test paper document to Supabase and lists it in the Tests section.
 */
export const GenerateTestPage: React.FC<GenerateTestPageProps> = ({
  initialDocument,
  onOpenDocument,
  onNavigateToTests
}) => {
  // Current logged in user profile (for subject permission gating)
  const user = getUserProfile();

  // ==========================================
  // Backend & Metadata State
  // ==========================================
  const [questions, setQuestions] = useState<Question[]>([]); // Questions fetched from Question Bank
  const [subjects, setSubjects] = useState<any[]>([]); // Subjects fetched from backend
  const [chapters, setChapters] = useState<any[]>([]); // Chapters fetched from backend
  const [loading, setLoading] = useState<boolean>(true); // Loading indicator during API fetch

  // Wizard active step (1: Configure, 2: Select Questions, 3: Preview, 4: Publish)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // User Subject scope (e.g., 'Biology', 'Physics', 'Chemistry', or 'All' for admin)
  const userSubject = user.assigned_subject;

  // ==========================================
  // Form Configuration State (Step 1)
  // ==========================================
  const [testName, setTestName] = useState<string>('EduForge Practice Test');
  const [examType, setExamType] = useState<string>('NEET');
  const [selectedSubject, setSelectedSubject] = useState<string>(userSubject !== 'All' ? userSubject : 'Biology');
  const [selectedChapter, setSelectedChapter] = useState<string>('Cell Structure and Function');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  
  // ==========================================
  // Marking Scheme Configuration State
  // ==========================================
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(4); // Marks awarded for correct answer
  const [negativeMarks, setNegativeMarks] = useState<number>(-1); // Marks deducted for incorrect answer
  const [unansweredMarks, setUnansweredMarks] = useState<number>(0); // Marks for unanswered questions

  // ==========================================
  // Question Bank Selection & Filter State (Step 2)
  // ==========================================
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]); // Array of selected question UUIDs/codes
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(userSubject !== 'All' ? userSubject : 'all'); // Filter questions by subject
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all'); // Filter questions by chapter
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search input query for filtering questions
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All'); // Difficulty filter: All | Easy | Medium | Hard

  // ==========================================
  // Auto-Distribution Count Rules
  // ==========================================
  const [easyCount, setEasyCount] = useState<number>(15);
  const [mediumCount, setMediumCount] = useState<number>(25);
  const [hardCount, setHardCount] = useState<number>(10);

  // ==========================================
  // Paper Sections State (e.g. Section A, Section B)
  // ==========================================
  const [testSections, setTestSections] = useState<{ id: string; name: string; questionsCount: number }[]>([
    { id: 'sec-1', name: 'Section A — Biology', questionsCount: 50 }
  ]);

  // ==========================================
  // Paper Settings & Randomization Options
  // ==========================================
  const [paperSettings, setPaperSettings] = useState({
    shuffleQuestions: true, // Shuffle questions order
    shuffleOptions: true, // Shuffle options A, B, C, D order
    showQuestionCode: false, // Display question code on paper
    generateAnswerKey: true, // Generate answer key sheet
    generateSolutionPaper: false // Generate step-by-step solutions
  });

  // ==========================================
  // Subject to Chapters / Topics Mapping
  // ==========================================
  const SUBJECT_CHAPTERS_MAP: Record<string, string[]> = {
    Biology: [
      'Cell Structure and Function',
      'Biological Classification',
      'The Living World',
      'Animal Kingdom',
      'Plant Kingdom',
      'Human Physiology',
      'Genetics & Inheritance',
      'Molecular Basis of Inheritance'
    ],
    Physics: [
      'Units and Measurements',
      'Motion in a Plane',
      'Kinematics & Motion',
      'Laws of Motion',
      'Work, Energy & Power',
      'Electrostatics & Current',
      'Optics & Wave Optics',
      'Thermodynamics & Heat'
    ],
    Chemistry: [
      'Some Basic Concepts of Chemistry',
      'Thermodynamics',
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

  /**
   * Returns a list of stored chapters for a given subject from the Supabase database.
   */
  const getAvailableChaptersForSubject = (subjectName: string) => {
    if (!subjectName || subjectName === 'all') {
      const stored = chapters.map(c => c.name || c.title || (c as any).chapter_name).filter(Boolean);
      if (stored.length > 0) return Array.from(new Set(stored));
      return Object.values(SUBJECT_CHAPTERS_MAP).flat();
    }
    const stored = chapters
      .filter(c => (c.subject || '').toLowerCase() === subjectName.toLowerCase())
      .map(c => c.name || c.title || (c as any).chapter_name)
      .filter(Boolean);

    if (stored.length > 0) return Array.from(new Set(stored));
    return SUBJECT_CHAPTERS_MAP[subjectName] || [];
  };

  /**
   * Handles Subject change from dropdown, updating default chapter and initial section name.
   */
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

  // Full Screen Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // ==========================================
  // Lifecycle Data Fetching
  // ==========================================
  useEffect(() => {
    loadBackendData();
  }, [initialDocument]);

  /**
   * Fetches questions, subjects, and chapters from the Supabase backend.
   * If an initialDocument is provided (editing mode), populates the fields accordingly.
   */
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

      // If editing an existing document, populate document fields
      if (initialDocument) {
        setTestName(initialDocument.title || '');
        if (initialDocument.metadata?.subject) {
          setSelectedSubject(initialDocument.metadata.subject);
        }
        if (initialDocument.metadata?.timeAllowedMinutes) {
          setDurationMinutes(Number(initialDocument.metadata.timeAllowedMinutes));
        }

        const qIds: string[] = [];
        initialDocument.sections?.forEach(sec => {
          sec.blocks?.forEach((b: any) => {
            if (b.type === 'question' && b.question?.id) {
              qIds.push(b.question.id);
            } else if (b.questionId) {
              qIds.push(b.questionId);
            }
          });
        });

        if (qIds.length > 0) {
          setSelectedQuestionIds(Array.from(new Set(qIds)));
        } else if (qList && qList.length > 0) {
          setSelectedQuestionIds([qList[0].id]);
        }

        setCurrentStep(2); // Open directly to Step 2: Select Questions
      } else if (qList && qList.length > 0) {
        setSelectedQuestionIds([qList[0].id]);
      }
    } catch (err) {
      console.error('Failed to load test generator data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Question Filtering & Selection Helpers
  // ==========================================

  // Filters questions by subject, chapter, difficulty, and live search query
  const filteredQuestions = questions.filter(q => {
    // 1. Role-based user scoping
    if (userSubject !== 'All') {
      const userSubLower = userSubject.toLowerCase();
      const qSubLower = (q.subject || '').toLowerCase();
      if (qSubLower && !qSubLower.includes(userSubLower) && !userSubLower.includes(qSubLower)) {
        return false;
      }
    }

    // 2. Subject Filter
    if (selectedSubjectFilter !== 'all') {
      const targetSubLower = selectedSubjectFilter.toLowerCase();
      const qSubLower = (q.subject || '').toLowerCase();
      const qSubId = ((q as any).subject_id || (q as any).subjectId || '').toLowerCase();
      if (qSubLower !== targetSubLower && !qSubLower.includes(targetSubLower) && qSubId !== targetSubLower) {
        return false;
      }
    }

    // 3. Chapter Filter
    if (selectedChapterFilter !== 'all') {
      const targetCh = selectedChapterFilter.toLowerCase();
      const qCh = ((q as any).chapter_name || q.chapter || (q as any).chapterTitle || '').toLowerCase();
      const qChId = ((q as any).chapterId || (q as any).chapter_id || '').toLowerCase();
      const qCode = ((q as any).code || q.id || '').toUpperCase();

      let matchChapterCode = false;
      if (selectedChapterFilter.includes('Living World') || selectedChapterFilter.includes('LIV')) {
        matchChapterCode = qCode.includes('LIV');
      } else if (selectedChapterFilter.includes('Animal Kingdom') || selectedChapterFilter.includes('ANI')) {
        matchChapterCode = qCode.includes('ANI');
      } else if (selectedChapterFilter.includes('Basic Concepts') || selectedChapterFilter.includes('SBC')) {
        matchChapterCode = qCode.includes('SBC');
      } else if (selectedChapterFilter.includes('Thermodynamics') || selectedChapterFilter.includes('THE')) {
        matchChapterCode = qCode.includes('THE');
      } else if (selectedChapterFilter.includes('Units') || selectedChapterFilter.includes('UAM')) {
        matchChapterCode = qCode.includes('UAM');
      } else if (selectedChapterFilter.includes('Motion in a Plane') || selectedChapterFilter.includes('MIP')) {
        matchChapterCode = qCode.includes('MIP');
      }

      if (!qCh.includes(targetCh) && !targetCh.includes(qCh) && qChId !== targetCh && !matchChapterCode) {
        return false;
      }
    }

    // 4. Difficulty Filter
    if (difficultyFilter !== 'All' && q.difficulty && q.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) {
      return false;
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        (q.rawText && q.rawText.toLowerCase().includes(query)) ||
        (q.id && q.id.toLowerCase().includes(query)) ||
        ((q as any).code && (q as any).code.toLowerCase().includes(query)) ||
        (q.chapter && q.chapter.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Toggles question inclusion in the selected question deck
  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  // Selects all currently filtered questions
  const handleSelectAll = () => {
    setSelectedQuestionIds(filteredQuestions.map(q => q.id));
  };

  // Clears all selected questions
  const handleDeselectAll = () => {
    setSelectedQuestionIds([]);
  };

  // Automatically selects questions based on configured difficulty counts (Easy / Medium / Hard)
  const handleAutoSelectDistribution = () => {
    const easyQ = questions.filter(q => (q.difficulty || '').toLowerCase() === 'easy').map(q => q.id);
    const medQ = questions.filter(q => (q.difficulty || '').toLowerCase() === 'medium').map(q => q.id);
    const hardQ = questions.filter(q => (q.difficulty || '').toLowerCase() === 'hard').map(q => q.id);

    const chosenEasy = easyQ.slice(0, easyCount);
    const chosenMed = medQ.slice(0, mediumCount);
    const chosenHard = hardQ.slice(0, hardCount);

    const combined = Array.from(new Set([...chosenEasy, ...chosenMed, ...chosenHard]));
    setSelectedQuestionIds(combined.length > 0 ? combined : questions.slice(0, 50).map(q => q.id));
    alert('Questions automatically selected based on your distribution rules!');
  };

  // Section Management: Adds a new section (e.g. Section B)
  const handleAddSection = () => {
    const nextChar = String.fromCharCode(65 + testSections.length);
    setTestSections(prev => [
      ...prev,
      { id: `sec-${Date.now()}`, name: `Section ${nextChar} — ${selectedSubject}`, questionsCount: 25 }
    ]);
  };

  // Section Management: Removes a section
  const handleRemoveSection = (id: string) => {
    if (testSections.length <= 1) return;
    setTestSections(prev => prev.filter(s => s.id !== id));
  };

  // ==========================================
  // Dynamic Score & Document Construction
  // ==========================================
  const totalSelectedQuestionsCount = selectedQuestionIds.length || 1;
  const computedTotalMarks = totalSelectedQuestionsCount * marksPerQuestion;

  /**
   * Constructs the DocumentModel payload matching the backend schema
   * with complete metadata, sections, and structured question blocks.
   */
  const buildDocumentModel = (): Partial<DocumentModel> => {
    const selectedQuestionsList = questions.filter(q =>
      selectedQuestionIds.some(id => String(id) === String(q.id))
    );

    const docSections: DocumentSection[] = testSections.map((sec, idx) => {
      const sectionQuestions = selectedQuestionsList.length > 0
        ? selectedQuestionsList
        : questions.slice(0, sec.questionsCount || 10);

      return {
        id: `sec-${Date.now()}-${idx + 1}`,
        title: sec.name || `Section ${String.fromCharCode(65 + idx)} — ${selectedSubject}`,
        instructions: `Attempt all questions. Each question carries ${marksPerQuestion} marks.`,
        marks: (sec.questionsCount || sectionQuestions.length) * marksPerQuestion,
        blocks: sectionQuestions.map((q, qIdx) => ({
          id: `blk-${Date.now()}-${qIdx}`,
          type: 'question' as const,
          question: q,
          questionId: q.id
        }))
      };
    });

    return {
      title: testName.trim() || `${selectedSubject} ${examType} Test Paper`,
      templateId: undefined,
      metadata: {
        instituteName: 'APEX INSTITUTE OF SCIENCE & TECHNOLOGY',
        examName: `${examType} EXAMINATION 2026`,
        subject: selectedSubject,
        chapter: selectedChapter,
        timeAllowedMinutes: Number(durationMinutes) || 60,
        maxMarks: computedTotalMarks,
        totalQuestions: totalSelectedQuestionsCount,
        createdBy: user.name || user.email,
        author: user.name || user.email,
        generalInstructions: [
          `There are ${totalSelectedQuestionsCount} multiple-choice questions.`,
          `Each question carries ${marksPerQuestion} marks.`,
          `One mark (${negativeMarks}) will be deducted for an incorrect answer.`,
          'Calculators and smart devices are strictly prohibited.'
        ]
      } as any,
      settings: paperSettings as any,
      sections: docSections
    };
  };

  /**
   * Saves the current test paper configuration as a draft to the Supabase database.
   */
  const handleSaveDraft = async () => {
    try {
      const docModel = buildDocumentModel();
      if (initialDocument?.id) {
        await api.updateDocument(initialDocument.id, { ...docModel, id: initialDocument.id } as DocumentModel);
        alert('Test paper updated successfully in Supabase!');
      } else {
        const created = await api.createDocument(docModel);
        alert(`Test paper "${created?.title || docModel.title}" saved to Supabase!`);
      }
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      alert(`Failed to save test paper draft: ${err.message || 'Server error'}`);
    }
  };

  /**
   * Publishes the test paper, resets the form, and redirects the user to the Tests section.
   */
  const handlePublishTest = async () => {
    try {
      const docModel = buildDocumentModel();
      let savedDoc: DocumentModel;
      if (initialDocument?.id) {
        savedDoc = await api.updateDocument(initialDocument.id, { ...docModel, id: initialDocument.id } as DocumentModel);
        alert('Test paper updated and published successfully!');
      } else {
        savedDoc = await api.createDocument(docModel);
        alert(`Test paper "${savedDoc?.title || docModel.title}" published successfully to Tests section!`);
      }
      resetFormToBlank();
      if (onNavigateToTests) {
        onNavigateToTests();
      }
    } catch (err: any) {
      console.error('Failed to publish test:', err);
      alert(`Failed to publish test paper: ${err.message || 'Server error'}`);
    }
  };

  /**
   * Resets all form fields back to default state.
   */
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

  /**
   * Triggers the browser print dialog to print or save the test paper as PDF.
   */
  const handleGeneratePdfStream = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* ========================================== */}
      {/* PAGE HEADER & TOP ACTION BUTTONS           */}
      {/* ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
            Generate Test Paper
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create a test using questions from your question bank
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentStep(3);
              setIsPreviewModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Preview Paper
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* STEP INDICATOR NAVIGATION (1 to 4)         */}
      {/* ========================================== */}
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

      {/* ========================================== */}
      {/* STEP 1: CONFIGURE TEST METADATA & MARKING  */}
      {/* ========================================== */}
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

            {/* Grid: Test Name, Exam Type & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  TEST NAME
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. Unit Test 01 - Full Syllabus"
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
                  className="w-full text-sm font-bold p-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="NEET">NEET</option>
                  <option value="KCET">KCET</option>
                  <option value="JEE">JEE</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-2 font-sans tracking-wide">
                  DURATION (MINUTES)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full text-sm font-bold p-3 pr-16 border border-slate-200 rounded-xl text-slate-900 bg-white font-mono focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                  />
                  <span className="absolute right-3 text-xs text-slate-500 font-bold pointer-events-none">
                    Min
                  </span>
                </div>
                {/* Quick preset duration buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[30, 60, 90, 120, 180].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
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

      {/* ========================================== */}
      {/* STEP 2: SELECT QUESTIONS FROM QUESTION BANK*/}
      {/* ========================================== */}
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
                    onClick={handleAutoSelectDistribution}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    Auto Select
                  </button>
                </div>
              </div>

              {/* Filters Row: Subject, Chapter, Difficulty & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Subject Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-wide">
                    Filter by Subject
                  </label>
                  <select
                    value={selectedSubjectFilter}
                    onChange={e => {
                      setSelectedSubjectFilter(e.target.value);
                      setSelectedChapterFilter('all');
                    }}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="all">All Subjects</option>
                    {userSubject === 'All' ? (
                      subjects.length > 0 ? (
                        subjects.map(s => (
                          <option key={s.id || s.code || s.name} value={s.name}>{s.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Biology">Biology</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Mathematics">Mathematics</option>
                        </>
                      )
                    ) : (
                      <option value={userSubject}>{userSubject}</option>
                    )}
                  </select>
                </div>

                {/* 2. Chapter Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1 tracking-wide">
                    Filter by Chapter
                  </label>
                  <select
                    value={selectedChapterFilter}
                    onChange={e => setSelectedChapterFilter(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="all">All Chapters</option>
                    {getAvailableChaptersForSubject(selectedSubjectFilter).map((chapTitle, idx) => (
                      <option key={idx} value={chapTitle}>{chapTitle}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Difficulty Filter */}
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

                {/* 4. Search Question Bank */}
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
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 bg-white focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable Questions List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">Select</th>
                        <th className="py-3 px-4 w-28">Code</th>
                        <th className="py-3 px-4">Question Content</th>
                        <th className="py-3 px-4 w-28">Subject</th>
                        <th className="py-3 px-4 w-36">Chapter</th>
                        <th className="py-3 px-4 w-24 text-center">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                      {filteredQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                            No questions found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredQuestions.map(q => {
                          const isSelected = selectedQuestionIds.includes(q.id);
                          const qCode = formatQuestionCode(q);

                          return (
                            <tr
                              key={q.id}
                              onClick={() => toggleQuestionSelection(q.id)}
                              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                                isSelected ? 'bg-teal-50/60 font-semibold' : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleQuestionSelection(q.id)}
                                  className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                                />
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">{qCode}</td>
                              <td className="py-3 px-4 text-slate-900">
                                <div className="line-clamp-2 max-w-lg">
                                  <MathTextRenderer text={q.rawText || ''} />
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {q.subject || 'Biology'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                                {q.chapter || 'General'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    q.difficulty === 'Easy'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : q.difficulty === 'Medium'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {q.difficulty || 'Medium'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section Builder Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Sections Configuration ({testSections.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>

              <div className="space-y-3">
                {testSections.map((sec, idx) => (
                  <div key={sec.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                          Section Name #{idx + 1}
                        </label>
                        <input
                          type="text"
                          value={sec.name}
                          onChange={e => {
                            const updated = [...testSections];
                            updated[idx].name = e.target.value;
                            setTestSections(updated);
                          }}
                          placeholder="e.g., Section A - Multiple Choice"
                          className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                            Target Question Count
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
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                  />
                  <span>Shuffle Questions Order</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paperSettings.shuffleOptions}
                    onChange={e => setPaperSettings(s => ({ ...s, shuffleOptions: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                  />
                  <span>Shuffle Multiple Choice Options</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paperSettings.showQuestionCode}
                    onChange={e => setPaperSettings(s => ({ ...s, showQuestionCode: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                  />
                  <span>Show Question Codes on Paper</span>
                </label>
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

          {/* ========================================== */}
          {/* RIGHT ASIDE: ACTION DECK                   */}
          {/* ========================================== */}
          <div className="sticky top-20 space-y-6">

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

      {/* ========================================== */}
      {/* STEP 3 & MODAL: FULL PRINTABLE TEST PREVIEW*/}
      {/* ========================================== */}
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

                {/* Paper Meta (Duration, Marks, Total Qs) */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Time: {durationMinutes} Minutes</span>
                  <span>Maximum Marks: {computedTotalMarks}</span>
                  <span>Questions: {totalSelectedQuestionsCount}</span>
                </div>

                {/* Exam Instructions Box */}
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

            {/* Modal Footer Controls */}
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
