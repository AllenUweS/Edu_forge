import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Copy, Edit3, X, Save } from 'lucide-react';
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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentModel | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDuration, setEditDuration] = useState('60');

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
      // Optimistic delete
      setDocs(prev => prev.filter(d => String(d.id) !== String(id)));
      try {
        if (onDeleteDocument) {
          await onDeleteDocument(id);
        }
        await api.deleteDocument(id);
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        fetchLatestDocs();
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      if (onDuplicateDocument) {
        onDuplicateDocument(id);
      } else {
        await api.duplicateDocument(id);
      }
    } catch (err) {
      console.error('Duplicate error:', err);
    } finally {
      fetchLatestDocs();
    }
  };

  const handleOpenEditModal = (d: DocumentModel) => {
    setEditingDoc(d);
    setEditTitle(d.title || '');
    setEditSubject(d.metadata?.subject || 'Physics & Chemistry');
    setEditDuration(String(d.metadata?.timeAllowedMinutes || (d.metadata as any)?.durationMinutes || 60));
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editTitle.trim()) return;

    const updated: DocumentModel = {
      ...editingDoc,
      title: editTitle.trim(),
      metadata: {
        ...editingDoc.metadata,
        subject: editSubject.trim(),
        timeAllowedMinutes: Number(editDuration) || 60
      }
    };

    // Optimistic UI update
    setDocs(prev => prev.map(item => String(item.id) === String(editingDoc.id) ? updated : item));
    setIsEditModalOpen(false);

    try {
      await api.updateDocument(editingDoc.id, updated);
    } catch (err) {
      console.error('Failed to update test paper:', err);
    } finally {
      fetchLatestDocs();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tests</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate, publish, edit, and manage all your test papers.</p>
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
                          onClick={() => handleOpenEditModal(d)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Test Paper Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDocument && onOpenDocument(d.id)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Open in Document Editor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(d.id)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Duplicate Test Paper"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Test Paper"
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

      {/* Edit Test Paper Modal */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>Edit Test Paper</span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Paper Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={editDuration}
                  onChange={e => setEditDuration(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    if (onOpenDocument) onOpenDocument(editingDoc.id);
                  }}
                  className="px-3.5 py-2 text-teal-700 hover:bg-teal-50 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Open in Document Editor
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

