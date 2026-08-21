import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question } from '@eduforge/shared';
import { OptionLayoutRenderer } from './OptionLayoutRenderer.js';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { Database, Search, X, Plus, Filter, Tag, Check, BookOpen } from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestion: (question: Question) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onInsertQuestion
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen, subjectFilter, difficultyFilter]);

  const loadQuestions = () => {
    setLoading(true);
    const filters: Record<string, any> = {};
    if (subjectFilter !== 'all') filters.subject = subjectFilter;
    if (difficultyFilter !== 'all') filters.difficulty = difficultyFilter;
    if (search) filters.search = search;

    api.getQuestions(filters)
      .then(data => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadQuestions();
    }
  };

  const handleInsert = (q: Question) => {
    onInsertQuestion(q);
    setInsertedIds(prev => new Set(prev).add(q.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Question Bank & Repository</h3>
              <p className="text-xs text-slate-500">Filter, search, and insert verified objective questions into your paper</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search keyword, formula, or tag (Press Enter)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            >
              <option value="all">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div>
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6 overflow-y-auto min-h-[350px] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading questions from Question Bank...</div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <span>No questions found matching the selected filters.</span>
            </div>
          ) : (
            questions.map(q => {
              const isInserted = insertedIds.has(q.id);
              return (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                        {q.subject || 'General'}
                      </span>
                      {q.chapter && (
                        <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {q.chapter}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                        q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-slate-500 font-mono">
                        +{q.marks} / -{q.negativeMarks || 0}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInsert(q)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95 ${
                        isInserted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isInserted ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added to Paper
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Insert Question
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-sm font-medium text-slate-900 mb-2">
                    {q.rawText}
                  </div>

                  <OptionLayoutRenderer
                    options={q.options}
                    layoutType={q.optionLayout || 'grid_2x2'}
                    showAnswers={true}
                  />

                  {q.tags && q.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                      <Tag className="w-3 h-3" />
                      <span>{q.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>{questions.length} questions available in bank</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-md transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
