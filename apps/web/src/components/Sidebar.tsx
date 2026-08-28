import React from 'react';
import {
  LayoutDashboard, Database, BookOpen, Layers,
  FileText, ClipboardCheck, BarChart3, Image, Settings, LogOut
} from 'lucide-react';

import { getUserProfile } from '../utils/userProfile.js';

export type PageView =
  | 'dashboard'
  | 'question_bank'
  | 'subjects'
  | 'chapters'
  | 'create'
  | 'generate_test'
  | 'tests'
  | 'test_attempts'
  | 'reports'
  | 'media_library'
  | 'settings'
  | 'editor'
  | 'templates'
  | 'science';

interface SidebarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  onLogout?: () => void;
}

interface NavItem {
  id: PageView;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
  const user = getUserProfile();

  const group1: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'question_bank', label: 'Question Bank', icon: Database },
    ...(user.role === 'admin' ? [{ id: 'subjects' as PageView, label: 'Subjects', icon: BookOpen }] : []),
    { id: 'chapters', label: 'Chapters', icon: Layers }
  ];

  const group2: NavItem[] = [
    { id: 'generate_test', label: 'Generate Test', icon: FileText },
    { id: 'tests', label: 'Tests', icon: ClipboardCheck },
    { id: 'test_attempts', label: 'Test Attempts', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const group3: NavItem[] = [
    { id: 'media_library', label: 'Media Library', icon: Image },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderNavGroup = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer active:scale-[0.98] ${
                isActive
                  ? 'bg-[#e6f4f6] text-[#005d66] font-extrabold shadow-2xs border border-teal-100/60'
                  : 'text-slate-600 hover:text-teal-900 hover:bg-teal-50/50 font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#007a8c]' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0 select-none shadow-xs z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="EduForge Logo"
            className="w-6 h-6 object-contain"
          />
          <h1 className="font-black text-sm tracking-tight text-[#005d66] uppercase font-sans">
            EduForge
          </h1>
        </div>
        <span className="text-[11px] text-teal-700 font-extrabold pl-8">
          {user.assigned_subject === 'All' ? 'Admin Portal' : user.assigned_subject === 'None' ? 'Unassigned Guest Mode' : `${user.assigned_subject} Faculty Portal`}
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        <div>
          {renderNavGroup(group1)}
        </div>

        <hr className="border-t border-slate-100 my-2.5" />

        <div>
          {renderNavGroup(group2)}
        </div>

        <hr className="border-t border-slate-100 my-2.5" />

        <div>
          {renderNavGroup(group3)}
        </div>
      </div>

      {/* Sidebar Footer Logout */}
      {onLogout && (
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};
