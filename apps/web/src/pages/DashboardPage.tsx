import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DocumentModel, Template } from '@eduforge/shared';
import {
  FilePlus, PlusCircle, LayoutTemplate, Database, FileText,
  Clock, Trash2, Copy, Edit3, ArrowRight, BookOpen, Atom, Sparkles
} from 'lucide-react';
import { useTheme } from '../state/ThemeContext.js';

interface DashboardPageProps {
  onOpenDocument: (docId: string) => void;
  onNewPaperWizard: () => void;
  onOpenQuestionBuilder: () => void;
  onOpenTemplateGallery: () => void;
  onNavigateToQuestionBank: () => void;
  onNavigateToTemplates: () => void;
  onNavigateToScience: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenDocument,
  onNewPaperWizard,
  onOpenQuestionBuilder,
  onOpenTemplateGallery,
  onNavigateToQuestionBank,
  onNavigateToTemplates,
  onNavigateToScience
}) => {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [templateCount, setTemplateCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docs, questions, templates] = await Promise.all([
        api.getDocuments(),
        api.getQuestions(),
        api.getTemplates()
      ]);
      setDocuments(docs);
      setQuestionCount(questions.length);
      setTemplateCount(templates.length);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.duplicateDocument(docId);
      loadDashboardData();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(docId);
        loadDashboardData();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  // Card theme styling helpers
  const getCardBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#0f1e36] border-[#1d3557] text-white';
    return 'bg-slate-800/90 border-slate-700/80 text-white';
  };

  const getItemCardBg = () => {
    if (theme === 'white') return 'bg-slate-50 hover:bg-sky-50/50 border-slate-200 hover:border-sky-300';
    if (theme === 'dark-blue') return 'bg-[#071426] hover:bg-[#0c2240] border-[#1d3557] hover:border-sky-500';
    return 'bg-slate-900/80 hover:bg-slate-900 border-slate-700/70 hover:border-sky-500/60';
  };

  const getSubtextClass = () => {
    if (theme === 'white') return 'text-slate-500';
    if (theme === 'dark-blue') return 'text-sky-300/70';
    return 'text-slate-400';
  };

  const getTitleClass = () => {
    if (theme === 'white') return 'text-slate-900';
    return 'text-white';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className={`rounded-2xl p-8 text-white shadow-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${
        theme === 'dark-blue'
          ? 'bg-gradient-to-r from-[#071329] via-[#0b2144] to-[#071329] border-[#1d3557]'
          : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-800'
      }`}>
        <div className="flex items-start gap-4">
          <img
            src="/logo.png"
            alt="EduForge Logo"
            className="w-16 h-16 object-contain drop-shadow-xl hidden sm:block shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-bold tracking-wide uppercase">
                Desktop Authoring Suite
              </span>
              <span className="text-xs text-slate-400">by HAEGL Technologies</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Welcome to EduForge
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Professional question paper creator, scientific typesetter, and document editor with full A4 two-column real-time pagination, Math AST, 23 Physics chapters, and offline SQLite repository.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onNewPaperWizard}
            className="flex-1 md:flex-initial px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            <FilePlus className="w-4 h-4" /> + New Question Paper
          </button>
          <button
            type="button"
            onClick={onOpenQuestionBuilder}
            className={`flex-1 md:flex-initial px-4 py-3 font-semibold text-sm rounded-xl border flex items-center justify-center gap-2 transition-colors ${
              theme === 'white'
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-sky-400" /> + New Question
          </button>
          <button
            type="button"
            onClick={onOpenTemplateGallery}
            className={`flex-1 md:flex-initial px-4 py-3 font-semibold text-sm rounded-xl border flex items-center justify-center gap-2 transition-colors ${
              theme === 'white'
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 text-amber-400" /> From Template
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border shadow-xs flex items-center gap-4 transition-colors ${getCardBg()}`}>
          <div className={`p-3 rounded-xl border ${
            theme === 'white'
              ? 'bg-slate-100 text-black border-slate-300'
              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          }`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${getTitleClass()}`}>{documents.length}</div>
            <div className={`text-xs font-semibold ${getSubtextClass()}`}>Question Papers</div>
          </div>
        </div>

        <div
          onClick={onNavigateToQuestionBank}
          className={`p-5 rounded-xl border shadow-xs flex items-center gap-4 cursor-pointer hover:border-indigo-500/50 transition-colors ${getCardBg()}`}
        >
          <div className={`p-3 rounded-xl border ${
            theme === 'white'
              ? 'bg-slate-100 text-black border-slate-300'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${getTitleClass()}`}>{questionCount}</div>
            <div className={`text-xs font-semibold ${getSubtextClass()}`}>Question Bank</div>
          </div>
        </div>

        <div
          onClick={onNavigateToTemplates}
          className={`p-5 rounded-xl border shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-500/50 transition-colors ${getCardBg()}`}
        >
          <div className={`p-3 rounded-xl border ${
            theme === 'white'
              ? 'bg-slate-100 text-black border-slate-300'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${getTitleClass()}`}>{templateCount}</div>
            <div className={`text-xs font-semibold ${getSubtextClass()}`}>Exam Templates</div>
          </div>
        </div>

        <div
          onClick={onNavigateToScience}
          className={`p-5 rounded-xl border shadow-xs flex items-center gap-4 cursor-pointer hover:border-emerald-500/50 transition-colors ${getCardBg()}`}
        >
          <div className={`p-3 rounded-xl border ${
            theme === 'white'
              ? 'bg-slate-100 text-black border-slate-300'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${getTitleClass()}`}>23 Chapters</div>
            <div className={`text-xs font-semibold ${getSubtextClass()}`}>Physics & Chem Lib</div>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-colors ${getCardBg()}`}>
        <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
          <div>
            <h2 className={`text-base font-black ${getTitleClass()}`}>Recent Question Papers & Documents</h2>
            <p className={`text-xs ${getSubtextClass()}`}>Double click or select a document to open in the full editor</p>
          </div>
          <button
            type="button"
            onClick={onNewPaperWizard}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            Create New Paper <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Loading recent documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
            <FileText className="w-10 h-10 text-slate-500" />
            <div>
              <h3 className={`text-sm font-bold ${getTitleClass()}`}>No question papers yet</h3>
              <p className={`text-xs ${getSubtextClass()} max-w-sm mt-0.5`}>
                Get started by creating a new examination paper using the step-by-step wizard.
              </p>
            </div>
            <button
              type="button"
              onClick={onNewPaperWizard}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              + Create First Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc.id)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${getItemCardBg()}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 shadow-2xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold group-hover:text-sky-400 transition-colors line-clamp-1 ${getTitleClass()}`}>
                          {doc.title}
                        </h4>
                        <span className={`text-[10px] ${getSubtextClass()}`}>
                          Template: {doc.templateId || 'A4 Two Column'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/60 rounded text-[11px] font-medium text-slate-300">
                      {doc.metadata?.subject || 'Physics'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800/60 border border-slate-700/60 rounded text-[11px] font-medium text-slate-300">
                      {doc.settings?.columns || 2} Col
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {doc.sections?.length || 1} Sec
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={e => handleDuplicate(doc.id, e)}
                      className="p-1 hover:text-sky-400 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={e => handleDelete(doc.id, e)}
                      className="p-1 hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
