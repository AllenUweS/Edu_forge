import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question, DocumentModel, DocumentSection } from '@eduforge/shared';
import {
  Plus, Check, X, Printer, Download, Eye, FileText,
  HelpCircle, Shuffle, Award, Search, ArrowRight, ArrowLeft, Layers, CheckCircle2
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
  const [durationMinutes, setDurationMinutes] = useState<number | string>(60);
  
  // ==========================================
  // Marking Scheme Configuration State
  // ==========================================
  const [marksPerQuestion, setMarksPerQuestion] = useState<number | string>(4); // Marks awarded for correct answer
  const [negativeMarks, setNegativeMarks] = useState<number | string>(-1); // Marks deducted for incorrect answer
  const [unansweredMarks, setUnansweredMarks] = useState<number | string>(0); // Marks for unanswered questions

  // ==========================================
  // Question Bank Selection & Filter State (Step 2)
  // ==========================================
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]); // Array of selected question UUIDs/codes
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(userSubject !== 'All' ? userSubject : 'all'); // Filter questions by subject
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all'); // Filter questions by chapter
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search input query for filtering questions
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All'); // Difficulty filter: All | Easy | Medium | Hard

  // ==========================================
  // Auto-Distribution Percentage Rules (Synced to 100%)
  // ==========================================
  const [easyPercent, setEasyPercent] = useState<number>(30);
  const [mediumPercent, setMediumPercent] = useState<number>(50);
  const [hardPercent, setHardPercent] = useState<number>(20);

  const handleEasyPercentChange = (val: number) => {
    const E = Math.max(0, Math.min(100, Math.round(val)));
    const oldM = mediumPercent;
    const oldH = hardPercent;
    const remaining = 100 - E;
    const oldOtherSum = oldM + oldH;

    let newM = 0;
    let newH = 0;

    if (oldOtherSum > 0) {
      newM = Math.round((oldM / oldOtherSum) * remaining);
      newH = remaining - newM;
    } else {
      newM = Math.round(remaining / 2);
      newH = remaining - newM;
    }

    setEasyPercent(E);
    setMediumPercent(newM);
    setHardPercent(newH);
  };

  const handleMediumPercentChange = (val: number) => {
    const M = Math.max(0, Math.min(100, Math.round(val)));
    const oldE = easyPercent;
    const oldH = hardPercent;
    const remaining = 100 - M;
    const oldOtherSum = oldE + oldH;

    let newE = 0;
    let newH = 0;

    if (oldOtherSum > 0) {
      newE = Math.round((oldE / oldOtherSum) * remaining);
      newH = remaining - newE;
    } else {
      newE = Math.round(remaining / 2);
      newH = remaining - newE;
    }

    setEasyPercent(newE);
    setMediumPercent(M);
    setHardPercent(newH);
  };

  const handleHardPercentChange = (val: number) => {
    const H = Math.max(0, Math.min(100, Math.round(val)));
    const oldE = easyPercent;
    const oldM = mediumPercent;
    const remaining = 100 - H;
    const oldOtherSum = oldE + oldM;

    let newE = 0;
    let newM = 0;

    if (oldOtherSum > 0) {
      newE = Math.round((oldE / oldOtherSum) * remaining);
      newM = remaining - newE;
    } else {
      newE = Math.round(remaining / 2);
      newM = remaining - newE;
    }

    setEasyPercent(newE);
    setMediumPercent(newM);
    setHardPercent(H);
  };

  // ==========================================
  // Paper Sections & Target Section Assignment State
  // ==========================================
  const [testSections, setTestSections] = useState<{ id: string; name: string; questionsCount: number | string }[]>([
    { id: 'sec-1', name: 'Section A — Biology', questionsCount: 50 }
  ]);
  const [targetSectionId, setTargetSectionId] = useState<string>('sec-1');
  const [questionSectionMap, setQuestionSectionMap] = useState<Record<string, string>>({});

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
   * Helper to retrieve list of available subject names
   */
  const getAvailableSubjectNames = (): string[] => {
    if (subjects.length > 0) {
      return subjects.map(s => s.name);
    }
    return ['Biology', 'Physics', 'Chemistry', 'Mathematics'];
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

  // Full Screen Preview Modal State & Answer Key Mode
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isAnswerKeyMode, setIsAnswerKeyMode] = useState<boolean>(false);

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
  const toggleQuestionSelection = (id: string, customSecId?: string) => {
    const secToUse = customSecId || targetSectionId || testSections[0]?.id || 'sec-1';
    setSelectedQuestionIds(prev => {
      if (prev.includes(id)) {
        const newMap = { ...questionSectionMap };
        delete newMap[id];
        setQuestionSectionMap(newMap);
        return prev.filter(qId => qId !== id);
      } else {
        setQuestionSectionMap(prevMap => ({ ...prevMap, [id]: secToUse }));
        return [...prev, id];
      }
    });
  };

  // Selects all currently filtered questions and assigns them to targetSectionId
  const handleSelectAll = () => {
    const secToUse = targetSectionId || testSections[0]?.id || 'sec-1';
    const newIds = filteredQuestions.map(q => q.id);
    setSelectedQuestionIds(newIds);
    setQuestionSectionMap(prev => {
      const updated = { ...prev };
      newIds.forEach(id => {
        if (!updated[id]) updated[id] = secToUse;
      });
      return updated;
    });
  };

  // Clears all selected questions
  const handleDeselectAll = () => {
    setSelectedQuestionIds([]);
    setQuestionSectionMap({});
  };

  /**
   * Handles switching the active Target Test Section in Step 2.
   * Automatically syncs the Subject Filter and Chapter Filter to match the section's configured subject!
   */
  const handleTargetSectionChange = (newSecId: string) => {
    setTargetSectionId(newSecId);
    const targetSec = testSections.find(s => s.id === newSecId);
    if (targetSec) {
      let subToUse = (targetSec as any).subject;
      if (!subToUse && targetSec.name) {
        const parts = targetSec.name.split('—').map(s => s.trim());
        if (parts.length > 1) {
          subToUse = parts[1];
        } else {
          const matched = subjects.find(sub => targetSec.name.toLowerCase().includes(sub.name.toLowerCase()));
          if (matched) subToUse = matched.name;
        }
      }

      if (subToUse) {
        const availableSubs = getAvailableSubjectNames();
        const matched = availableSubs.find(s => s.toLowerCase() === subToUse?.toLowerCase());
        if (matched) {
          setSelectedSubjectFilter(matched);
          setSelectedChapterFilter('all');
        }
      }
    }
  };

  // Automatically selects questions based on configured difficulty percentage rules (Easy / Medium / Hard)
  const handleAutoSelectDistribution = () => {
    const newSectionMap: Record<string, string> = {};
    let allChosen: string[] = [];

    testSections.forEach((sec) => {
      const secTarget = Number(sec.questionsCount) || 25;
      let secSub = (sec as any).subject;
      if (!secSub && sec.name) {
        const parts = sec.name.split('—').map(s => s.trim());
        if (parts.length > 1) secSub = parts[1];
      }
      if (!secSub) secSub = selectedSubject;

      const calcEasy = Math.round((secTarget * easyPercent) / 100);
      const calcMed = Math.round((secTarget * mediumPercent) / 100);
      const calcHard = Math.max(0, secTarget - calcEasy - calcMed);

      const secPool = questions.filter(q => {
        const qSub = (q.subject || '').toLowerCase();
        return qSub.includes(secSub.toLowerCase()) || secSub.toLowerCase().includes(qSub);
      });

      const poolToUse = secPool.length > 0 ? secPool : questions;

      const easyQ = poolToUse.filter(q => (q.difficulty || '').toLowerCase() === 'easy').map(q => q.id);
      const medQ = poolToUse.filter(q => (q.difficulty || '').toLowerCase() === 'medium').map(q => q.id);
      const hardQ = poolToUse.filter(q => (q.difficulty || '').toLowerCase() === 'hard').map(q => q.id);

      const chosenEasy = easyQ.slice(0, calcEasy);
      const chosenMed = medQ.slice(0, calcMed);
      const chosenHard = hardQ.slice(0, calcHard);

      const combined = Array.from(new Set([...chosenEasy, ...chosenMed, ...chosenHard]));
      const finalSecSelection = combined.length > 0 ? combined : poolToUse.slice(0, secTarget).map(q => q.id);

      finalSecSelection.forEach(qId => {
        newSectionMap[qId] = sec.id;
      });
      allChosen = [...allChosen, ...finalSecSelection];
    });

    const uniqueSelection = Array.from(new Set(allChosen));
    setSelectedQuestionIds(uniqueSelection);
    setQuestionSectionMap(newSectionMap);
    alert(`Auto-selected ${uniqueSelection.length} questions matching your section configurations and difficulty percentages (${easyPercent}% Easy / ${mediumPercent}% Medium / ${hardPercent}% Hard)!`);
  };

  // Section Management: Adds a new section (e.g. Section B)
  const handleAddSection = () => {
    const nextChar = String.fromCharCode(65 + testSections.length);
    const availableSubs = getAvailableSubjectNames();
    const subForSec = availableSubs[testSections.length % availableSubs.length] || selectedSubject;
    const newSecId = `sec-${Date.now()}`;
    const newSec = {
      id: newSecId,
      name: `Section ${nextChar} — ${subForSec}`,
      questionsCount: 25,
      subject: subForSec
    };
    setTestSections(prev => [...prev, newSec]);
    handleTargetSectionChange(newSecId);
  };

  // Section Management: Removes a section
  const handleRemoveSection = (id: string) => {
    if (testSections.length <= 1) return;
    const remaining = testSections.filter(s => s.id !== id);
    setTestSections(remaining);
    if (targetSectionId === id) {
      handleTargetSectionChange(remaining[0]?.id || 'sec-1');
    }
  };

  // ==========================================
  // Dynamic Score & Document Construction
  // ==========================================
  const totalSelectedQuestionsCount = selectedQuestionIds.length;
  const numericMarksPerQ = marksPerQuestion === '' ? 0 : Number(marksPerQuestion);
  const computedTotalMarks = marksPerQuestion === ''
    ? ''
    : ((totalSelectedQuestionsCount || 1) * numericMarksPerQ);

  /**
   * Constructs the DocumentModel payload matching the backend schema
   * with complete metadata, sections, and structured question blocks.
   */
  const buildDocumentModel = (): Partial<DocumentModel> => {
    const selectedQuestionsList = questions.filter(q =>
      selectedQuestionIds.some(id => String(id) === String(q.id))
    );

    const docSections: DocumentSection[] = testSections.map((sec, idx) => {
      // Find questions explicitly assigned to this section
      const assignedToSec = selectedQuestionsList.filter(
        q => (questionSectionMap[q.id] || targetSectionId || testSections[0]?.id) === sec.id
      );

      // Fallback distribution if none explicitly mapped
      const sectionQuestions = assignedToSec.length > 0
        ? assignedToSec
        : (selectedQuestionsList.length > 0
            ? selectedQuestionsList.filter((_, qIdx) => qIdx % testSections.length === idx)
            : questions.slice(0, Number(sec.questionsCount) || 10));

      const numericMarks = Number(marksPerQuestion) || 0;
      const secCount = Number(sec.questionsCount) || sectionQuestions.length;

      return {
        id: sec.id || `sec-${Date.now()}-${idx + 1}`,
        title: sec.name || `Section ${String.fromCharCode(65 + idx)} — ${selectedSubject}`,
        instructions: `Attempt all questions. Each question carries ${numericMarks} marks.`,
        marks: secCount * numericMarks,
        blocks: sectionQuestions.map((q, qIdx) => ({
          id: `blk-${Date.now()}-${idx}-${qIdx}`,
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
    setEasyPercent(30);
    setMediumPercent(50);
    setHardPercent(20);
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
   * Clones paper sheet directly to document body to unwrap modal overflow clipping.
   */
  const handleGeneratePdfStream = () => {
    const paperElem = document.querySelector('.printable-paper-sheet');
    if (!paperElem) {
      window.print();
      return;
    }

    const existingRoot = document.getElementById('print-paper-export-root');
    if (existingRoot) existingRoot.remove();

    const printRoot = document.createElement('div');
    printRoot.id = 'print-paper-export-root';
    printRoot.innerHTML = paperElem.outerHTML;

    document.body.appendChild(printRoot);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const cleanupRoot = document.getElementById('print-paper-export-root');
        if (cleanupRoot) cleanupRoot.remove();
      }, 1000);
    }, 150);
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
              setIsAnswerKeyMode(false);
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
                    onChange={e => setDurationMinutes(e.target.value === '' ? '' : (parseInt(e.target.value) || ''))}
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
                  onChange={e => setMarksPerQuestion(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={e => setNegativeMarks(e.target.value === '' ? '' : Number(e.target.value))}
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
                  onChange={e => setUnansweredMarks(e.target.value === '' ? '' : Number(e.target.value))}
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

              {/* Filters Row: Target Section, Subject, Chapter, Difficulty & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Target Test Section Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-teal-800 mb-1 tracking-wide">
                    Target Test Section
                  </label>
                  <select
                    value={targetSectionId}
                    onChange={e => handleTargetSectionChange(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-teal-300 rounded-xl text-teal-900 bg-teal-50/70 focus:ring-2 focus:ring-teal-600 cursor-pointer shadow-2xs"
                  >
                    {testSections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name || `Section ${String.fromCharCode(65 + idx)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Subject Filter */}
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

                {/* 3. Chapter Filter */}
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

                {/* 4. Difficulty Filter */}
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

                {/* 5. Search Question Bank */}
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
                  <table className="w-full text-left border-collapse min-w-[750px]">
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
                                <div className="line-clamp-2 max-w-md">
                                  <MathTextRenderer text={q.rawText || ''} />
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {q.subject || 'Biology'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
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

            {/* Difficulty Distribution Rules Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
                    Difficulty Distribution Rules
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Target difficulty percentage ratio (Automatically synced to 100%)
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  Total: {easyPercent + mediumPercent + hardPercent}%
                </span>
              </div>

              {/* 3 Synced Percentage Sliders & Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Easy % */}
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Easy
                    </span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={easyPercent}
                        onChange={e => handleEasyPercentChange(Number(e.target.value))}
                        className="w-12 text-right text-xs font-bold p-1 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={easyPercent}
                    onChange={e => handleEasyPercentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Medium % */}
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Medium
                    </span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={mediumPercent}
                        onChange={e => handleMediumPercentChange(Number(e.target.value))}
                        className="w-12 text-right text-xs font-bold p-1 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mediumPercent}
                    onChange={e => handleMediumPercentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Hard % */}
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Hard
                    </span>
                    <div className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={hardPercent}
                        onChange={e => handleHardPercentChange(Number(e.target.value))}
                        className="w-12 text-right text-xs font-bold p-1 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-rose-500 bg-white font-mono"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={hardPercent}
                    onChange={e => handleHardPercentChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              </div>

              {/* Progress Visual Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${easyPercent}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`Easy: ${easyPercent}%`} />
                <div style={{ width: `${mediumPercent}%` }} className="bg-amber-500 h-full transition-all duration-300" title={`Medium: ${mediumPercent}%`} />
                <div style={{ width: `${hardPercent}%` }} className="bg-rose-500 h-full transition-all duration-300" title={`Hard: ${hardPercent}%`} />
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
                {testSections.map((sec, idx) => {
                  const assignedCount = selectedQuestionIds.filter(
                    qId => (questionSectionMap[qId] || targetSectionId || testSections[0]?.id) === sec.id
                  ).length;

                  return (
                    <div key={sec.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase text-slate-500">
                          Section #{idx + 1}
                        </span>
                        <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                          {assignedCount} Questions Assigned
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
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
                            placeholder="e.g., Section A — Physics"
                            className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                            Section Subject
                          </label>
                          <select
                            value={(sec as any).subject || (sec.name.split('—')[1] || '').trim() || selectedSubject}
                            onChange={e => {
                              const newSub = e.target.value;
                              const updated = [...testSections];
                              (updated[idx] as any).subject = newSub;
                              const secLetter = String.fromCharCode(65 + idx);
                              updated[idx].name = `Section ${secLetter} — ${newSub}`;
                              setTestSections(updated);

                              if (targetSectionId === sec.id) {
                                setSelectedSubjectFilter(newSub);
                                setSelectedChapterFilter('all');
                              }
                            }}
                            className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg text-slate-900 bg-white cursor-pointer"
                          >
                            {getAvailableSubjectNames().map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
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
                                updated[idx].questionsCount = e.target.value === '' ? '' : Number(e.target.value);
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
                  );
                })}
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
                  setIsAnswerKeyMode(false);
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
                  setIsAnswerKeyMode(false);
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
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" /> Export as PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAnswerKeyMode(true);
                  setIsPreviewModalOpen(true);
                }}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Generate Answer Key
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
            
            {/* Modal Header with View Mode Toggle */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  {isAnswerKeyMode ? '✓ Answer Key & Detailed Solutions' : 'Test Paper Preview'}
                </h3>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {testSections.length} Sections • {selectedQuestionIds.length} Qs
                </span>
              </div>

              {/* View Mode Toggle Switch */}
              <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAnswerKeyMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isAnswerKeyMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 Question Paper
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnswerKeyMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isAnswerKeyMode ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✓ Answer Key
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 rounded-lg ml-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Printable Document Paper */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100">
              {/* Print Media Styles */}
              <style>{`
                @media print {
                  body {
                    background: #fff !important;
                    color: #000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                  }
                  #root, body > div:not(#print-paper-export-root) {
                    display: none !important;
                  }
                  #print-paper-export-root {
                    display: block !important;
                    position: static !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #fff !important;
                    overflow: visible !important;
                  }
                  #print-paper-export-root .printable-paper-sheet, .printable-paper-sheet {
                    position: static !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: #fff !important;
                    display: block !important;
                    overflow: visible !important;
                  }
                  .question-item-block {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                    margin-bottom: 1.25rem !important;
                  }
                  .section-header-block {
                    break-after: avoid !important;
                    page-break-after: avoid !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 1rem !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 15mm 15mm 15mm 15mm;
                  }
                }
              `}</style>

              <div className="printable-paper-sheet max-w-[780px] mx-auto bg-white p-6 sm:p-10 border border-slate-200 rounded-xl shadow-md text-slate-900 space-y-6">
                
                {/* Paper Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {(() => {
                      const secSubs = Array.from(new Set(testSections.map(sec => {
                        let sub = (sec as any).subject;
                        if (!sub && sec.name) {
                          const parts = sec.name.split('—').map(s => s.trim());
                          if (parts.length > 1) sub = parts[1];
                        }
                        return sub || selectedSubject;
                      }).filter(Boolean)));

                      return secSubs.length > 1
                        ? `${examType} MOCK TEST (${secSubs.join(' • ').toUpperCase()})`
                        : `${examType} ${selectedSubject.toUpperCase()}`;
                    })()}
                  </h1>
                  <h2 className="text-sm font-bold text-slate-700 uppercase">
                    {testName.toUpperCase() || (selectedChapter ? `${selectedChapter.toUpperCase()} TEST` : 'QUESTION PAPER')}
                  </h2>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {isAnswerKeyMode ? '✓ OFFICIAL ANSWER KEY & DETAILED SOLUTIONS' : 'MULTIPLE CHOICE QUESTIONS'}
                  </p>
                </div>

                {/* Paper Meta (Duration, Marks, Total Qs) */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Time: {durationMinutes} Minutes</span>
                  <span>Maximum Marks: {computedTotalMarks}</span>
                  <span>Total Questions: {selectedQuestionIds.length}</span>
                </div>

                {/* Exam Instructions Box */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 text-xs space-y-1">
                  <span className="font-bold text-slate-900">Instructions & Marking Scheme:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pt-1">
                    <li>There are {selectedQuestionIds.length} multiple-choice questions distributed across {testSections.length} section(s).</li>
                    <li>Each question carries {marksPerQuestion} marks.</li>
                    <li>One mark ({negativeMarks}) will be deducted for an incorrect answer.</li>
                    <li>{isAnswerKeyMode ? 'Correct answer for each question is marked with a green checkmark (✓).' : 'Select only one answer for each question.'}</li>
                  </ol>
                </div>

                {/* DYNAMIC ALL SECTIONS RENDERING */}
                <div className="space-y-8 pt-2">
                  {selectedQuestionIds.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-semibold italic border border-dashed border-slate-200 rounded-lg">
                      No questions selected for this test paper yet. Go to Step 2 (Select Questions) to pick your questions.
                    </div>
                  ) : (
                    testSections.map((sec, secIdx) => {
                      const selectedQs = questions.filter(q => selectedQuestionIds.includes(q.id));

                      // Check if every section has explicit questions mapped in questionSectionMap
                      const mappedCounts = testSections.map(s => selectedQs.filter(q => questionSectionMap[q.id] === s.id).length);
                      const doAllSectionsHaveExplicitQs = mappedCounts.every(cnt => cnt > 0);

                      let sectionQuestions: typeof selectedQs = [];

                      if (doAllSectionsHaveExplicitQs) {
                        sectionQuestions = selectedQs.filter(q => questionSectionMap[q.id] === sec.id);
                      } else {
                        const explicitQsForThisSec = selectedQs.filter(q => questionSectionMap[q.id] === sec.id);
                        if (explicitQsForThisSec.length > 0) {
                          sectionQuestions = explicitQsForThisSec;
                        } else {
                          // Proportional share across all sections so NO section is left with 0 questions!
                          const numSecs = testSections.length;
                          const basePerSec = Math.floor(selectedQs.length / numSecs);
                          const extraQs = selectedQs.length % numSecs;

                          let start = 0;
                          for (let i = 0; i < secIdx; i++) {
                            start += basePerSec + (i < extraQs ? 1 : 0);
                          }
                          const count = basePerSec + (secIdx < extraQs ? 1 : 0);
                          sectionQuestions = selectedQs.slice(start, start + count);
                        }
                      }

                      return (
                        <div key={sec.id} className="space-y-4 pt-4 border-t border-slate-300 first:border-t-0 first:pt-0">
                          {/* Section Banner Header */}
                          <div className="section-header-block bg-slate-100 p-3 rounded-lg border border-slate-300 flex items-center justify-between">
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                {sec.name || `Section ${String.fromCharCode(65 + secIdx)}`}
                              </h3>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {sec.questionsCount ? `Target: ${sec.questionsCount} Qs` : ''} • ({sectionQuestions.length} Questions in this section)
                              </p>
                            </div>
                            <span className="text-[10px] font-extrabold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase">
                              Section #{secIdx + 1}
                            </span>
                          </div>

                          {/* Section Questions */}
                          {sectionQuestions.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 font-semibold text-xs italic border border-dashed border-slate-200 rounded-lg">
                              No questions assigned to this section yet. Select target section in Step 2 to add questions here.
                            </div>
                          ) : (
                            <div className="space-y-6">
                            {sectionQuestions.map((q, qIdx) => {
                              const globalQNum = selectedQuestionIds.indexOf(q.id) + 1;
                              const targetOptKey = (((q as any).correct_option || (q as any).correctOption || 'a')).toString().toLowerCase().trim();

                              return (
                                <div key={q.id || qIdx} className="question-item-block p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-2xs">
                                  {/* Question Title & Number */}
                                  <div className="font-bold text-slate-900 text-xs leading-relaxed flex gap-2">
                                    <span className="shrink-0 font-extrabold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded">
                                      Q{globalQNum > 0 ? globalQNum : qIdx + 1}.
                                    </span>
                                    <div
                                      className="flex-1 pt-0.5"
                                      dangerouslySetInnerHTML={{
                                        __html: q.rawText || q.content || 'Question Statement'
                                      }}
                                    />
                                  </div>

                                  {/* Render Diagram / Image if present */}
                                  {(q.imageUrl || q.diagramUrl) && (
                                    <div className="my-2 max-h-48 overflow-hidden flex justify-center bg-slate-50 border border-slate-200 rounded-lg p-2">
                                      <img
                                        src={q.imageUrl || q.diagramUrl}
                                        alt="Question Diagram"
                                        className="max-h-44 object-contain rounded"
                                      />
                                    </div>
                                  )}

                                  {/* Multiple Choice Options (A, B, C, D) */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                    {q.options && q.options.length > 0 ? (
                                      q.options.map((opt, oIdx) => {
                                        const optKey = (((opt as any).option_key || (opt as any).optionKey || String.fromCharCode(97 + oIdx))).toString().toLowerCase().trim();
                                        const letterKey = String.fromCharCode(97 + oIdx);
                                        const isCorrect = isAnswerKeyMode && (optKey === targetOptKey || letterKey === targetOptKey);

                                        return (
                                          <div
                                            key={opt.id || oIdx}
                                            className={`p-2.5 border rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                                              isCorrect
                                                ? 'border-2 border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-xs'
                                                : 'border-slate-200 bg-slate-50/70 text-slate-900'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className={`font-black shrink-0 px-2 py-0.5 rounded text-[11px] ${
                                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                                              }`}>
                                                {String.fromCharCode(65 + oIdx)}
                                              </span>
                                              <div
                                                className="truncate"
                                                dangerouslySetInnerHTML={{
                                                  __html: opt.rawText || (opt as any).text || (opt as any).label || ''
                                                }}
                                              />
                                            </div>

                                            {/* GREEN TICK MARK FOR ANSWER KEY MODE */}
                                            {isCorrect && (
                                              <span className="shrink-0 flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full ml-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                Correct Answer
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      ['a', 'b', 'c', 'd'].map((letter, oIdx) => {
                                        const isCorrect = isAnswerKeyMode && letter === targetOptKey;
                                        return (
                                          <div
                                            key={letter}
                                            className={`p-2.5 border rounded-lg text-xs font-medium flex items-center justify-between ${
                                              isCorrect
                                                ? 'border-2 border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-xs'
                                                : 'border-slate-200 bg-slate-50/70 text-slate-900'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className={`font-black shrink-0 px-2 py-0.5 rounded text-[11px] ${
                                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'
                                              }`}>
                                                {letter.toUpperCase()}
                                              </span>
                                              <span>Option {letter.toUpperCase()}</span>
                                            </div>
                                            {isCorrect && (
                                              <span className="shrink-0 flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                Correct Answer
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* MASTER ANSWER KEY GRID TABLE (Only in Answer Key mode) */}
                {isAnswerKeyMode && selectedQuestionIds.length > 0 && (
                  <div className="mt-8 pt-6 border-t-2 border-emerald-600 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        Master Answer Key Table ({selectedQuestionIds.length} Questions)
                      </h3>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center text-xs font-bold font-mono">
                      {selectedQuestionIds.map((qId, idx) => {
                        const qObj = questions.find(q => q.id === qId);
                        const correctOpt = ((((qObj as any)?.correct_option || (qObj as any)?.correctOption || 'A'))).toString().toUpperCase();
                        return (
                          <div key={qId} className="p-2 border border-emerald-300 bg-emerald-50 rounded-lg shadow-2xs">
                            <div className="text-[10px] text-slate-500">Q{idx + 1}</div>
                            <div className="text-sm font-black text-emerald-900 flex items-center justify-center gap-0.5">
                              {correctOpt} <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Back to Builder
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePdfStream}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-700" /> Export as PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handlePublishTest();
                  }}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
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
