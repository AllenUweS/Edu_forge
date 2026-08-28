import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Copy, Edit3, X, Save, Printer, FileText } from 'lucide-react';
import { DocumentModel } from '@eduforge/shared';
import { api } from '../services/api.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';

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
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentModel | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDuration, setEditDuration] = useState('60');

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentModel | null>(null);

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

  const toggleSelectDoc = (id: string) => {
    const sId = String(id);
    setSelectedDocIds(prev =>
      prev.includes(sId) ? prev.filter(x => x !== sId) : [...prev, sId]
    );
  };

  const toggleSelectAllDocs = () => {
    if (selectedDocIds.length === docs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(docs.map(d => String(d.id)));
    }
  };

  const handleBulkDeleteDocs = async () => {
    if (selectedDocIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedDocIds.length} selected test paper(s)? Once deleted, your tests section will be updated.`)) {
      const idsToDelete = [...selectedDocIds];
      setDocs(prev => prev.filter(d => !idsToDelete.includes(String(d.id))));
      setSelectedDocIds([]);

      for (const id of idsToDelete) {
        try {
          if (onDeleteDocument) await onDeleteDocument(id);
          await api.deleteDocument(id);
        } catch (err) {
          console.error('Failed deleting doc:', err);
        }
      }
      fetchLatestDocs();
    }
  };

  const handleDeleteAllDocs = async () => {
    if (docs.length === 0) return;
    if (confirm(`Are you sure you want to delete ALL ${docs.length} test paper(s)? Once deleted, your tests section will be completely empty.`)) {
      const allIds = docs.map(d => String(d.id));
      setDocs([]);
      setSelectedDocIds([]);

      for (const id of allIds) {
        try {
          if (onDeleteDocument) await onDeleteDocument(id);
          await api.deleteDocument(id);
        } catch (err) {
          console.error('Failed deleting doc:', err);
        }
      }
      fetchLatestDocs();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this test paper?')) {
      // Optimistic delete
      setDocs(prev => prev.filter(d => String(d.id) !== String(id)));
      setSelectedDocIds(prev => prev.filter(x => x !== String(id)));
      try {
        if (onDeleteDocument) {
          await onDeleteDocument(id);
        }
        await api.deleteDocument(id);
      } catch (err) {
        console.error('Failed to delete document:', err);
      } finally {
        fetchLatestDocs();
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      if (onDuplicateDocument) {
        await onDuplicateDocument(id);
      } else {
        await api.duplicateDocument(id);
      }
    } catch (err) {
      console.error('Failed to duplicate document:', err);
    } finally {
      fetchLatestDocs();
    }
  };

  const handleOpenEditModal = (d: DocumentModel) => {
    setEditingDoc(d);
    setEditTitle(d.title || '');
    setEditSubject(d.metadata?.subject || '');
    setEditDuration(String(d.metadata?.timeAllowedMinutes || 60));
    setIsEditModalOpen(true);
  };

  const handleOpenPreviewModal = (d: DocumentModel) => {
    setPreviewDoc(d);
    setIsPreviewModalOpen(true);
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

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
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate, publish, preview, edit, and manage all your test papers.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteDocs}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedDocIds.length})
            </button>
          )}

          {docs.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllDocs}
              className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All Tests
            </button>
          )}

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
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={docs.length > 0 && selectedDocIds.length === docs.length}
                  onChange={toggleSelectAllDocs}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                />
              </th>
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
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Trash2 className="w-8 h-8 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tests section is completely empty.</p>
                    <p className="text-xs text-slate-400">No tests created yet. Click "+ Create / Generate Test" to generate your first test paper.</p>
                  </div>
                </td>
              </tr>
            ) : (
              docs.map(d => {
                const totalQ = d.sections?.reduce((acc, s) => acc + (s.blocks?.length || 0), 0) || (d.metadata as any)?.totalQuestions || 25;
                const durationText = `${d.metadata?.timeAllowedMinutes || (d.metadata as any)?.durationMinutes || 60} min`;
                const subjectText = d.metadata?.subject || 'Physics & Chemistry';
                const isSelected = selectedDocIds.includes(String(d.id));

                return (
                  <tr key={d.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}>
                    <td className="px-3 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDoc(d.id)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewModal(d)}
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
                          onClick={() => handleOpenPreviewModal(d)}
                          className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Preview Test Paper"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
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

      {/* Test Preview Modal */}
      {isPreviewModalOpen && previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-wide">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Subject: {previewDoc.metadata?.subject || 'General Science'} • Duration: {previewDoc.metadata?.timeAllowedMinutes || 60} mins • Max Marks: {previewDoc.metadata?.maxMarks || 100}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Paper Body Preview */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50 font-sans text-xs text-slate-800">
              {/* Paper Title Banner */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center space-y-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{previewDoc.title}</h1>
                <div className="flex items-center justify-center gap-6 text-xs text-slate-600 font-bold border-t border-b border-slate-100 py-2">
                  <span>SUBJECT: {previewDoc.metadata?.subject || 'PHYSICS & CHEMISTRY'}</span>
                  <span>TIME: {previewDoc.metadata?.timeAllowedMinutes || 60} MINUTES</span>
                  <span>MAX MARKS: {previewDoc.metadata?.maxMarks || 100}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium italic text-left pt-1">
                  <b>General Instructions:</b> All questions are compulsory. Read questions carefully before answering. Each question carries marks indicated alongside.
                </div>
              </div>

              {/* Sections & Questions */}
              {previewDoc.sections && previewDoc.sections.length > 0 ? (
                previewDoc.sections.map((sec, sIdx) => (
                  <div key={sec.id || sIdx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <h2 className="font-bold text-sm text-slate-900">{sec.title || `SECTION ${String.fromCharCode(65 + sIdx)}`}</h2>
                      {sec.instructions && <p className="text-slate-500 text-[11px] font-medium">{sec.instructions}</p>}
                    </div>

                    <div className="space-y-4">
                      {sec.blocks && sec.blocks.length > 0 ? (
                        sec.blocks.map((blk: any, bIdx) => {
                          const qObj = blk.question || blk.data?.question;
                          const qText = qObj?.rawText || blk.data?.text || blk.text || 'Question Statement';
                          const qOptions = qObj?.options || blk.data?.options;

                          return (
                            <div key={blk.id || bIdx} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-semibold text-slate-900 text-xs flex items-start gap-2">
                                  <span className="font-bold font-mono shrink-0">Q{bIdx + 1}.</span>
                                  <MathTextRenderer text={qText} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">[{qObj?.marks || 1} Mark]</span>
                              </div>

                              {/* Options */}
                              {qOptions && qOptions.length > 0 && (
                                <div className="pt-1">
                                  <OptionLayoutRenderer
                                    options={qOptions}
                                    layoutType={qObj?.optionLayout || 'grid_2x2'}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 italic text-center py-2">No question blocks added to this section yet.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
                  <p className="text-slate-600 font-bold">Standard Question Paper Format</p>
                  <p className="text-slate-400 text-xs">This test paper contains 25 structured multiple-choice and descriptive questions generated according to your syllabus specifications.</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
