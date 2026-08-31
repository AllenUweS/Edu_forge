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
  type: 'text' | 'image' | 'diagram';
  text?: string;
  imageUrl?: string;
  diagramSvg?: string;
}

interface CreateQuestionPageProps {
  initialQuestion?: Question | null;
  onBackToQuestionBank: () => void;
}

export const SUBJECT_CHAPTERS_MAP: Record<string, string[]> = {
  Physics: [
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Current',
    'Electromagnetic Waves',
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics'
  ],
  Chemistry: [
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity in Properties',
    'Chemical Bonding and Molecular Structure',
    'Thermodynamics',
    'Equilibrium',
    'Redox Reactions',
    'Organic Chemistry: Some Basic Principles and Techniques',
    'Hydrocarbons',
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'The d- and f-Block Elements',
    'Coordination Compounds',
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules'
  ],
  Biology: [
    'The Living World',
    'Biological Classification',
    'Plant Kingdom',
    'Animal Kingdom',
    'Morphology of Flowering Plants',
    'Anatomy of Flowering Plants',
    'Structural Organisation in Animals',
    'Cell: The Unit of Life',
    'Biomolecules',
    'Cell Cycle and Cell Division',
    'Photosynthesis in Higher Plants',
    'Respiration in Plants',
    'Plant Growth and Development',
    'Breathing and Exchange of Gases',
    'Body Fluids and Circulation',
    'Excretory Products and their Elimination',
    'Locomotion and Movement',
    'Neural Control and Coordination',
    'Chemical Coordination and Integration',
    'Sexual Reproduction in Flowering Plants',
    'Human Reproduction',
    'Reproductive Health',
    'Principles of Inheritance and Variation',
    'Molecular Basis of Inheritance',
    'Evolution',
    'Human Health and Disease',
    'Microbes in Human Welfare',
    'Biotechnology: Principles and Processes',
    'Biotechnology and its Applications',
    'Organisms and Populations',
    'Ecosystem',
    'Biodiversity and Conservation'
  ],
  Mathematics: [
    'Sets, Relations and Functions',
    'Complex Numbers and Quadratic Equations',
    'Matrices and Determinants',
    'Permutations and Combinations',
    'Mathematical Induction & Binomial Theorem',
    'Sequences and Series',
    'Limits, Continuity and Differentiability',
    'Integral Calculus',
    'Differential Equations',
    'Coordinate Geometry & Straight Lines',
    'Conic Sections & Circles',
    'Three Dimensional Geometry',
    'Vector Algebra',
    'Statistics and Probability',
    'Trigonometry'
  ]
};

export const getStandardChaptersForSubject = (subName?: string): string[] => {
  if (!subName) return SUBJECT_CHAPTERS_MAP['Physics'];
  const norm = subName.trim().toLowerCase();
  if (norm.includes('phys')) return SUBJECT_CHAPTERS_MAP['Physics'];
  if (norm.includes('chem')) return SUBJECT_CHAPTERS_MAP['Chemistry'];
  if (norm.includes('bio')) return SUBJECT_CHAPTERS_MAP['Biology'];
  if (norm.includes('math')) return SUBJECT_CHAPTERS_MAP['Mathematics'];
  const match = Object.keys(SUBJECT_CHAPTERS_MAP).find(k => k.toLowerCase() === norm);
  return match ? SUBJECT_CHAPTERS_MAP[match] : SUBJECT_CHAPTERS_MAP['Physics'];
};

export const resolveChaptersForSubject = (subName: string, dbChs: any[] = [], dbSubs: any[] = []): string[] => {
  if (!subName) return getStandardChaptersForSubject('Physics');
  const normSub = subName.trim().toLowerCase();
  const standardList = getStandardChaptersForSubject(subName);

  // Exclude chapters strictly specific to other standard subjects
  const otherSubjectsChapters = new Set<string>();
  Object.entries(SUBJECT_CHAPTERS_MAP).forEach(([sKey, sList]) => {
    if (!sKey.toLowerCase().includes(normSub) && !normSub.includes(sKey.toLowerCase())) {
      sList.forEach(ch => {
        if (!standardList.some(st => st.toLowerCase() === ch.toLowerCase())) {
          otherSubjectsChapters.add(ch.toLowerCase());
        }
      });
    }
  });

  const selectedSub = dbSubs.find(s => (s.name || '').toLowerCase() === normSub || normSub.includes((s.name || '').toLowerCase()));
  const selectedSubId = selectedSub?.id ? String(selectedSub.id).toLowerCase() : '';

  const dbMatches = (dbChs || []).filter((c: any) => {
    const cSubName = (
      typeof c.subject === 'string' ? c.subject : (c.subjects?.name || c.subject_name || '')
    ).trim().toLowerCase();
    const cSubId = (c.subjectId || c.subject_id || '').toString().trim().toLowerCase();

    const matchesName = cSubName && (cSubName === normSub || cSubName.includes(normSub) || normSub.includes(cSubName));
    const matchesId = selectedSubId && cSubId && selectedSubId === cSubId;
    if (!matchesName && !matchesId) return false;

    const chTitle = (c.title || c.name || c.chapter_name || '').trim();
    if (!chTitle) return false;
    if (otherSubjectsChapters.has(chTitle.toLowerCase())) return false;
    return true;
  }).map((c: any) => (c.title || c.name || c.chapter_name || '').trim()).filter(Boolean);

  const merged = Array.from(new Set([...standardList, ...dbMatches]));
  return merged.length > 0 ? merged : standardList;
};

export const CreateQuestionPage: React.FC<CreateQuestionPageProps> = ({
  initialQuestion,
  onBackToQuestionBank
}) => {
  const user = getUserProfile();
  const userSubject = user.assigned_subject || 'All';
  const defaultSubject = userSubject !== 'All' ? userSubject : (initialQuestion?.subject || 'Physics');

  // Database Subjects & Chapters
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);
  const [dbChapters, setDbChapters] = useState<any[]>([]);

  // Metadata state
  const [subject, setSubject] = useState<string>(
    initialQuestion?.subject || defaultSubject
  );

  const availableChapters = React.useMemo(() => {
    return resolveChaptersForSubject(subject, dbChapters, dbSubjects);
  }, [dbChapters, dbSubjects, subject]);

  const [chapter, setChapter] = useState<string>(() => {
    if (initialQuestion?.chapter) return initialQuestion.chapter;
    const initialList = resolveChaptersForSubject(initialQuestion?.subject || defaultSubject, [], []);
    return initialList[0] || 'Units and Measurements';
  });

  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialQuestion?.difficulty || 'Medium');
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialQuestion?.negativeMarks !== undefined ? initialQuestion.negativeMarks : 1);

  // Question Code manual override state
  const [customQuestionCode, setCustomQuestionCode] = useState<string>(() => {
    const existing = initialQuestion?.questionCode || (initialQuestion as any)?.question_code;
    if (existing) return existing;
    const initSub = initialQuestion?.subject || defaultSubject;
    const initChap = initialQuestion?.chapter || resolveChaptersForSubject(initSub, [], [])[0];
    return formatQuestionCode({ subject: initSub, chapter: initChap, id: initialQuestion?.id });
  });

  const [isManualQuestionCode, setIsManualQuestionCode] = useState<boolean>(
    Boolean(initialQuestion?.questionCode || initialQuestion?.question_code)
  );

  // Load backend subjects & chapters
  React.useEffect(() => {
    api.getSubjects().then(subs => {
      if (subs && Array.isArray(subs)) setDbSubjects(subs);
    }).catch(console.error);

    api.getChapters().then(chs => {
      if (chs && Array.isArray(chs)) setDbChapters(chs);
    }).catch(console.error);
  }, []);

  const allowedSubjects = React.useMemo(() => {
    if (userSubject !== 'All') {
      const match = dbSubjects.find(s => s.name.toLowerCase() === userSubject.toLowerCase());
      return match ? [match] : [{ name: userSubject, code: userSubject.substring(0, 3).toUpperCase() }];
    }
    if (dbSubjects.length > 0) return dbSubjects;
    return [
      { name: 'Physics', code: 'PHY' },
      { name: 'Chemistry', code: 'CHE' },
      { name: 'Biology', code: 'BIO' },
      { name: 'Mathematics', code: 'MAT' }
    ];
  }, [dbSubjects, userSubject]);

  // Force faculty userSubject if restricted
  React.useEffect(() => {
    if (userSubject !== 'All' && subject !== userSubject) {
      setSubject(userSubject);
    }
  }, [userSubject, subject]);

  // Auto-correct chapter when subject changes or chapters load
  React.useEffect(() => {
    if (!isCustomChapter && availableChapters.length > 0) {
      const exists = availableChapters.some(c => c.toLowerCase() === (chapter || '').toLowerCase());
      if (!exists) {
        const nextCh = availableChapters[0];
        setChapter(nextCh);
        if (!isManualQuestionCode) {
          setCustomQuestionCode(formatQuestionCode({ subject, chapter: nextCh, id: initialQuestion?.id }));
        }
      }
    }
  }, [subject, availableChapters, isCustomChapter, isManualQuestionCode, chapter, initialQuestion?.id]);

  // Sync Question Code with subject/chapter when not manually edited
  React.useEffect(() => {
    if (!isManualQuestionCode) {
      setCustomQuestionCode(formatQuestionCode({ subject, chapter, id: initialQuestion?.id }));
    }
  }, [subject, chapter, isManualQuestionCode, initialQuestion?.id]);

  // Content Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: 'blk-1', type: 'text', text: initialQuestion?.rawText || '' },
    ...(initialQuestion?.imageUrl ? [{ id: 'blk-2', type: 'image' as const, imageUrl: initialQuestion.imageUrl }] : [])
  ]);

  // MCQ Options
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : [
          { id: 'opt-1', key: 'A', rawText: '', isCorrect: true, content: [] },
          { id: 'opt-2', key: 'B', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-3', key: 'C', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-4', key: 'D', rawText: '', isCorrect: false, content: [] }
        ]
  );

  // Solution
  const [solutionText, setSolutionText] = useState(
    initialQuestion?.explanationText || ''
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
      const targetSub = initialQuestion.subject || (userSubject !== 'All' ? userSubject : 'Physics');
      setSubject(targetSub);
      const subChs = resolveChaptersForSubject(targetSub, dbChapters, dbSubjects);
      setChapter(initialQuestion.chapter || subChs[0] || '');
      setIsCustomChapter(false);
      setDifficulty(initialQuestion.difficulty || 'Medium');
      setMarks(initialQuestion.marks || 4);
      setNegativeMarks(initialQuestion.negativeMarks !== undefined ? initialQuestion.negativeMarks : 1);
      
      const qCode = initialQuestion.questionCode || initialQuestion.question_code || '';
      if (qCode) {
        setCustomQuestionCode(qCode);
        setIsManualQuestionCode(true);
      } else {
        setIsManualQuestionCode(false);
        setCustomQuestionCode(formatQuestionCode({ subject: targetSub, chapter: initialQuestion.chapter || subChs[0], id: initialQuestion.id }));
      }
      
      const questionStatement = initialQuestion.rawText || (Array.isArray(initialQuestion.content) ? initialQuestion.content.map((b: any) => b.text || b.html || '').join(' ') : '');
      const contentArr = Array.isArray(initialQuestion.content) ? (initialQuestion.content as any[]) : [];
      const initialSvg = initialQuestion.diagramSvg || (initialQuestion as any)?.diagram_svg || contentArr.find(b => b.type === 'diagram' || b.diagramSvg || b.svg)?.diagramSvg || contentArr.find(b => b.type === 'diagram' || b.diagramSvg || b.svg)?.svg;
      const initialImg = initialQuestion.imageUrl || initialQuestion.diagramUrl || contentArr.find(b => b.type === 'image' || b.imageUrl || b.url)?.url;

      setBlocks([
        { id: 'blk-1', type: 'text', text: questionStatement },
        ...(initialSvg ? [{ id: 'blk-2', type: 'diagram' as const, diagramSvg: initialSvg }] : []),
        ...(initialImg ? [{ id: 'blk-3', type: 'image' as const, imageUrl: initialImg }] : [])
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
      const targetSub = userSubject !== 'All' ? userSubject : 'Physics';
      setSubject(targetSub);
      const subChs = resolveChaptersForSubject(targetSub, dbChapters, dbSubjects);
      const targetCh = subChs[0] || 'Units and Measurements';
      setChapter(targetCh);
      setIsCustomChapter(false);
      setIsManualQuestionCode(false);
      setCustomQuestionCode(formatQuestionCode({ subject: targetSub, chapter: targetCh }));
      setDifficulty('Medium');
      setMarks(4);
      setNegativeMarks(1);
      setBlocks([{ id: `blk-${Date.now()}`, type: 'text', text: '' }]);
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
    const subToUse = userSubject !== 'All' ? userSubject : subject;
    const dynamicCode = formatQuestionCode({ subject: subToUse, chapter, id: initialQuestion?.id });
    const finalCode = (customQuestionCode || dynamicCode).trim();

    const questionData: Partial<Question> = {
      ...(initialQuestion?.id ? { id: initialQuestion.id } : {}),
      questionCode: finalCode,
      question_code: finalCode,
      questionNumber: 1,
      questionType: 'MCQ_SINGLE',
      rawText: rawStatement,
      content: blocks as any,
      subject: subToUse,
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
        alert('Question updated successfully!');
      } else {
        const res: any = await api.createQuestion(questionData);
        if (res?.error) {
          alert(res.error);
          return false;
        }
        alert('Question saved to Supabase Question Bank successfully!');
      }
      return true;
    } catch (err: any) {
      console.error('Save question error:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Error saving question.';
      alert(errMsg);
      return false;
    }
  };

  const resetFormToBlank = () => {
    const targetSub = userSubject !== 'All' ? userSubject : 'Physics';
    setSubject(targetSub);
    const subChs = resolveChaptersForSubject(targetSub, dbChapters, dbSubjects);
    const targetCh = subChs[0] || 'Units and Measurements';
    setChapter(targetCh);
    setIsCustomChapter(false);
    setIsManualQuestionCode(false);
    setCustomQuestionCode(formatQuestionCode({ subject: targetSub, chapter: targetCh }));
    setDifficulty('Medium');
    setMarks(4);
    setNegativeMarks(1);
    setBlocks([{ id: `blk-${Date.now()}`, type: 'text', text: '' }]);
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
    const success = await handleSaveDraft();
    if (success) {
      resetFormToBlank();
      onBackToQuestionBank();
    }
  };

  const previewQuestionObj: Question = {
    id: initialQuestion?.id || customQuestionCode || 'PHY-UNI-0001',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
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

      {/* Single-Column Question Layout */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Panel 1: Question Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Question Details</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Question Code:</span>
              <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-md">
                {customQuestionCode || formatQuestionCode({ subject, chapter, id: initialQuestion?.id })}
              </span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[11px] text-slate-500 uppercase">
                  Question Code
                </label>
                {isManualQuestionCode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualQuestionCode(false);
                      setCustomQuestionCode(formatQuestionCode({ subject, chapter, id: initialQuestion?.id }));
                    }}
                    className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Reset Auto
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customQuestionCode}
                onChange={e => {
                  setCustomQuestionCode(e.target.value);
                  setIsManualQuestionCode(true);
                }}
                placeholder="e.g. PHY-UNI-0001"
                className="w-full p-2 border border-slate-300 rounded-lg text-teal-900 bg-white font-mono font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-[11px] text-slate-500 uppercase mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={e => {
                  const newSub = e.target.value;
                  setSubject(newSub);
                  setIsCustomChapter(false);
                  const subChs = resolveChaptersForSubject(newSub, dbChapters, dbSubjects);
                  const firstCh = subChs[0] || '';
                  setChapter(firstCh);
                  if (!isManualQuestionCode) {
                    setCustomQuestionCode(formatQuestionCode({ subject: newSub, chapter: firstCh, id: initialQuestion?.id }));
                  }
                }}
                disabled={userSubject !== 'All'}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {allowedSubjects.map(s => (
                  <option key={s.id || s.code || s.name} value={s.name}>
                    {s.name} ({s.code || s.name.substring(0, 3).toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[11px] text-slate-500 uppercase">
                  Chapter / Unit
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomChapter(!isCustomChapter);
                    if (!isCustomChapter) setChapter('');
                    else if (availableChapters.length > 0) setChapter(availableChapters[0]);
                  }}
                  className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  {isCustomChapter ? '← Choose from dropdown' : '+ Type custom chapter'}
                </button>
              </div>

              {!isCustomChapter ? (
                <select
                  value={chapter}
                  onChange={e => {
                    if (e.target.value === '__NEW__') {
                      setIsCustomChapter(true);
                      setChapter('');
                    } else {
                      setChapter(e.target.value);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {availableChapters.map(chTitle => (
                    <option key={chTitle} value={chTitle}>
                      {chTitle}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add new custom chapter...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Type custom chapter name..."
                  value={chapter}
                  onChange={e => setChapter(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              )}
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
                Marks (+ / -)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(Number(e.target.value))}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-center"
                  title="Marks for correct answer"
                />
                <input
                  type="number"
                  value={negativeMarks}
                  onChange={e => setNegativeMarks(Number(e.target.value))}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-center"
                  title="Negative marks for incorrect answer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Content Blocks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Question Content</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addTextBlock}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md transition-colors cursor-pointer"
              >
                + Text Block
              </button>
              <button
                type="button"
                onClick={addImageBlock}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md transition-colors cursor-pointer"
              >
                + Image Block
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {blocks.map((b) => (
              <div key={b.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
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
                  ) : b.type === 'diagram' && b.diagramSvg ? (
                    <div className="py-4 text-center space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="max-h-52 w-full flex items-center justify-center scale-95" dangerouslySetInnerHTML={{ __html: b.diagramSvg }} />
                    </div>
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
            <span className="font-bold text-xs text-slate-900">Multiple Choice Options</span>
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
                  placeholder={`Option ${opt.key?.toUpperCase() || String.fromCharCode(65 + idx)}...`}
                />
                <button
                  type="button"
                  onClick={() => setCorrectOption(idx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all mt-1.5 cursor-pointer ${
                    opt.isCorrect
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs ring-2 ring-teal-200'
                      : 'border-slate-300 text-transparent hover:border-slate-400 hover:text-slate-300'
                  }`}
                  title={opt.isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 4: Solution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Solution & Explanation</span>
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

      {/* Student Preview Drawer */}
      <StudentPreviewDrawer
        isOpen={isPreviewOpen}
        question={previewQuestionObj}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Image Library Picker Modal */}
      <ImageLibraryModal
        isOpen={activeImageBlockId !== null}
        subject={subject}
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
