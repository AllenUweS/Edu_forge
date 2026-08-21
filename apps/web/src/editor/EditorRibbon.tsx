import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Home, PlusCircle, Sigma, Hash, Atom, FlaskConical, HelpCircle, Layout, Eye,
  Save, Download, Printer, Undo, Redo, Bold, Italic, Underline, Strikethrough,
  Superscript, Subscript, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Search, Image as ImageIcon, Table as TableIcon, Shapes, Sparkles, Columns,
  ZoomIn, ZoomOut, Check, ArrowLeft, Grid, List, ListOrdered, Indent, Outdent,
  Database, HelpCircle as HelpIcon, FileSpreadsheet, PaintBucket, Highlighter,
  Scissors, Copy, Clipboard, Eraser, ArrowDownAZ, ChevronDown, Type,
  BookOpen, CheckSquare, Layers, Wand2, RefreshCw, SlidersHorizontal, Maximize2,
  Moon, Sun, Palette as PaletteIcon
} from 'lucide-react';
import {
  DocumentModel, Alignment, OptionLayoutType, WordArtStyle, ShapeType,
  TextFormatting, ParagraphBlock
} from '@eduforge/shared';
import { FontDropdown } from './FontDropdown.js';
import { ColorPickerPopover } from './ColorPickerPopover.js';
import { StyleGallery } from './StyleGallery.js';
import { DocumentStylePreset } from './styles.js';
import { useTheme } from '../state/ThemeContext.js';

export type RibbonTab =
  | 'File'
  | 'Home'
  | 'Insert'
  | 'Page Layout'
  | 'References'
  | 'Review'
  | 'View'
  | 'Tools'
  | 'Equation'
  | 'Symbols'
  | 'Physics'
  | 'Chemistry'
  | 'Question';

export interface FormattingState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  underlineStyle?: 'single' | 'double' | 'dotted' | 'dashed' | 'wavy';
  underlineColor?: string;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  alignment?: Alignment;
  lineSpacing?: number;
  listType?: 'none' | 'bullet' | 'number' | 'alpha' | 'roman' | 'multilevel';
  listBulletStyle?: string;
  indent?: number;
  characterBorder?: boolean;
  textEffect?: 'none' | 'glow' | 'shadow' | 'outline' | 'reflection';
  border?: 'none' | 'box' | 'bottom' | 'top' | 'left' | 'all';
  styleName?: string;
}

interface EditorRibbonProps {
  document: DocumentModel;
  activeTab: RibbonTab;
  setActiveTab: (tab: RibbonTab) => void;
  currentFormatting?: FormattingState;
  onApplyFormat: (format: Partial<FormattingState>) => void;
  isFormatPainterActive?: boolean;
  onToggleFormatPainter?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onPrintPreview?: () => void;
  onNavigateHome?: () => void;
  // Insert actions
  onOpenQuestionBuilder?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenEquationModal?: () => void;
  onOpenSymbolsModal?: () => void;
  onOpenPhysicsModal?: () => void;
  onOpenChemistryModal?: () => void;
  onOpenUnitsModal?: () => void;
  onOpenConstantsModal?: () => void;
  onOpenFindReplace?: () => void;
  onInsertParagraph?: () => void;
  onInsertHeading?: (level: 1 | 2 | 3) => void;
  onInsertTable?: (rows: number, cols: number) => void;
  onInsertImage?: () => void;
  onInsertShape?: (shape: ShapeType) => void;
  onInsertWordArt?: (text: string, style: WordArtStyle) => void;
  onInsertPageBreak?: () => void;
  onInsertHorizontalLine?: () => void;
  // Layout & View actions
  onSetColumns?: (cols: 1 | 2) => void;
  onSetMargins?: (margins: { top: number; bottom: number; left: number; right: number }) => void;
  onToggleColumnDivider?: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showMarginGuides: boolean;
  setShowMarginGuides: (show: boolean) => void;
  showColumnGuides: boolean;
  setShowColumnGuides: (show: boolean) => void;
  showFormattingMarks: boolean;
  setShowFormattingMarks: (show: boolean) => void;
  printPreviewMode: boolean;
  setPrintPreviewMode: (val: boolean) => void;
  onChangeOptionLayout?: (layout: OptionLayoutType) => void;
  onPasteText?: (mode?: 'formatted' | 'plain') => void;
  onCutText?: () => void;
  onCopyText?: () => void;
  onSelectAll?: () => void;
}

export const EditorRibbon: React.FC<EditorRibbonProps> = ({
  document: doc,
  activeTab,
  setActiveTab,
  currentFormatting = {},
  onApplyFormat,
  isFormatPainterActive = false,
  onToggleFormatPainter,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onExportDocx,
  onExportPdf,
  onPrintPreview,
  onNavigateHome,
  onOpenQuestionBuilder,
  onOpenQuestionBank,
  onOpenEquationModal,
  onOpenSymbolsModal,
  onOpenPhysicsModal,
  onOpenChemistryModal,
  onOpenUnitsModal,
  onOpenConstantsModal,
  onOpenFindReplace,
  onInsertParagraph,
  onInsertHeading,
  onInsertTable,
  onInsertImage,
  onInsertShape,
  onInsertWordArt,
  onInsertPageBreak,
  onInsertHorizontalLine,
  onSetColumns,
  onSetMargins,
  onToggleColumnDivider,
  zoom,
  setZoom,
  showMarginGuides,
  setShowMarginGuides,
  showColumnGuides,
  setShowColumnGuides,
  showFormattingMarks,
  setShowFormattingMarks,
  printPreviewMode,
  setPrintPreviewMode,
  onChangeOptionLayout,
  onPasteText,
  onCutText,
  onCopyText,
  onSelectAll
}) => {
  // Dropdowns local state
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const [isUnderlineMenuOpen, setIsUnderlineMenuOpen] = useState(false);
  const [isBulletsMenuOpen, setIsBulletsMenuOpen] = useState(false);
  const [isNumberingMenuOpen, setIsNumberingMenuOpen] = useState(false);
  const [isLineSpacingMenuOpen, setIsLineSpacingMenuOpen] = useState(false);
  const [isBordersMenuOpen, setIsBordersMenuOpen] = useState(false);
  const [isPasteMenuOpen, setIsPasteMenuOpen] = useState(false);
  const [isTextEffectsMenuOpen, setIsTextEffectsMenuOpen] = useState(false);

  const { theme, setTheme } = useTheme();

  const activeFontFamily = currentFormatting.fontFamily || doc.settings.defaultFont || 'Calibri (Body)';
  const activeFontSize = currentFormatting.fontSize || doc.settings.defaultFontSize || 10.5;

  const tabs: { id: RibbonTab; label: string; icon?: any }[] = [
    { id: 'Home', label: 'Home' },
    { id: 'Insert', label: 'Insert' },
    { id: 'Page Layout', label: 'Page Layout' },
    { id: 'References', label: 'References' },
    { id: 'Review', label: 'Review' },
    { id: 'View', label: 'View' },
    { id: 'Tools', label: 'Tools' },
    { id: 'Equation', label: 'Math Equation' },
    { id: 'Physics', label: 'Physics' },
    { id: 'Chemistry', label: 'Chemistry' }
  ];

  // Font size options
  const fontSizePresets = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  // Grow / Shrink Font
  const handleGrowFont = () => {
    const nextSize = fontSizePresets.find(sz => sz > activeFontSize) || activeFontSize + 2;
    onApplyFormat({ fontSize: nextSize });
  };

  const handleShrinkFont = () => {
    const prevSizes = fontSizePresets.filter(sz => sz < activeFontSize);
    const prevSize = prevSizes.length > 0 ? prevSizes[prevSizes.length - 1] : Math.max(6, activeFontSize - 1);
    onApplyFormat({ fontSize: prevSize });
  };

  // Change Case Handler
  const handleChangeCase = (mode: 'sentence' | 'lower' | 'upper' | 'capitalize' | 'toggle') => {
    setIsCaseMenuOpen(false);
    // Custom case transform trigger
    onApplyFormat({ textEffect: mode as any });
  };

  const getRibbonBgClass = () => {
    if (theme === 'white') return 'bg-[#ffffff] text-slate-800 border-slate-300';
    if (theme === 'dark-blue') return 'bg-[#0d1f3c] text-slate-100 border-[#1e3a8a]/60';
    return 'bg-[#242830] text-slate-200 border-slate-700/60';
  };

  const getTopBarBgClass = () => {
    if (theme === 'white') return 'bg-[#f1f5f9] border-slate-300 text-slate-800';
    if (theme === 'dark-blue') return 'bg-[#060e1d] border-[#1d3557] text-slate-100';
    return 'bg-[#181a1f] border-slate-800 text-slate-200';
  };

  return (
    <div className={`border-b shadow-md select-none no-print sticky top-0 z-40 transition-colors ${
      theme === 'white' ? 'bg-white border-slate-300' : theme === 'dark-blue' ? 'bg-[#0a1528] border-[#1d3557]' : 'bg-[#1f2227] border-slate-700/80'
    }`}>
      
      {/* ================= 1. Top Bar: File & Quick Access & Tabs ================= */}
      <div className={`flex items-center justify-between px-3 py-1 border-b text-xs transition-colors ${getTopBarBgClass()}`}>
        
        {/* Left: File button + Quick Access Icons + Tabs */}
        <div className="flex items-center gap-1">
          {/* File Menu Trigger */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'File' ? 'Home' : 'File')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all ${
              activeTab === 'File'
                ? 'bg-sky-600 text-white'
                : theme === 'white'
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white'
            }`}
          >
            <span className="text-sm leading-none">≡</span>
            <span>File</span>
          </button>

          <div className="h-4 w-px bg-slate-700/50 mx-1" />

          {/* Quick Access Toolbar Icons */}
          <button
            type="button"
            onClick={onSave}
            className="p-1 hover:bg-slate-700/50 text-slate-400 hover:text-sky-400 rounded transition-colors"
            title="Save Document (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleFormatPainter}
            className={`p-1 rounded transition-colors ${
              isFormatPainterActive
                ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300 font-bold'
                : 'hover:bg-slate-700/50 text-slate-400 hover:text-amber-400'
            }`}
            title="Format Painter (Click to copy & apply text style)"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="p-1 hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 rounded transition-colors"
            title="Quick Print / PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrintPreview}
            className="p-1 hover:bg-slate-700/50 text-slate-400 hover:text-purple-400 rounded transition-colors"
            title="Print Preview / Zoom"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 hover:bg-slate-700/50 disabled:opacity-30 text-slate-400 hover:text-sky-400 rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 hover:bg-slate-700/50 disabled:opacity-30 text-slate-400 hover:text-sky-400 rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700/50 mx-1" />

          {/* Ribbon Tabs matching MS Word screenshot */}
          <div className="flex items-center gap-0.5 ml-2">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-t transition-all relative ${
                    isActive
                      ? theme === 'white'
                        ? 'text-sky-700 font-bold bg-white shadow-2xs'
                        : theme === 'dark-blue'
                        ? 'text-sky-300 font-bold bg-[#0d1f3c]'
                        : 'text-sky-400 font-bold bg-[#242830]'
                      : theme === 'white'
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Document Title & Dashboard */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EduForge" className="w-4 h-4 object-contain" />
          <span className="text-xs font-semibold truncate max-w-[200px] opacity-90">
            {doc.title}
          </span>
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors ml-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      {/* ================= 2. Ribbon Content Toolbar ================= */}
      <div className={`px-3 py-2 min-h-[76px] flex items-center gap-2 overflow-x-auto border-b transition-colors ${getRibbonBgClass()}`}>
        
        {/* ================= HOME TAB (MS WORD STYLE) ================= */}
        {activeTab === 'Home' && (
          <div className="flex items-center gap-3 w-full">
            
            {/* 1. CLIPBOARD GROUP */}
            <div className="flex items-center gap-1.5 border-r border-slate-700/80 pr-2.5 shrink-0">
              {/* Format Painter button (Large) */}
              <button
                type="button"
                onClick={onToggleFormatPainter}
                className={`flex flex-col items-center justify-center p-1.5 rounded transition-all min-w-[50px] ${
                  isFormatPainterActive
                    ? 'bg-amber-400 text-slate-900 font-bold ring-2 ring-amber-300 shadow-md'
                    : 'hover:bg-slate-700/70 text-slate-300 hover:text-white'
                }`}
                title="Format Painter (Copy formatting from one place and apply to another)"
              >
                <Wand2 className={`w-5 h-5 mb-0.5 ${isFormatPainterActive ? 'text-slate-900' : 'text-amber-400'}`} />
                <span className="text-[9.5px] leading-tight text-center">Format<br/>Painter</span>
              </button>

              {/* Paste button (Large + Dropdown) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onPasteText && onPasteText('formatted')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/70 rounded transition-colors min-w-[44px] text-slate-300 hover:text-white"
                  title="Paste (Ctrl+V)"
                >
                  <Clipboard className="w-5 h-5 mb-0.5 text-sky-400" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9.5px]">Paste</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Stacked Cut / Copy */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={onCutText}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={onCopyText}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* 2. FONT GROUP (80+ FONTS & FORMATTING) */}
            <div className="flex flex-col gap-1 border-r border-slate-700/80 pr-3 shrink-0">
              
              {/* Row 1: Font Selector, Font Size, Grow/Shrink, Case, Clear Formatting */}
              <div className="flex items-center gap-1">
                {/* 80+ Fonts Selector */}
                <FontDropdown
                  currentFont={activeFontFamily}
                  onSelectFont={(family, name) => {
                    onApplyFormat({ fontFamily: family });
                  }}
                />

                {/* Font Size Selector */}
                <select
                  value={activeFontSize}
                  onChange={e => onApplyFormat({ fontSize: Number(e.target.value) })}
                  className="text-xs h-7 px-1.5 bg-[#181a1f] border border-slate-600 rounded text-slate-200 font-medium w-16 focus:outline-hidden focus:border-sky-500"
                  title="Font Size (pt)"
                >
                  {fontSizePresets.map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>

                {/* Grow Font A+ */}
                <button
                  type="button"
                  onClick={handleGrowFont}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white font-bold flex items-center"
                  title="Increase Font Size (Ctrl+>)"
                >
                  <span className="text-xs font-black">A</span>
                  <span className="text-[8px] font-bold text-sky-400 ml-0.5">▲</span>
                </button>

                {/* Shrink Font A- */}
                <button
                  type="button"
                  onClick={handleShrinkFont}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white font-bold flex items-center"
                  title="Decrease Font Size (Ctrl+<)"
                >
                  <span className="text-xs font-black">A</span>
                  <span className="text-[8px] font-bold text-sky-400 ml-0.5">▼</span>
                </button>

                {/* Change Case Aa dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white flex items-center gap-0.5"
                    title="Change Case"
                  >
                    <span className="text-xs font-semibold">Aa</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>

                  {isCaseMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 py-1 text-xs font-sans">
                      <button
                        type="button"
                        onClick={() => handleChangeCase('sentence')}
                        className="w-full px-3 py-1 text-left hover:bg-slate-100"
                      >
                        Sentence case.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('lower')}
                        className="w-full px-3 py-1 text-left hover:bg-slate-100"
                      >
                        lowercase
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('upper')}
                        className="w-full px-3 py-1 text-left hover:bg-slate-100 font-bold"
                      >
                        UPPERCASE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('capitalize')}
                        className="w-full px-3 py-1 text-left hover:bg-slate-100"
                      >
                        Capitalize Each Word
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('toggle')}
                        className="w-full px-3 py-1 text-left hover:bg-slate-100"
                      >
                        tOGGLE cASE
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear All Formatting */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({
                    bold: false,
                    italic: false,
                    underline: false,
                    strikethrough: false,
                    superscript: false,
                    subscript: false,
                    color: '#0f172a',
                    backgroundColor: 'transparent',
                    fontFamily: doc.settings.defaultFont || 'Inter',
                    fontSize: 10.5,
                    characterBorder: false
                  })}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Clear All Formatting"
                >
                  <Eraser className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Row 2: B, I, U, ab, X2, X^2, Typography Effects, Highlighter, Font Color, Character Border */}
              <div className="flex items-center gap-0.5">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ bold: !currentFormatting.bold })}
                  className={`p-1 rounded font-bold transition-colors ${
                    currentFormatting.bold
                      ? 'bg-sky-600 text-white ring-1 ring-sky-300'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ italic: !currentFormatting.italic })}
                  className={`p-1 rounded italic transition-colors ${
                    currentFormatting.italic
                      ? 'bg-sky-600 text-white ring-1 ring-sky-300'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                {/* Underline + Dropdown */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({ underline: !currentFormatting.underline })}
                    className={`p-1 rounded transition-colors ${
                      currentFormatting.underline
                        ? 'bg-sky-600 text-white ring-1 ring-sky-300'
                        : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUnderlineMenuOpen(!isUnderlineMenuOpen)}
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isUnderlineMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 p-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'single' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full py-1 px-2 text-left hover:bg-slate-100 border-b border-slate-900 mb-1"
                      >
                        Single Underline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'double' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full py-1 px-2 text-left hover:bg-slate-100 border-b-2 border-double border-slate-900 mb-1"
                      >
                        Double Underline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'wavy' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full py-1 px-2 text-left hover:bg-slate-100 underline decoration-wavy mb-1"
                      >
                        Wavy Underline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'dashed' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full py-1 px-2 text-left hover:bg-slate-100 underline decoration-dashed"
                      >
                        Dashed Underline
                      </button>
                    </div>
                  )}
                </div>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ strikethrough: !currentFormatting.strikethrough })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.strikethrough
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                {/* Subscript */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ subscript: !currentFormatting.subscript, superscript: false })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.subscript
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Subscript (X₂)"
                >
                  <Subscript className="w-3.5 h-3.5" />
                </button>

                {/* Superscript */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ superscript: !currentFormatting.superscript, subscript: false })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.superscript
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Superscript (X²)"
                >
                  <Superscript className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5" />

                {/* Text Highlight Color */}
                <ColorPickerPopover
                  currentColor={currentFormatting.backgroundColor}
                  onSelectColor={color => onApplyFormat({ backgroundColor: color })}
                  type="highlight"
                >
                  <div
                    className="p-1 hover:bg-slate-700 rounded flex flex-col items-center justify-center cursor-pointer"
                    title="Text Highlight Color"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-yellow-300" />
                    <div
                      className="w-3.5 h-1 rounded-xs mt-0.5"
                      style={{ backgroundColor: currentFormatting.backgroundColor || '#fef08a' }}
                    />
                  </div>
                </ColorPickerPopover>

                {/* Font Color */}
                <ColorPickerPopover
                  currentColor={currentFormatting.color}
                  onSelectColor={color => onApplyFormat({ color })}
                  type="text"
                >
                  <div
                    className="p-1 hover:bg-slate-700 rounded flex flex-col items-center justify-center cursor-pointer"
                    title="Font Color"
                  >
                    <span className="text-xs font-bold leading-none">A</span>
                    <div
                      className="w-3.5 h-1 rounded-xs mt-0.5"
                      style={{ backgroundColor: currentFormatting.color || '#38bdf8' }}
                    />
                  </div>
                </ColorPickerPopover>

                {/* Character Border / Box */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ characterBorder: !currentFormatting.characterBorder })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.characterBorder
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Character Border / Enclose in Box"
                >
                  <div className="w-4 h-4 border border-current rounded-xs flex items-center justify-center text-[9px] font-bold">
                    A
                  </div>
                </button>
              </div>

            </div>

            {/* 3. PARAGRAPH GROUP */}
            <div className="flex flex-col gap-1 border-r border-slate-700/80 pr-3 shrink-0">
              
              {/* Row 1: Bullets, Numbering, Multilevel, Indent Out/In, Sort, Formatting Marks */}
              <div className="flex items-center gap-0.5">
                
                {/* Bullets */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({
                      listType: currentFormatting.listType === 'bullet' ? 'none' : 'bullet',
                      listBulletStyle: '•'
                    })}
                    className={`p-1 rounded transition-colors ${
                      currentFormatting.listType === 'bullet'
                        ? 'bg-sky-600 text-white'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Bulleted List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulletsMenuOpen(!isBulletsMenuOpen)}
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isBulletsMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 p-2 text-xs grid grid-cols-3 gap-1">
                      {['•', '○', '■', '◆', '➢', '✓'].map(bullet => (
                        <button
                          key={bullet}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ listType: 'bullet', listBulletStyle: bullet });
                            setIsBulletsMenuOpen(false);
                          }}
                          className="p-2 border hover:bg-sky-50 flex items-center justify-center text-base rounded"
                        >
                          {bullet}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Numbering */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({
                      listType: currentFormatting.listType === 'number' ? 'none' : 'number',
                      listBulletStyle: '1.'
                    })}
                    className={`p-1 rounded transition-colors ${
                      currentFormatting.listType === 'number'
                        ? 'bg-sky-600 text-white'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNumberingMenuOpen(!isNumberingMenuOpen)}
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isNumberingMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 p-2 text-xs flex flex-col gap-1">
                      {['1. 2. 3.', '1) 2) 3)', 'a. b. c.', 'a) b) c)', 'i. ii. iii.', 'A. B. C.'].map(numStyle => (
                        <button
                          key={numStyle}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ listType: 'number', listBulletStyle: numStyle.split(' ')[0] });
                            setIsNumberingMenuOpen(false);
                          }}
                          className="px-2 py-1 hover:bg-sky-50 text-left font-mono rounded"
                        >
                          {numStyle}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Decrease Indent */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ indent: Math.max(0, (currentFormatting.indent || 0) - 15) })}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                  title="Decrease Indent (Shift+Tab)"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>

                {/* Increase Indent */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ indent: (currentFormatting.indent || 0) + 15 })}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                  title="Increase Indent (Tab)"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>

                {/* Sort A-Z */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ textEffect: 'none' })}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                  title="Sort Paragraphs (A to Z)"
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                </button>

                {/* Show/Hide Formatting Marks (¶ Pilcrow) */}
                <button
                  type="button"
                  onClick={() => setShowFormattingMarks(!showFormattingMarks)}
                  className={`p-1 rounded transition-colors font-bold ${
                    showFormattingMarks
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Show/Hide Formatting Marks (¶)"
                >
                  <span className="text-sm leading-none">¶</span>
                </button>
              </div>

              {/* Row 2: Align Left, Center, Right, Justify, Line Spacing, Shading, Borders */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'left' })}
                  className={`p-1 rounded transition-colors ${
                    (currentFormatting.alignment || 'left') === 'left'
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Align Left (Ctrl+L)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'center' })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.alignment === 'center'
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Align Center (Ctrl+E)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'right' })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.alignment === 'right'
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Align Right (Ctrl+R)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'justify' })}
                  className={`p-1 rounded transition-colors ${
                    currentFormatting.alignment === 'justify'
                      ? 'bg-sky-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Justify (Ctrl+J)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5" />

                {/* Line & Paragraph Spacing Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLineSpacingMenuOpen(!isLineSpacingMenuOpen)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-0.5"
                    title="Line and Paragraph Spacing"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>

                  {isLineSpacingMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 p-2 text-xs flex flex-col gap-0.5">
                      {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map(spacing => (
                        <button
                          key={spacing}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ lineSpacing: spacing });
                            setIsLineSpacingMenuOpen(false);
                          }}
                          className={`px-2 py-1 hover:bg-sky-50 text-left flex items-center justify-between rounded ${
                            (currentFormatting.lineSpacing || 1.15) === spacing ? 'font-bold text-sky-700' : ''
                          }`}
                        >
                          <span>{spacing}</span>
                          {(currentFormatting.lineSpacing || 1.15) === spacing && <Check className="w-3.5 h-3.5 text-sky-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Paragraph Background Shading */}
                <ColorPickerPopover
                  currentColor={currentFormatting.backgroundColor}
                  onSelectColor={color => onApplyFormat({ backgroundColor: color })}
                  type="shading"
                >
                  <div className="p-1 hover:bg-slate-700 rounded cursor-pointer" title="Shading (Background Color)">
                    <PaintBucket className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </ColorPickerPopover>

                {/* Paragraph Borders */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBordersMenuOpen(!isBordersMenuOpen)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-300"
                    title="Borders"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>

                  {isBordersMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-300 rounded shadow-xl z-50 p-1 text-xs">
                      {[
                        { label: 'Bottom Border', value: 'bottom' },
                        { label: 'Top Border', value: 'top' },
                        { label: 'Left Border', value: 'left' },
                        { label: 'All Borders', value: 'all' },
                        { label: 'Outside Box', value: 'box' },
                        { label: 'No Border', value: 'none' }
                      ].map(b => (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ border: b.value as any });
                            setIsBordersMenuOpen(false);
                          }}
                          className="w-full px-2 py-1 hover:bg-sky-50 text-left rounded"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 4. STYLES GALLERY GROUP */}
            <div className="flex items-center border-r border-slate-700/80 pr-3 shrink-0">
              <StyleGallery
                currentStyleName={currentFormatting.styleName || 'Normal'}
                onApplyStyle={(preset: DocumentStylePreset) => {
                  onApplyFormat({
                    styleName: preset.name,
                    fontSize: preset.formatting.fontSize,
                    bold: preset.formatting.bold,
                    italic: preset.formatting.italic,
                    color: preset.formatting.color,
                    fontFamily: preset.formatting.fontFamily,
                    lineSpacing: preset.lineSpacing,
                    alignment: preset.alignment,
                    indent: preset.indent,
                    border: preset.border
                  });
                }}
              />
            </div>

            {/* 5. EDITING & ACTIONS GROUP */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenFindReplace}
                className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                title="Find & Replace (Ctrl+F)"
              >
                <Search className="w-4 h-4 text-sky-400 mb-0.5" />
                <span className="text-[9.5px]">Find</span>
              </button>

              <button
                type="button"
                onClick={onSelectAll}
                className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                title="Select All (Ctrl+A)"
              >
                <Maximize2 className="w-4 h-4 text-purple-400 mb-0.5" />
                <span className="text-[9.5px]">Select All</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= INSERT TAB ================= */}
        {activeTab === 'Insert' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onInsertParagraph}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-3 text-slate-200"
            >
              <Type className="w-5 h-5 mb-0.5 text-sky-400" />
              <span className="text-[10px] font-bold">+ Custom Text</span>
            </button>

            <button
              type="button"
              onClick={() => onInsertHeading && onInsertHeading(1)}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <span className="text-base font-black text-sky-400">H1</span>
              <span className="text-[10px] font-bold">Heading</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuestionBuilder}
              className="flex flex-col items-center justify-center p-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-600/50 text-sky-300 rounded-lg transition-colors px-3"
            >
              <HelpCircle className="w-5 h-5 mb-0.5 text-sky-400" />
              <span className="text-[10px] font-bold">+ MCQ Question</span>
            </button>

            <button
              type="button"
              onClick={onOpenEquationModal}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <Sigma className="w-5 h-5 mb-0.5 text-amber-400" />
              <span className="text-[10px] font-bold">Equation</span>
            </button>

            <button
              type="button"
              onClick={onOpenSymbolsModal}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <Hash className="w-5 h-5 mb-0.5 text-indigo-400" />
              <span className="text-[10px] font-bold">Symbol</span>
            </button>

            <div className="h-8 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => onInsertTable && onInsertTable(3, 3)}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <TableIcon className="w-5 h-5 mb-0.5 text-emerald-400" />
              <span className="text-[10px] font-bold">Table 3×3</span>
            </button>

            <button
              type="button"
              onClick={onInsertImage}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <ImageIcon className="w-5 h-5 mb-0.5 text-purple-400" />
              <span className="text-[10px] font-bold">Image</span>
            </button>

            <button
              type="button"
              onClick={() => onInsertShape && onInsertShape('rectangle')}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <Shapes className="w-5 h-5 mb-0.5 text-rose-400" />
              <span className="text-[10px] font-bold">Shape</span>
            </button>

            <button
              type="button"
              onClick={() => onInsertWordArt && onInsertWordArt('EduForge Special', 'gradient_purple')}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <Sparkles className="w-5 h-5 mb-0.5 text-yellow-400" />
              <span className="text-[10px] font-bold">WordArt</span>
            </button>

            <button
              type="button"
              onClick={onInsertHorizontalLine}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <div className="w-5 h-0.5 bg-slate-400 my-2" />
              <span className="text-[10px] font-bold">Divider Line</span>
            </button>

            <button
              type="button"
              onClick={onInsertPageBreak}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700/80 rounded transition-colors px-2 text-slate-200"
            >
              <Layers className="w-5 h-5 mb-0.5 text-sky-400" />
              <span className="text-[10px] font-bold">Page Break</span>
            </button>
          </div>
        )}

        {/* ================= PAGE LAYOUT TAB ================= */}
        {activeTab === 'Page Layout' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
              <button
                type="button"
                onClick={() => onSetColumns && onSetColumns(1)}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
                  doc.settings.columns === 1 ? 'bg-sky-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className="w-4 h-5 border border-current rounded-xs" />
                1 Column
              </button>
              <button
                type="button"
                onClick={() => onSetColumns && onSetColumns(2)}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
                  doc.settings.columns === 2 ? 'bg-sky-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className="w-4 h-5 border border-current rounded-xs flex gap-0.5 p-0.5">
                  <div className="flex-1 bg-current" />
                  <div className="flex-1 bg-current" />
                </div>
                2 Columns (Paper Style)
              </button>
            </div>

            <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
              <button
                type="button"
                onClick={onToggleColumnDivider}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                  doc.settings.columnDivider ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Column Divider Line
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSetMargins && onSetMargins({ top: 10, bottom: 10, left: 10, right: 10 })}
                className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Narrow (10mm)
              </button>
              <button
                type="button"
                onClick={() => onSetMargins && onSetMargins({ top: 15, bottom: 15, left: 15, right: 15 })}
                className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold text-sky-400"
              >
                Normal (15mm)
              </button>
              <button
                type="button"
                onClick={() => onSetMargins && onSetMargins({ top: 25, bottom: 25, left: 25, right: 25 })}
                className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Wide (25mm)
              </button>
            </div>
          </div>
        )}

        {/* ================= VIEW TAB ================= */}
        {activeTab === 'View' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <button
                type="button"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-sky-400">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
              >
                100%
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMarginGuides(!showMarginGuides)}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  showMarginGuides ? 'bg-sky-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                Margin Guides
              </button>
              <button
                type="button"
                onClick={() => setShowColumnGuides(!showColumnGuides)}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  showColumnGuides ? 'bg-sky-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                Column Guides
              </button>
              <button
                type="button"
                onClick={() => setPrintPreviewMode(!printPreviewMode)}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  printPreviewMode ? 'bg-purple-600 text-white' : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                Print Preview Clean Mode
              </button>
            </div>
          </div>
        )}

        {/* ================= MATH EQUATION TAB ================= */}
        {activeTab === 'Equation' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEquationModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1.5"
            >
              <Sigma className="w-4 h-4" /> Open Math Equation Editor
            </button>
            <button
              type="button"
              onClick={onOpenSymbolsModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded flex items-center gap-1.5"
            >
              <Hash className="w-4 h-4" /> Math Symbol Palette
            </button>
          </div>
        )}

        {/* ================= PHYSICS TAB ================= */}
        {activeTab === 'Physics' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPhysicsModal}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center gap-1.5"
            >
              <Atom className="w-4 h-4" /> Physics Formulas & Notation Library
            </button>
            <button
              type="button"
              onClick={onOpenUnitsModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded"
            >
              SI Units Library
            </button>
            <button
              type="button"
              onClick={onOpenConstantsModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded"
            >
              Physical Constants
            </button>
          </div>
        )}

        {/* ================= CHEMISTRY TAB ================= */}
        {activeTab === 'Chemistry' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChemistryModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5"
            >
              <FlaskConical className="w-4 h-4" /> Chemistry Formula & Reaction Library
            </button>
          </div>
        )}

        {/* ================= OTHER TABS ================= */}
        {(activeTab === 'References' || activeTab === 'Review' || activeTab === 'Tools') && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <Database className="w-4 h-4 text-sky-400" /> Browse Question Bank
            </button>
            <button
              type="button"
              onClick={onOpenFindReplace}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-emerald-400" /> Advanced Find & Replace
            </button>
          </div>
        )}

        {/* ================= FILE TAB ================= */}
        {activeTab === 'File' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200 hover:text-sky-400 transition-colors"
            >
              <Save className="w-5 h-5 mb-0.5 text-sky-400" />
              <span className="text-[10px] font-bold">Save Paper</span>
            </button>
            <div className="h-8 w-px bg-slate-700" />
            <button
              type="button"
              onClick={onExportDocx}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200 hover:text-blue-400 transition-colors"
            >
              <Download className="w-5 h-5 mb-0.5 text-blue-400" />
              <span className="text-[10px] font-bold">Export DOCX</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200 hover:text-emerald-400 transition-colors"
            >
              <Printer className="w-5 h-5 mb-0.5 text-emerald-400" />
              <span className="text-[10px] font-bold">Export PDF</span>
            </button>
            <div className="h-8 w-px bg-slate-700" />
            <button
              type="button"
              onClick={onPrintPreview}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200 hover:text-purple-400 transition-colors"
            >
              <Eye className="w-5 h-5 mb-0.5 text-purple-400" />
              <span className="text-[10px] font-bold">Print Preview</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
