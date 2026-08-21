import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question } from '@eduforge/shared';
import {
  Database, Plus, Search, Filter, Trash2, Edit3, Copy, ArrowLeft,
  Download, Upload, Tag, CheckCircle2, XCircle
} from 'lucide-react';
import { QuestionBuilderModal } from '../questions/QuestionBuilderModal.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';
import { useTheme } from '../state/ThemeContext.js';

interface QuestionBankPageProps {
  onBackToDashboard: () => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({
  onBackToDashboard
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { theme } = useTheme();

  // Builder Modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);

  useEffect(() => {
    loadQuestions();
  }, [subjectFilter, difficultyFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (subjectFilter !== 'all') params.subject = subjectFilter;
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

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateQuestion(id);
      loadQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduforge_question_bank_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          for (const q of parsed) {
            await api.createQuestion(q);
          }
          alert(`Successfully imported ${parsed.length} questions!`);
          loadQuestions();
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    input.click();
  };

  const getCardBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#0f1e36] border-[#1d3557] text-slate-100';
    return 'bg-slate-800/90 border-slate-700/80 text-slate-100';
  };

  const getFilterBarBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200';
    if (theme === 'dark-blue') return 'bg-[#0b172a] border-[#1d3557]';
    return 'bg-slate-850 border-slate-700/80';
  };

  const getTitleColor = () => {
    if (theme === 'white') return 'text-slate-900';
    return 'text-white';
  };

  const getSubtitleColor = () => {
    if (theme === 'white') return 'text-slate-500';
    if (theme === 'dark-blue') return 'text-sky-300/70';
    return 'text-slate-400';
  };

  const getInputBg = () => {
    if (theme === 'white') return 'bg-white text-slate-900 border-slate-300';
    if (theme === 'dark-blue') return 'bg-[#071329] text-white border-[#1d3557]';
    return 'bg-slate-900 text-white border-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl font-black ${getTitleColor()}`}>Question Bank Repository</h1>
            <p className={`text-xs ${getSubtitleColor()}`}>Manage, categorize, import, and export scientific objective questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
              theme === 'white' ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800' : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            type="button"
            onClick={handleImport}
            className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
              theme === 'white' ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800' : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingQuestion(undefined);
              setIsBuilderOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Create Question
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl border shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 ${getFilterBarBg()}`}>
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search questions by formula, keywords, chapter (Press Enter)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadQuestions()}
            className={`w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${getInputBg()}`}
          />
        </div>

        <div>
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className={`w-full py-2 px-3 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${getInputBg()}`}
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
            className={`w-full py-2 px-3 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${getInputBg()}`}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Loading question bank...
          </div>
        ) : questions.length === 0 ? (
          <div className={`py-12 rounded-xl border text-center text-sm ${
            theme === 'white' ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/40 border-slate-700/60 text-slate-400'
          }`}>
            No questions found. Click <strong>+ Create Question</strong> to add one.
          </div>
        ) : (
          questions.map(q => (
            <div
              key={q.id}
              className={`p-5 rounded-xl border shadow-xs hover:border-indigo-400/80 transition-all space-y-3 ${getCardBg()}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`font-bold px-2 py-0.5 rounded border ${
                    theme === 'white'
                      ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {q.subject || 'General'}
                  </span>
                  {q.chapter && (
                    <span className={`px-2 py-0.5 rounded font-medium border ${
                      theme === 'white'
                        ? 'bg-slate-100 text-black border-slate-300'
                        : 'bg-slate-800/80 text-slate-200 border-slate-700/60'
                    }`}>
                      {q.chapter}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                    q.difficulty === 'Easy'
                      ? theme === 'white' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : q.difficulty === 'Medium'
                      ? theme === 'white' ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : theme === 'white' ? 'bg-red-50 text-red-900 border-red-300' : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className={`font-mono font-bold text-xs ${theme === 'white' ? 'text-black' : 'text-slate-300'}`}>
                    +{q.marks} / -{q.negativeMarks || 0}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsBuilderOpen(true);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      theme === 'white' ? 'hover:bg-slate-100 text-slate-600 hover:text-black' : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(q.id)}
                    className={`p-1.5 rounded transition-colors ${
                      theme === 'white' ? 'hover:bg-slate-100 text-slate-600 hover:text-black' : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
                    }`}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Statement Text */}
              <div className={`text-sm font-semibold leading-relaxed ${theme === 'white' ? 'text-black' : 'text-white'}`}>
                {q.rawText}
              </div>

              {/* Multiple Choice Options */}
              <OptionLayoutRenderer
                options={q.options}
                layoutType={q.optionLayout || 'grid_2x2'}
                showAnswers={true}
                textColorClass={theme === 'white' ? 'text-black' : 'text-white'}
              />

              {q.explanationText && (
                <div className={`p-2.5 rounded-lg text-xs border ${
                  theme === 'white' ? 'bg-slate-50 text-black border-slate-300' : 'bg-slate-900/60 text-slate-200 border-slate-700/60'
                }`}>
                  <strong className={theme === 'white' ? 'text-black font-bold' : 'text-white font-bold'}>Explanation: </strong>
                  {q.explanationText}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <QuestionBuilderModal
        isOpen={isBuilderOpen}
        initialQuestion={editingQuestion}
        onClose={() => setIsBuilderOpen(false)}
        onSave={async q => {
          if (editingQuestion?.id) {
            await api.updateQuestion(q.id, q);
          } else {
            await api.createQuestion(q);
          }
          loadQuestions();
        }}
      />

    </div>
  );
};
