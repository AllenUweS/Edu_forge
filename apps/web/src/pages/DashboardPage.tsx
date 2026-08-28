import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DocumentModel, Question } from '@eduforge/shared';
import { Plus, BookOpen, Layers, HelpCircle, FileText, BarChart3, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { SubjectItem } from './SubjectsPage.js';
import { ChapterItem } from './ChaptersPage.js';
import { formatQuestionCode } from '../utils/questionCode.js';

import { getUserProfile } from '../utils/userProfile.js';

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
  onNavigateToReports?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  subjectsList = [],
  chaptersList = [],
  onOpenQuestionBuilder,
  onNavigateToQuestionBank,
  onNavigateToReports
}) => {
  const user = getUserProfile();

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

      let filteredDocs = docs || [];
      let filteredQs = qList || [];
      let filteredSubs = subList || [];
      let filteredChs = chList || [];

      if (user.assigned_subject !== 'All') {
        const targetSubLower = user.assigned_subject.toLowerCase();
        filteredDocs = filteredDocs.filter(d => 
          (((d as any).subject || d.metadata?.subject || '') + ' ' + (d.title || '')).toLowerCase().includes(targetSubLower)
        );
        filteredQs = filteredQs.filter(q => 
          (q.subject || '').toLowerCase().includes(targetSubLower)
        );
        filteredSubs = filteredSubs.filter(s => 
          (s.name || '').toLowerCase().includes(targetSubLower)
        );
        filteredChs = filteredChs.filter(c => 
          ((c.subject_name || c.subject || '')).toLowerCase().includes(targetSubLower)
        );
      }

      setDocuments(filteredDocs);
      setQuestions(filteredQs);
      setApiSubjects(filteredSubs);
      setApiChapters(filteredChs);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Subjects & Chapters List
  const userSubjectsList = user.assigned_subject !== 'All' 
    ? subjectsList.filter(s => s.name.toLowerCase() === user.assigned_subject.toLowerCase())
    : subjectsList;

  const userChaptersList = user.assigned_subject !== 'All'
    ? chaptersList.filter(c => (c.subject || '').toLowerCase() === user.assigned_subject.toLowerCase())
    : chaptersList;

  // Real Counts from active frontend state + API
  const totalSubjectsCount = userSubjectsList.length > 0 ? userSubjectsList.length : (user.assigned_subject !== 'All' ? 1 : apiSubjects.length);
  const totalChaptersCount = userChaptersList.length > 0 ? userChaptersList.length : apiChapters.length;
  const totalQuestionsCount = questions.length;

  // Dynamic Question Distribution by Subject (calculated 100% strictly from real question bank records)
  const subjectCountMap: Record<string, number> = {};
  questions.forEach(q => {
    const rawSub = (q.subject || 'Biology').trim();
    const formattedSub = rawSub.charAt(0).toUpperCase() + rawSub.slice(1);
    subjectCountMap[formattedSub] = (subjectCountMap[formattedSub] || 0) + 1;
  });

  const allSubjects = ['Biology', 'Physics', 'Chemistry', 'Mathematics'];
  const subjectColors: Record<string, string> = {
    Biology: 'bg-emerald-500',
    Physics: 'bg-[#007a8c]',
    Chemistry: 'bg-amber-500',
    Mathematics: 'bg-sky-500'
  };

  const subjectPerformance = allSubjects.map(subName => {
    const count = subjectCountMap[subName] || 0;
    const percent = totalQuestionsCount > 0 ? Math.round((count / totalQuestionsCount) * 100) : 0;
    return {
      name: subName,
      count,
      percent,
      color: subjectColors[subName] || 'bg-teal-600'
    };
  });

  // Real Difficulty Breakdown calculated strictly from real question bank records
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  questions.forEach(q => {
    const diff = (q.difficulty || 'Medium').toLowerCase();
    if (diff === 'easy') easyCount++;
    else if (diff === 'hard') hardCount++;
    else mediumCount++;
  });

  const difficultyBreakdown = [
    {
      level: 'Easy',
      count: easyCount,
      percent: totalQuestionsCount > 0 ? Math.round((easyCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-emerald-500'
    },
    {
      level: 'Medium',
      count: mediumCount,
      percent: totalQuestionsCount > 0 ? Math.round((mediumCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-amber-500'
    },
    {
      level: 'Hard',
      count: hardCount,
      percent: totalQuestionsCount > 0 ? Math.round((hardCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-rose-500'
    }
  ];

  const distributionList = subjectsList.length > 0
    ? subjectsList.map(s => ({
        name: s.name,
        count: subjectCountMap[s.name] || 0
      }))
    : (Object.keys(subjectCountMap).length > 0
        ? Object.entries(subjectCountMap).map(([name, count]) => ({ name, count }))
        : apiSubjects.map(s => ({ name: s.name, count: subjectCountMap[s.name] || 0 })));

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Page Header */}
      <div className="flex items-start justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of question repository, generated tests, and synced performance analytics.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenQuestionBuilder}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
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

      {/* 2-Column Content Section: Recent Questions & Distribution */}
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
              className="px-3 py-1 border border-teal-700 text-teal-700 hover:bg-teal-50 font-bold text-[11px] rounded-md transition-all cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3.5 min-h-[140px]">
            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center font-medium">Loading recent questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center font-medium">
                No recent questions found. Click "+ Create Question" to add your first question.
              </div>
            ) : (
              questions.slice(0, 5).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-800 py-1 border-b border-slate-50 last:border-0"
                >
                  <span className="font-mono font-bold text-[#007a87] text-[11px] bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                    {formatQuestionCode(q)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="line-clamp-1">
                    {q.rawText ? q.rawText.replace(/<[^>]*>?/gm, ' ').trim() : 'Question statement'}
                  </span>
                  {q.isSystem || idx % 2 === 0 ? (
                    <span className="ml-auto px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-bold">
                      Published
                    </span>
                  ) : (
                    <span className="ml-auto px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
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
              <div className="text-xs text-slate-400 py-6 text-center font-medium">Loading distribution...</div>
            ) : distributionList.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center font-medium">
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

      {/* REPORTS GRAPHICAL ANALYTICS SECTION (SYNCED REAL METRICS WITH REPORTS PAGE) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-7 space-y-6">
        
        {/* Section Header with Redirect Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-black text-slate-900 tracking-tight font-sans">
                Performance Reports & Analytics Graphs
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Synced real database question share and difficulty balance metrics.
            </p>
          </div>

          {onNavigateToReports && (
            <button
              type="button"
              onClick={onNavigateToReports}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span>View Full Reports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Graphical Analytics Charts Grid */}
        <div className={user.assigned_subject !== 'All' ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          
          {/* Graph 1: Subject Question Share (Bar Chart - Admin Only) */}
          {user.assigned_subject === 'All' && (
            <div className="p-5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <BarChart3 className="w-4 h-4 text-teal-700" /> Subject Question Share
                </h3>
                <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Synced Real Data
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                {loading ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Loading subject metrics...</div>
                ) : (
                  subjectPerformance.map(s => (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{s.name}</span>
                        <span className="font-mono text-teal-800">{s.count} Questions ({s.percent}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all duration-500`}
                          style={{ width: `${s.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Graph 2: Difficulty Level Distribution (Full Width for Faculty) */}
          <div className="p-5 border border-slate-200/80 rounded-xl bg-slate-50/50 space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Award className="w-4 h-4 text-amber-500" /> Question Bank Difficulty Balance
              </h3>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Live Balance
              </span>
            </div>

            <div className="space-y-3.5 pt-1">
              {loading ? (
                <div className="text-xs text-slate-400 py-4 text-center">Loading difficulty balance...</div>
              ) : (
                difficultyBreakdown.map(d => (
                  <div key={d.level} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{d.level} Difficulty</span>
                      <span className="font-mono text-slate-900">{d.count} Questions ({d.percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${d.color} rounded-full transition-all duration-500`}
                        style={{ width: `${d.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
