import React, { useState } from 'react';
import { Download, BarChart3, TrendingUp, Award } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState('This Month');

  // Dynamic user data states (starting clean with 0 until user logs attempts)
  const subjectPerformance: { name: string; score: number; color: string; attempts: number }[] = [
    { name: 'Biology', score: 0, color: 'bg-emerald-500', attempts: 0 },
    { name: 'Physics', score: 0, color: 'bg-indigo-500', attempts: 0 },
    { name: 'Chemistry', score: 0, color: 'bg-amber-500', attempts: 0 },
    { name: 'Mathematics', score: 0, color: 'bg-sky-500', attempts: 0 }
  ];

  const monthlyTrend: { month: string; accuracy: number; attempts: number }[] = [
    { month: 'Jan', accuracy: 0, attempts: 0 },
    { month: 'Feb', accuracy: 0, attempts: 0 },
    { month: 'Mar', accuracy: 0, attempts: 0 },
    { month: 'Apr', accuracy: 0, attempts: 0 },
    { month: 'May', accuracy: 0, attempts: 0 },
    { month: 'Jun', accuracy: 0, attempts: 0 },
    { month: 'Jul', accuracy: 0, attempts: 0 },
    { month: 'Aug', accuracy: 0, attempts: 0 }
  ];

  const difficultyBreakdown: { level: string; count: number; percent: number; color: string }[] = [
    { level: 'Easy', count: 0, percent: 0, color: 'bg-emerald-500' },
    { level: 'Medium', count: 0, percent: 0, color: 'bg-amber-500' },
    { level: 'Hard', count: 0, percent: 0, color: 'bg-rose-500' }
  ];

  const handleExportPdfReport = () => {
    // Generate a printable HTML document report for PDF export
    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EduForge — Analytical Performance & Performance Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 12px; color: #64748b; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .card-title { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .card-value { font-size: 28px; font-weight: bold; margin-top: 4px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">EduForge Performance & Analytics Report</div>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString()} · ${selectedRange}</div>
            </div>
            <div style="font-weight: bold; font-size: 14px;">EduForge MCQ Platform</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Average Score</div>
              <div class="card-value">0%</div>
            </div>
            <div class="card">
              <div class="card-title">Accuracy Rate</div>
              <div class="card-value">0%</div>
            </div>
            <div class="card">
              <div class="card-title">Total Attempted</div>
              <div class="card-value">0</div>
            </div>
            <div class="card">
              <div class="card-title">Published Tests</div>
              <div class="card-value">0</div>
            </div>
          </div>

          <h3>Subject-wise Performance Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Avg Accuracy</th>
                <th>Total Attempts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${subjectPerformance
                .map(
                  s => `
                <tr>
                  <td><b>${s.name}</b></td>
                  <td>${s.score}%</td>
                  <td>${s.attempts.toLocaleString()}</td>
                  <td>Pending Data</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <h3>Difficulty Level Distribution</h3>
          <table>
            <thead>
              <tr>
                <th>Difficulty</th>
                <th>Questions Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${difficultyBreakdown
                .map(
                  d => `
                <tr>
                  <td><b>${d.level}</b></td>
                  <td>${d.count.toLocaleString()}</td>
                  <td>${d.percent}%</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            Confidential · Exported from EduForge Exam & MCQ Generator Platform
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, '_blank');
    if (!printWin) {
      alert('Please allow popups to download and print the PDF report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Graphical insights, test performance, and accuracy trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRange}
            onChange={e => setSelectedRange(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 shadow-2xs cursor-pointer"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="All Time">All Time</option>
          </select>

          <button
            type="button"
            onClick={handleExportPdfReport}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* 4 Core Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Score</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              0%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Accuracy Rate</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              0%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Attempted</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              0 Logs
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0</div>
          <p className="text-[11px] text-slate-400 font-medium">Log test attempts to view trends</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Published Tests</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              0 Tests
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0</div>
          <p className="text-[11px] text-slate-400 font-medium">In Question Bank & Tests</p>
        </div>
      </div>

      {/* GRAPHICAL REPRESENTATION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Subject Performance Comparison (Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Subject Performance Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Average student accuracy score per subject</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              No Data Yet
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {subjectPerformance.map(s => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{s.name}</span>
                  <span>{s.score}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-500`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-medium">
                  <span>{s.attempts} attempts logged</span>
                  <span>Target: 70%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Monthly Accuracy & Engagement Trend (SVG Line & Area Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Accuracy Trend
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Growth trajectory over time</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Awaiting Attempts
            </span>
          </div>

          {/* Graphical SVG Line Graph */}
          <div className="pt-4 space-y-3">
            <div className="h-44 w-full relative flex items-end justify-between pt-6 px-2 border-b border-slate-200">
              {/* Data points */}
              {monthlyTrend.map((t) => (
                <div key={t.month} className="flex flex-col items-center gap-1 z-10">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {t.accuracy}%
                  </span>
                  <div className="w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full shadow-xs" />
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">{t.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DIFFICULTY BREAKDOWN & HEALTH ROW */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Question Bank Difficulty Balance
          </h3>
          <span className="text-xs text-slate-500 font-medium">Add questions to view difficulty distribution</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {difficultyBreakdown.map(d => (
            <div key={d.level} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>{d.level} Questions</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                  {d.percent}%
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{d.count}</div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
