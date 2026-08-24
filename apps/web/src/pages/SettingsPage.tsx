import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AppSettings } from '@eduforge/shared';
import { Settings, ArrowLeft, Save, Check, Sun, Sparkles, FileText } from 'lucide-react';

interface SettingsPageProps {
  onBackToDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBackToDashboard
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => setSettings(data));
  }, []);

  if (!settings) {
    return <div className="p-8 text-slate-400">Loading settings...</div>;
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateSettings({ ...settings, theme: 'white' });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Application Settings</h1>
            <p className="text-xs text-slate-500">Configure default typography, question formats, auto-saving, and layout defaults</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* ================= UI THEME STATUS ================= */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Sun className="w-4 h-4 text-amber-500" /> UI Workspace Theme
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modern crisp White theme designed for high readability and scientific exam publishing.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Active: White Theme
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Print-Exact White Canvas: </span>
              Documents always render on calibrated pure-white A4 paper sheets matching MS Word standards.
            </div>
          </div>
        </div>

        {/* ================= Typography & Document Defaults ================= */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-sm font-bold border-b border-slate-100 pb-2 text-slate-900">
            Typography & Layout Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700">Default Font Family</label>
              <select
                value={settings.defaultFont}
                onChange={e => setSettings({ ...settings, defaultFont: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-white text-slate-900"
              >
                <option value="Calibri, sans-serif">Calibri (Office Classic)</option>
                <option value="Inter">Inter (Modern Sans-serif)</option>
                <option value="Times New Roman">Times New Roman (Academic Serif)</option>
                <option value="Arial">Arial</option>
                <option value="Computer Modern">Computer Modern (LaTeX style)</option>
                <option value="Roboto">Roboto</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700">Default Font Size (pt)</label>
              <input
                type="number"
                value={settings.defaultFontSize}
                onChange={e => setSettings({ ...settings, defaultFontSize: Number(e.target.value) })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* ================= Question & Option Defaults ================= */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-sm font-bold border-b border-slate-100 pb-2 text-slate-900">
            Question & MCQ Option Style Defaults
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700">Default Option Layout</label>
              <select
                value={settings.defaultOptionStyle}
                onChange={e => setSettings({ ...settings, defaultOptionStyle: e.target.value as any })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-white text-slate-900"
              >
                <option value="grid_2x2">2x2 Grid: (a) (b) / (c) (d)</option>
                <option value="grid_2x2_upper">2x2 Grid: A. B. / C. D.</option>
                <option value="vertical">Vertical Stack</option>
                <option value="horizontal">Horizontal Inline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700">Autosave Interval (ms)</label>
              <input
                type="number"
                value={settings.autosaveIntervalMs}
                onChange={e => setSettings({ ...settings, autosaveIntervalMs: Number(e.target.value) })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
