import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Copy } from 'lucide-react';
import { DocumentModel } from '@eduforge/shared';
import { api } from '../services/api.js';

export interface TestItem {
  id: string;
  name: string;
  questions: number;
  duration: string;
  status: string;
  attempts: number;
}

interface TestsPageProps {
  documents?: DocumentModel[];
  onOpenDocument?: (id: string) => void;
  onNewPaperWizard?: () => void;
  onDeleteDocument?: (id: string) => void;
  onDuplicateDocument?: (id: string) => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({
  documents: propDocs,
  onOpenDocument,
  onNewPaperWizard,
  onDeleteDocument,
  onDuplicateDocument
}) => {
  const [docs, setDocs] = useState<DocumentModel[]>(propDocs || []);

  const fetchLatestDocs = async () => {
    try {
      const latest = await api.getDocuments();
      setDocs(latest || []);
    } catch {
      if (propDocs) setDocs(propDocs);
    }
  };

  useEffect(() => {
    fetchLatestDocs();
  }, [propDocs]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this test paper?')) {
      if (onDeleteDocument) {
        onDeleteDocument(id);
      } else {
        await api.deleteDocument(id);
      }
      fetchLatestDocs();
    }
  };

  const handleDuplicate = async (id: string) => {
    if (onDuplicateDocument) {
      onDuplicateDocument(id);
    } else {
      await api.duplicateDocument(id);
    }
    fetchLatestDocs();
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tests</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate, publish, and manage all your test papers.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onNewPaperWizard) onNewPaperWizard();
          }}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Create / Generate Test
        </button>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Test Paper Title</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Questions</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No tests created yet. Click "+ Create / Generate Test" to generate your first test paper.
                </td>
              </tr>
            ) : (
              docs.map(d => {
                const totalQ = d.sections?.reduce((acc, s) => acc + (s.blocks?.length || 0), 0) || (d.metadata as any)?.totalQuestions || 25;
                const durationText = `${d.metadata?.timeAllowedMinutes || (d.metadata as any)?.durationMinutes || 60} min`;
                const subjectText = d.metadata?.subject || 'Physics & Chemistry';

                return (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => onOpenDocument && onOpenDocument(d.id)}
                        className="hover:text-teal-700 text-left transition-colors font-bold cursor-pointer"
                      >
                        {d.title}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-semibold">{subjectText}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{totalQ}</td>
                    <td className="px-5 py-3.5 text-slate-600">{durationText}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
                        Published
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDocument && onOpenDocument(d.id)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 transition-colors cursor-pointer rounded hover:bg-slate-100"
                          title="Open in Editor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(d.id)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer rounded hover:bg-slate-100"
                          title="Duplicate Test"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded hover:bg-slate-100"
                          title="Delete Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

