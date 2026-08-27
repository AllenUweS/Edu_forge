import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question } from '@eduforge/shared';
import { Search, Plus, Trash2, Edit3, Eye, Check } from 'lucide-react';
import { StudentPreviewDrawer } from '../components/StudentPreviewDrawer.js';
import { formatQuestionCode } from '../utils/questionCode.js';

interface QuestionBankPageProps {
  onBackToDashboard?: () => void;
  onOpenCreateQuestion?: (q?: Question) => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({
  onOpenCreateQuestion
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fast Preview Drawer State
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [difficultyFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter;

      const data = await api.getQuestions(params);
      setQuestions(data || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant Fast Delete (Optimistic UI removal for zero latency)
  const handleFastDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (confirm('Delete this question from your question bank?')) {
      // Optimistic UI update: Remove immediately from screen
      setQuestions(prev => prev.filter(q => q.id !== id));

      try {
        await api.deleteQuestion(id);
      } catch (err) {
        console.error('Failed to delete question on server:', err);
        // Reload if delete failed
        loadQuestions();
      }
    }
  };

  // Fast Preview Handler
  const handleFastPreview = (q: Question, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewQuestion(q);
    setIsPreviewOpen(true);
  };

  // Helper to strip HTML tags and image URLs to display clean question text
  const getCleanQuestionText = (htmlText?: string) => {
    if (!htmlText) return 'Question statement text';
    const clean = htmlText
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean || 'Question statement text';
  };

  const filteredList = questions.filter(q => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const code = formatQuestionCode(q).toLowerCase();
      const statement = getCleanQuestionText(q.rawText).toLowerCase();
      if (!code.includes(s) && !statement.includes(s)) return false;
    }
    if (statusFilter === 'Draft' && q.isSystem) return false;
    if (statusFilter === 'Published' && !q.isSystem) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Question Bank
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage, preview, and organize your question repository ({filteredList.length} questions).
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreateQuestion && onOpenCreateQuestion()}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Create Question
        </button>
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Instant search by question code, topic, or statement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-40 py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900 font-semibold cursor-pointer"
          >
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900 font-semibold cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
        </div>

        {/* Questions Table with Fast Action Buttons */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Question & Code</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5">Marks</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Instant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-semibold">
                    Loading questions from bank...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-semibold">
                    No questions match your filter. Click "+ Create Question" to add a new question.
                  </td>
                </tr>
              ) : (
                filteredList.map((q, idx) => (
                  <tr
                    key={q.id || idx}
                    onClick={() => handleFastPreview(q as Question)}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Question Statement & Dynamic Code */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <b className="text-[#007a87] font-mono text-[11px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-black shrink-0">
                          {formatQuestionCode(q)}
                        </b>
                        <span className="text-slate-400 text-[11px]">· {q.subject || 'Biology'}</span>
                      </div>
                      <span className="text-slate-900 font-semibold line-clamp-1 mt-1 block">
                        {getCleanQuestionText(q.rawText)}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          (q.difficulty || '').toLowerCase() === 'easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (q.difficulty || '').toLowerCase() === 'hard'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {q.difficulty || 'Medium'}
                      </span>
                    </td>

                    {/* Marks */}
                    <td className="px-5 py-3.5 font-extrabold text-slate-900">
                      +{q.marks || 4} / -{q.negativeMarks || 1}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {q.isSystem || idx % 2 === 0 ? (
                        <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-extrabold">
                          Published
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Instant Fast Preview Button */}
                        <button
                          type="button"
                          onClick={e => handleFastPreview(q as Question, e)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Instant Preview Question"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenCreateQuestion && onOpenCreateQuestion(q as Question);
                          }}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Instant Fast Delete Button */}
                        <button
                          type="button"
                          onClick={e => q.id && handleFastDelete(q.id, e)}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Instant Fast Delete"
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
      </div>

      {/* Student Preview Drawer */}
      <StudentPreviewDrawer
        isOpen={isPreviewOpen}
        question={previewQuestion}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
