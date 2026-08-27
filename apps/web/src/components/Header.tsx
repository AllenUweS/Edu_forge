import React, { useState } from 'react';
import { ChevronDown, User, LogOut, Shield } from 'lucide-react';
import { PageView } from './Sidebar.js';

interface HeaderProps {
  currentPage: PageView;
}

const pageTitles: Record<PageView, string> = {
  dashboard: 'Dashboard',
  question_bank: 'Question Bank',
  subjects: 'Subjects',
  chapters: 'Chapters',
  create: 'Create Question',
  generate_test: 'Generate Test Paper',
  tests: 'Tests',
  test_attempts: 'Test Attempts',
  reports: 'Reports',
  media_library: 'Media Library',
  settings: 'Settings',
  editor: 'Question Paper Editor',
  templates: 'Templates',
  science: 'Science Library'
};

export const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Current Page Title / Breadcrumb */}
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-extrabold text-[#005d66]">
          {pageTitles[currentPage] || 'Dashboard'}
        </h2>
      </div>

      {/* User Account Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
        >
          <span className="font-bold text-slate-900">Gautam</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {isUserMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">Gautam</p>
              <p className="text-[10px] text-slate-500">gautam@eduforge.in</p>
            </div>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-medium"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <User className="w-3.5 h-3.5 text-teal-600" /> Profile
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-medium"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" /> Role: Administrator
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
