import React, { useState } from 'react';
import { Plus, X, Search, Edit3, Trash2 } from 'lucide-react';
import { SubjectItem } from './SubjectsPage.js';

export interface ChapterItem {
  num?: string;
  id: string;
  title: string;
  subject: string;
  count: number;
}

interface ChaptersPageProps {
  subjectsList?: SubjectItem[];
  chaptersList?: ChapterItem[];
  onAddChapter?: (newCh: ChapterItem) => void;
  onEditChapter?: (originalId: string, updatedCh: ChapterItem) => void;
  onDeleteChapter?: (id: string) => void;
  onNavigateToQuestionBank?: () => void;
}

function isFacultySession(): boolean {
  try {
    const raw = localStorage.getItem('eduforge_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.role === 'FACULTY' || parsed.user === 'faculty';
    }
  } catch {}
  return false;
}

export const ChaptersPage: React.FC<ChaptersPageProps> = ({
  subjectsList,
  chaptersList,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onNavigateToQuestionBank
}) => {
  const defaultSubjects = [
    { name: 'Biology', code: 'BIO' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHE' },
    { name: 'Mathematics', code: 'MAT' }
  ];

  const availableSubjects = subjectsList !== undefined ? subjectsList : (isFacultySession() ? [] : defaultSubjects);

  const [localChapters, setLocalChapters] = useState<ChapterItem[]>(() => {
    if (isFacultySession()) return [];
    return [
      { num: '01', id: 'BIO-01', title: 'The Living World', subject: 'Biology', count: 42 },
      { num: '02', id: 'BIO-02', title: 'Biological Classification', subject: 'Biology', count: 56 },
      { num: '04', id: 'BIO-04', title: 'Cell Structure and Function', subject: 'Biology', count: 120 }
    ];
  });

  const chapters = chaptersList || localChapters;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0]?.name || 'Biology');

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setSelectedSubject(availableSubjects[0]?.name || 'Biology');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ch: ChapterItem) => {
    setEditingId(ch.id);
    setTitle(ch.title);
    setSelectedSubject(ch.subject);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete chapter ${id}?`)) {
      if (onDeleteChapter) {
        onDeleteChapter(id);
      } else {
        setLocalChapters(localChapters.filter(c => c.id !== id));
      }
    }
  };

  const handleSubmitChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      const updatedCh: ChapterItem = {
        id: editingId,
        title: title.trim(),
        subject: selectedSubject,
        count: 0
      };
      if (onEditChapter) {
        onEditChapter(editingId, updatedCh);
      } else {
        setLocalChapters(localChapters.map(c => (c.id === editingId ? updatedCh : c)));
      }
    } else {
      const subObj = availableSubjects.find(s => s.name === selectedSubject) || availableSubjects[0];
      const codeStr = `${subObj.code}-${String(chapters.length + 1).padStart(2, '0')}`;
      const newCh: ChapterItem = {
        num: String(chapters.length + 1).padStart(2, '0'),
        id: codeStr,
        title: title.trim(),
        subject: selectedSubject,
        count: 0
      };
      if (onAddChapter) {
        onAddChapter(newCh);
      } else {
        setLocalChapters([...localChapters, newCh]);
      }
    }

    setTitle('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Biology · Chapters</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Subject → Chapter → Questions</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Add Chapter
        </button>
      </div>

      {/* Wireframe Panel Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Chapter</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Questions</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {chapters.map((ch, idx) => (
              <tr key={ch.id || idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-mono text-slate-500">{ch.num || String(idx + 1).padStart(2, '0')}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{ch.title}</td>
                <td className="px-5 py-3.5 font-mono text-slate-600">{ch.id}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900">{ch.count}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToQuestionBank && onNavigateToQuestionBank()}
                      className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ch)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Edit Chapter"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ch.id)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Delete Chapter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chapter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>{editingId ? 'Edit Chapter' : 'Add Chapter'}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChapter} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                >
                  {availableSubjects.map(sub => (
                    <option key={sub.name} value={sub.name}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  placeholder="Cell Structure and Function"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
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
