import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DocumentModel, Question } from '@eduforge/shared';
import { Plus, BookOpen, Layers, HelpCircle, FileText } from 'lucide-react';
import { SubjectItem } from './SubjectsPage.js';
import { ChapterItem } from './ChaptersPage.js';
import { formatQuestionCode } from '../utils/questionCode.js';

interface DashboardPageProps {
  subjectsList?: SubjectItem[];
  chaptersList?: ChapterItem[];
  onOpenDocument: (docId: string) => void;
  onNewPaperWizard: () => void;
  onOpenQuestionBuilder: () => void;
  onOpenTemplateGallery: () => void;
  onNavigateToQuestionBank: () => void;
  onNavigateToTemplates: () => void;
  onNavigateToScience: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  subjectsList = [],
  chaptersList = [],
  onOpenQuestionBuilder,
  onNavigateToQuestionBank
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [apiSubjects, setApiSubjects] = useState<any[]>([]);
  const [apiChapters, setApiChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docs, qList, subList, chList] = await Promise.all([
        api.getDocuments(),
        api.getQuestions(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setDocuments(docs || []);
      setQuestions(qList || []);
      setApiSubjects(subList || []);
      setApiChapters(chList || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real Counts from active frontend state + API
  const totalSubjectsCount = subjectsList.length > 0 ? subjectsList.length : apiSubjects.length;
  const totalChaptersCount = chaptersList.length > 0 ? chaptersList.length : apiChapters.length;

  // Dynamic Question Distribution by Subject (calculated 100% strictly from real question bank records)
  const subjectCountMap: Record<string, number> = {};
  questions.forEach(q => {
    const rawSub = (q.subject || 'General').trim();
    const matchingSub = subjectsList.find(s => s.name.toLowerCase() === rawSub.toLowerCase());
    const key = matchingSub ? matchingSub.name : rawSub;
    subjectCountMap[key] = (subjectCountMap[key] || 0) + 1;
  });

  // Prepare Distribution List showing actual question counts per subject
  const distributionList = subjectsList.length > 0
    ? subjectsList.map(s => ({
        name: s.name,
        count: subjectCountMap[s.name] || 0
      }))
    : (Object.keys(subjectCountMap).length > 0
        ? Object.entries(subjectCountMap).map(([name, count]) => ({ name, count }))
        : apiSubjects.map(s => ({ name: s.name, count: subjectCountMap[s.name] || 0 })));

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Question bank and test generation overview.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenQuestionBuilder}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Question
        </button>
      </div>

      {/* 4 Stat Cards Displaying Real Backend Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {/* Card 1: Subjects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e6f4f6] text-[#007a8c] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Subjects
            </div>
            <div className="text-2xl font-black text-[#007a87] tracking-tight">
              {loading ? '...' : totalSubjectsCount}
            </div>
          </div>
        </div>

        {/* Card 2: Chapters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e6f4f6] text-[#007a8c] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Chapters
            </div>
            <div className="text-2xl font-black text-[#007a87] tracking-tight">
              {loading ? '...' : totalChaptersCount}
            </div>
          </div>
        </div>

        {/* Card 3: Questions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e6f4f6] text-[#007a8c] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Questions
            </div>
            <div className="text-2xl font-black text-[#007a87] tracking-tight">
              {loading ? '...' : questions.length.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 4: Tests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e6f4f6] text-[#007a8c] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Tests
            </div>
            <div className="text-2xl font-black text-[#007a87] tracking-tight">
              {loading ? '...' : documents.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Real Recent Questions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Questions
            </h2>
            <button
              type="button"
              onClick={onNavigateToQuestionBank}
              className="px-3.5 py-1 border border-teal-700 text-teal-700 hover:bg-teal-50 font-bold text-[11px] rounded-md transition-all active:scale-[0.98] cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3.5 min-h-[140px]">
            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading recent questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No recent questions found. Click "+ Create Question" to add your first question.
              </div>
            ) : (
              questions.slice(0, 5).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-800 py-1 border-b border-slate-50 last:border-0"
                >
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {formatQuestionCode(q)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="line-clamp-1">{q.chapter || (q.rawText || '').substring(0, 30) || 'Question'}</span>
                  {q.isSystem ? (
                    <span className="ml-auto px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-bold">
                      Published
                    </span>
                  ) : (
                    <span className="ml-auto px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                      Draft
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Real Question Distribution by Subject */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Question Distribution
            </h2>
          </div>

          <div className="space-y-4 min-h-[140px] text-xs font-semibold">
            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading distribution...</div>
            ) : distributionList.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No subject distribution data available yet.
              </div>
            ) : (
              distributionList.map(item => (
                <div key={item.name} className="flex items-center justify-between text-slate-800 border-b border-slate-50 pb-2 last:border-0">
                  <span>{item.name}</span>
                  <span className="font-extrabold text-[#007a87] font-mono text-sm">{item.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
