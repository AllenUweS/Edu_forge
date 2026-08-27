import React, { useState } from 'react';
import { Plus, X, Edit3, Trash2 } from 'lucide-react';
import { DocumentModel } from '@eduforge/shared';

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

export const TestsPage: React.FC<TestsPageProps> = () => {
  const [tests, setTests] = useState<TestItem[]>([]);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testName, setTestName] = useState('');
  const [questionsCount, setQuestionsCount] = useState('50');
  const [duration, setDuration] = useState('60 min');
  const [status, setStatus] = useState('Draft');

  const handleOpenAdd = () => {
    setEditingId(null);
    setTestName('');
    setQuestionsCount('50');
    setDuration('60 min');
    setStatus('Draft');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TestItem) => {
    setEditingId(t.id);
    setTestName(t.name);
    setQuestionsCount(String(t.questions));
    setDuration(t.duration);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  const handleDeleteTest = (id: string) => {
    if (confirm('Are you sure you want to delete this test?')) {
      setTests(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSubmitTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    if (editingId) {
      setTests(prev =>
        prev.map(t =>
          t.id === editingId
            ? {
                ...t,
                name: testName.trim(),
                questions: Number(questionsCount) || 50,
                duration: duration || '60 min',
                status
              }
            : t
        )
      );
    } else {
      setTests(prev => [
        ...prev,
        {
          id: String(Date.now()),
          name: testName.trim(),
          questions: Number(questionsCount) || 50,
          duration: duration || '60 min',
          status,
          attempts: 0
        }
      ]);
    }

    setTestName('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tests</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate and manage tests.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Create Test
        </button>
      </div>

      {/* Wireframe Panel Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Test</th>
              <th className="px-5 py-3">Questions</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Attempts</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {tests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No tests created yet. Click "+ Create Test" to generate your first test.
                </td>
              </tr>
            ) : (
              tests.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-bold text-slate-900">{t.name}</td>
                <td className="px-5 py-3.5">{t.questions}</td>
                <td className="px-5 py-3.5 text-slate-600">{t.duration}</td>
                <td className="px-5 py-3.5">
                  {t.status === 'Published' ? (
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-semibold">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{t.attempts}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Test"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTest(t.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>{editingId ? 'Edit Test' : 'Create Test'}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="Biology Chapter Test"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Questions</label>
                  <input
                    type="number"
                    value={questionsCount}
                    onChange={e => setQuestionsCount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md shadow-2xs cursor-pointer"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
