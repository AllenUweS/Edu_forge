import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Atom, FlaskConical, Gauge, Bookmark, ArrowLeft, Search, Plus, Sparkles, BookOpen
} from 'lucide-react';
import {
  PhysicsChapter, ChemistryElement, ChemistryNotation, Unit, ScientificConstant
} from '@eduforge/shared';
import { api } from '../services/api.js';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { useTheme } from '../state/ThemeContext.js';

interface ScienceLibraryPageProps {
  onBackToDashboard: () => void;
}

// Memoized Chapter Card for max 120fps scrolling
const PhysicsChapterCard = memo(({ ch, theme, getSubCardBg, getInnerBoxBg, getTitleColor, getSubtitleColor }: any) => (
  <div className={`p-4 rounded-xl border transition-all ${getSubCardBg()}`} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
    <h3 className={`text-sm font-bold mb-2 border-b border-slate-700/40 pb-1 flex justify-between ${getTitleColor()}`}>
      <span>{ch.name}</span>
      <span className={`text-xs font-normal ${theme === 'white' ? 'text-black font-semibold' : 'text-sky-400'}`}>
        {ch.symbols.length} symbols
      </span>
    </h3>
    <div className="space-y-2">
      {ch.symbols.map((s: any) => (
        <div key={s.id} className={`text-xs flex items-start justify-between p-2 rounded border ${getInnerBoxBg()}`}>
          <div>
            <strong className={`font-serif text-sm mr-2 ${theme === 'white' ? 'text-black font-black' : 'text-sky-400'}`}>{s.symbol}</strong>
            <span className="font-semibold">{s.name}</span>
            {s.description && <p className={`text-[11px] mt-0.5 ${getSubtitleColor()}`}>{s.description}</p>}
          </div>
          {s.standardUnit && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
              theme === 'white'
                ? 'bg-slate-100 text-black border-slate-300'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
            }`}>
              {s.standardUnit}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
));

export const ScienceLibraryPage: React.FC<ScienceLibraryPageProps> = ({
  onBackToDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'chemistry' | 'units' | 'constants'>('physics');
  const [physicsChapters, setPhysicsChapters] = useState<PhysicsChapter[]>([]);
  const [elements, setElements] = useState<ChemistryElement[]>([]);
  const [notations, setNotations] = useState<ChemistryNotation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [constants, setConstants] = useState<ScientificConstant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getPhysicsChapters(),
      api.getChemistryElements(),
      api.getChemistryNotations(),
      api.getUnits(),
      api.getConstants()
    ]).then(([p, e, n, u, c]) => {
      if (!isMounted) return;
      setPhysicsChapters(p);
      setElements(e);
      setNotations(n);
      setUnits(u);
      setConstants(c);
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const getTitleColor = () => {
    if (theme === 'white') return 'text-slate-900';
    return 'text-white';
  };

  const getSubtitleColor = () => {
    if (theme === 'white') return 'text-slate-600 font-medium';
    if (theme === 'dark-blue') return 'text-sky-300/70';
    return 'text-slate-400';
  };

  const getMainCardBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200';
    if (theme === 'dark-blue') return 'bg-[#0f1e36] border-[#1d3557]';
    return 'bg-slate-850 border-slate-700/80';
  };

  const getSubCardBg = () => {
    if (theme === 'white') return 'bg-slate-50 border-slate-200 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#071329] border-[#1d3557] text-slate-100';
    return 'bg-slate-900/80 border-slate-700/60 text-slate-100';
  };

  const getInnerBoxBg = () => {
    if (theme === 'white') return 'bg-white border-slate-200 text-black';
    if (theme === 'dark-blue') return 'bg-[#0a1b38] border-[#1d3557]/80 text-slate-200';
    return 'bg-slate-800 border-slate-700 text-slate-200';
  };

  // Ultra-fast instant memoized search filters
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return physicsChapters;
    const q = searchQuery.toLowerCase();
    return physicsChapters.filter(ch => 
      ch.name.toLowerCase().includes(q) ||
      ch.symbols.some(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)))
    );
  }, [physicsChapters, searchQuery]);

  const filteredElements = useMemo(() => {
    if (!searchQuery.trim()) return elements;
    const q = searchQuery.toLowerCase();
    return elements.filter(el =>
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase().includes(q) ||
      String(el.atomicNumber).includes(q)
    );
  }, [elements, searchQuery]);

  const filteredNotations = useMemo(() => {
    if (!searchQuery.trim()) return notations;
    const q = searchQuery.toLowerCase();
    return notations.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.formula.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }, [notations, searchQuery]);

  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const q = searchQuery.toLowerCase();
    return units.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.symbol.toLowerCase().includes(q) ||
      u.category.toLowerCase().includes(q)
    );
  }, [units, searchQuery]);

  const filteredConstants = useMemo(() => {
    if (!searchQuery.trim()) return constants;
    const q = searchQuery.toLowerCase();
    return constants.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [constants, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'white'
                ? 'hover:bg-slate-100 text-black'
                : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`p-2.5 rounded-xl border ${
            theme === 'white'
              ? 'bg-slate-100 text-black border-slate-300'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-xl font-black ${getTitleColor()}`}>Scientific Reference Libraries</h1>
            <p className={`text-xs ${getSubtitleColor()}`}>Instant local databases for Physics, Chemistry, Units, and Constants (120Hz Fast Refresh)</p>
          </div>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter symbols, formulas, units..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs ${
              theme === 'white'
                ? 'bg-white text-black border-slate-300 placeholder:text-slate-400'
                : 'bg-slate-900 text-white border-slate-700 placeholder:text-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700/40 overflow-x-auto">
        <button
          onClick={() => setActiveTab('physics')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'physics'
              ? theme === 'white' ? 'border-sky-600 text-black' : 'border-sky-500 text-sky-400'
              : theme === 'white'
              ? 'border-transparent text-slate-600 hover:text-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Atom className={`w-4 h-4 ${theme === 'white' ? 'text-black' : 'text-sky-400'}`} /> Physics ({filteredChapters.length} Chapters)
        </button>
        <button
          onClick={() => setActiveTab('chemistry')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'chemistry'
              ? theme === 'white' ? 'border-emerald-600 text-black' : 'border-emerald-500 text-emerald-400'
              : theme === 'white'
              ? 'border-transparent text-slate-600 hover:text-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FlaskConical className={`w-4 h-4 ${theme === 'white' ? 'text-black' : 'text-emerald-400'}`} /> Chemistry ({filteredElements.length} Elements)
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'units'
              ? theme === 'white' ? 'border-amber-600 text-black' : 'border-amber-500 text-amber-400'
              : theme === 'white'
              ? 'border-transparent text-slate-600 hover:text-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className={`w-4 h-4 ${theme === 'white' ? 'text-black' : 'text-amber-400'}`} /> Units & Prefixes ({filteredUnits.length})
        </button>
        <button
          onClick={() => setActiveTab('constants')}
          className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'constants'
              ? theme === 'white' ? 'border-purple-600 text-black' : 'border-purple-500 text-purple-400'
              : theme === 'white'
              ? 'border-transparent text-slate-600 hover:text-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${theme === 'white' ? 'text-black' : 'text-purple-400'}`} /> Scientific Constants ({filteredConstants.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className={`p-6 rounded-2xl border shadow-xs min-h-[400px] ${getMainCardBg()}`}>
        {loading && physicsChapters.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Loading science libraries...
          </div>
        ) : (
          <>
            {activeTab === 'physics' && (
              <div className="space-y-6">
                <div className={`text-xs font-semibold uppercase tracking-wider flex justify-between items-center ${getSubtitleColor()}`}>
                  <span>23 Physics Chapters Catalog</span>
                  <span>Showing {filteredChapters.length} chapters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChapters.map((ch: PhysicsChapter) => (
                    <PhysicsChapterCard
                      key={ch.id}
                      ch={ch}
                      theme={theme}
                      getSubCardBg={getSubCardBg}
                      getInnerBoxBg={getInnerBoxBg}
                      getTitleColor={getTitleColor}
                      getSubtitleColor={getSubtitleColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chemistry' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${getSubtitleColor()}`}>
                    Periodic Table Elements ({filteredElements.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filteredElements.map((el: ChemistryElement) => (
                      <div
                        key={el.symbol}
                        className={`p-2 border rounded-lg text-center ${getSubCardBg()}`}
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
                      >
                        <span className={`text-xs font-mono block ${theme === 'white' ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>{el.atomicNumber}</span>
                        <span className={`text-lg font-bold font-serif ${theme === 'white' ? 'text-black font-black' : 'text-emerald-400'}`}>{el.symbol}</span>
                        <span className={`text-[11px] font-bold block truncate ${getTitleColor()}`}>{el.name}</span>
                        <span className={`text-[9px] font-mono ${theme === 'white' ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>{el.atomicMass}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${getSubtitleColor()}`}>
                    Chemical Notations, Structures & Reaction Arrows ({filteredNotations.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredNotations.map((n: ChemistryNotation) => (
                      <div
                        key={n.id}
                        className={`p-3 border rounded-xl space-y-1 ${getSubCardBg()}`}
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 90px' }}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold uppercase ${theme === 'white' ? 'text-black' : 'text-slate-400'}`}>{n.type}</span>
                          <span className={`font-mono text-xs font-bold ${theme === 'white' ? 'text-black' : 'text-sky-400'}`}>{n.formula}</span>
                        </div>
                        <div className={`py-1 text-center rounded border ${theme === 'white' ? 'bg-white border-slate-300 text-black' : 'bg-slate-900 border-slate-700'}`}>
                          <KaTeXRenderer math={n.latex} />
                        </div>
                        <h4 className={`text-xs font-bold ${getTitleColor()}`}>{n.name}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'units' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredUnits.map((u: Unit) => (
                    <div
                      key={u.id}
                      className={`p-3 border rounded-xl flex justify-between items-start ${getSubCardBg()}`}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
                    >
                      <div>
                        <span className={`text-lg font-bold font-mono ${theme === 'white' ? 'text-black font-black' : 'text-amber-400'}`}>{u.symbol}</span>
                        <h4 className={`text-xs font-bold mt-0.5 ${getTitleColor()}`}>{u.name}</h4>
                        {u.siEquivalent && <p className={`text-[11px] font-mono ${getSubtitleColor()}`}>SI: {u.siEquivalent}</p>}
                      </div>
                      <span className={`text-[10px] border px-2 py-0.5 rounded ${theme === 'white' ? 'bg-white border-slate-300 text-black font-semibold' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {u.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'constants' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredConstants.map((c: ScientificConstant) => (
                    <div
                      key={c.id}
                      className={`p-4 border rounded-xl space-y-2 ${getSubCardBg()}`}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold font-serif ${theme === 'white' ? 'text-black font-black' : 'text-purple-400'}`}>{c.symbol}</span>
                        <span className={`text-[10px] px-2 py-0.5 border rounded ${theme === 'white' ? 'bg-white border-slate-300 text-black font-semibold' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                          {c.category}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold ${getTitleColor()}`}>{c.name}</h4>
                      <div className={`p-2 rounded border font-mono text-xs font-bold flex justify-between ${theme === 'white' ? 'bg-white border-slate-300 text-black' : 'bg-slate-900 border-slate-700 text-purple-300'}`}>
                        <span>{c.value}</span>
                        <span className={theme === 'white' ? 'text-black' : 'text-slate-400'}>{c.unit}</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${getSubtitleColor()}`}>{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
