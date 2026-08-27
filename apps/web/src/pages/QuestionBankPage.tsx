import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question } from '@eduforge/shared';
import { Search, Plus, Trash2, Edit3, Eye, Download, Upload } from 'lucide-react';
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

  // Preview Drawer
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
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this question from question bank?')) {
      try {
        await api.deleteQuestion(id);
        loadQuestions();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenPreview = (q: Question) => {
    setPreviewQuestion(q);
    setIsPreviewOpen(true);
  };

  const displayList = questions;

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Biology / Cell Structure and Function · {displayList.length} questions
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search question, code or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadQuestions()}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-40 py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-medium"
          >
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-medium"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3">Marks</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No questions in Question Bank yet. Click "+ Create Question" to add your first question.
                  </td>
                </tr>
              ) : (
                displayList.map((q, idx) => (
                <tr key={q.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <b className="text-slate-900 block font-mono text-[11px]">
                      {formatQuestionCode(q)}
                    </b>
                    <span className="text-slate-600 line-clamp-1 mt-0.5">
                      {q.rawText || 'Question statement text'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{q.difficulty || 'Medium'}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {q.marks || 4} / -{q.negativeMarks || 1}
                  </td>
                  <td className="px-5 py-3.5">
                    {q.isSystem || idx % 2 === 0 ? (
                      <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-bold">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(q as Question)}
                        className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCreateQuestion && onOpenCreateQuestion(q as Question)}
                        className="px-3 py-1 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => q.id && handleDelete(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Question"
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
