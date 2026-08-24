import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DocumentModel } from '@eduforge/shared';
import {
  FilePlus, PlusCircle, LayoutTemplate, Database, FileText,
  Clock, Trash2, Copy, ArrowRight, Atom
} from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="rounded-2xl p-8 text-white shadow-lg border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
              <span className="text-xs text-slate-300">by HAEGL Technologies</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Welcome to EduForge
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Professional question paper creator, scientific typesetter, and document editor with full A4 two-column real-time pagination, Math AST, Physics & Chemistry chapters, and offline Question Repository.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onNewPaperWizard}
            className="flex-1 md:flex-initial px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" /> + New Question Paper
          </button>
          <button
            type="button"
            onClick={onOpenQuestionBuilder}
            className="flex-1 md:flex-initial px-4 py-3 font-semibold text-sm rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-sky-400" /> + New Question
          </button>
          <button
            type="button"
            onClick={onOpenTemplateGallery}
            className="flex-1 md:flex-initial px-4 py-3 font-semibold text-sm rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LayoutTemplate className="w-4 h-4 text-amber-400" /> From Template
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{documents.length}</div>
            <div className="text-xs font-semibold text-slate-500">Question Papers</div>
          </div>
        </div>

        <div
          onClick={onNavigateToQuestionBank}
          className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-4 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{questionCount}</div>
            <div className="text-xs font-semibold text-slate-500">Question Bank</div>
          </div>
        </div>

        <div
          onClick={onNavigateToTemplates}
          className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{templateCount}</div>
            <div className="text-xs font-semibold text-slate-500">Exam Templates</div>
          </div>
        </div>

        <div
          onClick={onNavigateToScience}
          className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-4 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">23 Chapters</div>
            <div className="text-xs font-semibold text-slate-500">Physics & Chem Lib</div>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Recent Question Papers & Documents</h2>
            <p className="text-xs text-slate-500">Double click or select a document to open in the full editor</p>
          </div>
          <button
            type="button"
            onClick={onNewPaperWizard}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            Create New Paper <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Loading recent documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <FileText className="w-10 h-10 text-slate-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">No question papers yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                Get started by creating a new examination paper using the step-by-step wizard.
              </p>
            </div>
            <button
              type="button"
              onClick={onNewPaperWizard}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
                className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-100 border border-sky-200 rounded-lg text-sky-700 shadow-2xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {doc.title}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Template: {doc.templateId || 'A4 Two Column'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                      {doc.metadata?.subject || 'Physics'}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                      {doc.settings?.columns || 2} Col
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {doc.sections?.length || 1} Sec
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={e => handleDuplicate(doc.id, e)}
                      className="p-1 hover:text-sky-600 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={e => handleDelete(doc.id, e)}
                      className="p-1 hover:text-red-600 rounded"
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
