import React from 'react';
import {
  FileText, Database, LayoutTemplate, Atom, Settings, Layers, Plus, Compass
} from 'lucide-react';
import { useTheme } from '../state/ThemeContext.js';

export type PageView =
  | 'dashboard'
  | 'editor'
  | 'question_bank'
  | 'templates'
  | 'science'
  | 'settings';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  onNewPaper?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  onNewPaper
}) => {
  const { theme } = useTheme();

  const navLinks: { id: PageView; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'question_bank', label: 'Question Bank', icon: Database },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'science', label: 'Science Library', icon: Atom },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getHeaderBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-slate-900 shadow-xs';
    if (theme === 'dark-blue') return 'bg-[#060e1d] border-[#1d3557] text-white shadow-md';
    return 'bg-[#0f172a] border-slate-800 text-white shadow-md';
  };

  const getLogoText = () => {
    if (theme === 'white') return 'text-slate-900';
    return 'text-white';
  };

  return (
    <header className={`h-14 border-b px-6 flex items-center justify-between transition-colors sticky top-0 z-40 ${getHeaderBg()}`}>
      
      {/* Brand / Logo */}
      <div className="flex items-center gap-8">
        <div
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <img
            src="/logo.png"
            alt="EduForge Logo"
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className={`font-black text-base tracking-tight leading-none group-hover:text-sky-400 transition-colors ${getLogoText()}`}>
              EduForge
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Scientific Exam Publishing
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;

            let activeClass = '';
            if (isActive) {
              if (theme === 'white') {
                activeClass = 'bg-sky-50 text-sky-700 font-bold border border-sky-200';
              } else if (theme === 'dark-blue') {
                activeClass = 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30';
              } else {
                activeClass = 'bg-slate-800 text-sky-400 font-bold border border-slate-700';
              }
            } else {
              if (theme === 'white') {
                activeClass = 'text-slate-600 hover:text-slate-950 hover:bg-slate-100';
              } else {
                activeClass = 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
              }
            }

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setCurrentPage(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${activeClass}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Quick Actions: New Paper */}
      <div className="flex items-center gap-3">
        {onNewPaper && (
          <button
            type="button"
            onClick={onNewPaper}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Paper
          </button>
        )}
      </div>

    </header>
  );
};
