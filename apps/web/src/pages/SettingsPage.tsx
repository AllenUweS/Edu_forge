import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AppSettings } from '@eduforge/shared';
import { Settings, ArrowLeft, Save, Check, Moon, Sun, Palette, Sparkles, FileText } from 'lucide-react';
import { useTheme, AppTheme } from '../state/ThemeContext.js';

interface SettingsPageProps {
  onBackToDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBackToDashboard
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api.getSettings().then(data => setSettings(data));
  }, []);

  if (!settings) {
    return <div className="p-8 text-slate-400">Loading settings...</div>;
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateSettings({ ...settings, theme });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    setSettings(prev => prev ? { ...prev, theme: newTheme } : null);
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

  const getCardBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#0f1e36] border-[#1d3557] text-white';
    return 'bg-slate-800/80 border-slate-700/80 text-white';
  };

  const getInputBg = () => {
    if (theme === 'white') return 'bg-white text-slate-900 border-slate-300';
    if (theme === 'dark-blue') return 'bg-[#071329] text-white border-[#1d3557]';
    return 'bg-slate-900 text-white border-slate-600';
  };

  const themesList: {
    id: AppTheme;
    name: string;
    description: string;
    icon: any;
    accentColor: string;
    bgPreview: string;
    surfacePreview: string;
    headerPreview: string;
  }[] = [
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Sleek dark charcoal & slate interface with high-contrast text',
      icon: Moon,
      accentColor: '#38bdf8',
      bgPreview: 'bg-slate-900',
      surfacePreview: 'bg-slate-800 border-slate-700',
      headerPreview: 'bg-slate-950'
    },
    {
      id: 'white',
      name: 'White Theme',
      description: 'Clean, crisp light appearance with soft gray borders and modern slate text',
      icon: Sun,
      accentColor: '#0284c7',
      bgPreview: 'bg-slate-100',
      surfacePreview: 'bg-white border-slate-200',
      headerPreview: 'bg-slate-800'
    },
    {
      id: 'dark-blue',
      name: 'Dark Blue Theme',
      description: 'Deep midnight navy blue styling with royal blue and cyan accents',
      icon: Palette,
      accentColor: '#38bdf8',
      bgPreview: 'bg-[#070e1e]',
      surfacePreview: 'bg-[#0f1e36] border-[#1d3557]',
      headerPreview: 'bg-[#050a17]'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl font-black ${getTitleColor()}`}>Application Settings</h1>
            <p className={`text-xs ${getSubtitleColor()}`}>Configure UI themes, default typography, question formats, and layout</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* ================= UI THEMES SELECTOR ================= */}
        <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${getCardBg()}`}>
          <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${getTitleColor()}`}>
                <Palette className="w-4 h-4 text-sky-400" /> Application UI Theme
              </h3>
              <p className={`text-xs mt-0.5 ${getSubtitleColor()}`}>
                Choose between 3 distinct interface themes. The A4 paper document canvas always stays white.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
              3 Themes Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {themesList.map(t => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTheme(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-400/50 shadow-lg'
                      : theme === 'white'
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-slate-950 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    {/* Visual Preview Box */}
                    <div className={`w-full h-20 rounded-lg p-2 mb-3 border flex flex-col justify-between shadow-inner ${t.bgPreview} ${t.surfacePreview}`}>
                      {/* Fake header bar */}
                      <div className={`h-3 w-full rounded-xs flex items-center px-1.5 gap-1 ${t.headerPreview}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                      
                      {/* Fake workspace with white paper preview */}
                      <div className="flex justify-center items-center h-10">
                        <div className="w-12 h-9 bg-white rounded-xs shadow-md border border-slate-300 flex flex-col items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-700" />
                          <span className="text-[6px] font-bold text-slate-900">A4 Paper</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className={`text-sm font-bold ${getTitleColor()}`}>{t.name}</span>
                    </div>

                    <p className={`text-[11px] leading-snug ${getSubtitleColor()}`}>
                      {t.description}
                    </p>
                  </div>

                  <div className={`mt-3 pt-2 border-t text-[10px] flex items-center gap-1 font-mono ${theme === 'white' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-500'}`}>
                    <Sparkles className="w-3 h-3 text-amber-400" /> Paper canvas: PURE WHITE
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= Typography & Document Defaults ================= */}
        <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${getCardBg()}`}>
          <h3 className={`text-sm font-bold border-b border-slate-700/40 pb-2 ${getTitleColor()}`}>
            Typography & Layout Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1 ${getSubtitleColor()}`}>Default Font Family</label>
              <select
                value={settings.defaultFont}
                onChange={e => setSettings({ ...settings, defaultFont: e.target.value })}
                className={`w-full text-xs p-2 border rounded-lg focus:outline-hidden focus:border-sky-500 ${getInputBg()}`}
              >
                <option value="Calibri, sans-serif">Calibri (Office Classic)</option>
                <option value="Inter">Inter (Sans-serif)</option>
                <option value="Times New Roman">Times New Roman (Academic Serif)</option>
                <option value="Arial">Arial</option>
                <option value="Computer Modern">Computer Modern (LaTeX style)</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${getSubtitleColor()}`}>Default Font Size (pt)</label>
              <input
                type="number"
                value={settings.defaultFontSize}
                onChange={e => setSettings({ ...settings, defaultFontSize: Number(e.target.value) })}
                className={`w-full text-xs p-2 border rounded-lg focus:outline-hidden focus:border-sky-500 ${getInputBg()}`}
              />
            </div>
          </div>
        </div>

        {/* ================= Question & Option Defaults ================= */}
        <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${getCardBg()}`}>
          <h3 className={`text-sm font-bold border-b border-slate-700/40 pb-2 ${getTitleColor()}`}>
            Question & MCQ Option Style Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold mb-1 ${getSubtitleColor()}`}>Default Option Layout</label>
              <select
                value={settings.defaultOptionStyle}
                onChange={e => setSettings({ ...settings, defaultOptionStyle: e.target.value as any })}
                className={`w-full text-xs p-2 border rounded-lg focus:outline-hidden focus:border-sky-500 ${getInputBg()}`}
              >
                <option value="grid_2x2">2x2 Grid: (a) (b) / (c) (d)</option>
                <option value="grid_2x2_upper">2x2 Grid: A. B. / C. D.</option>
                <option value="vertical">Vertical Stack</option>
                <option value="horizontal">Horizontal Inline</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${getSubtitleColor()}`}>Autosave Interval (ms)</label>
              <input
                type="number"
                value={settings.autosaveIntervalMs}
                onChange={e => setSettings({ ...settings, autosaveIntervalMs: Number(e.target.value) })}
                className={`w-full text-xs p-2 border rounded-lg focus:outline-hidden focus:border-sky-500 ${getInputBg()}`}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
