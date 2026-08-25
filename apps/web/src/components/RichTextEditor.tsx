import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon, List, ListOrdered, Sigma, Sparkles,
  RotateCcw, RotateCw, Eye, EyeOff, Image as ImageIcon, Loader2
} from 'lucide-react';
import { api } from '../services/api.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  className?: string;
  showPreview?: boolean;
  onImagePasted?: (url: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const COMMON_MATH_SYMBOLS = [
  { label: 'Ω', latex: '\\Omega' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'θ', latex: '\\theta' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'μ', latex: '\\mu' },
  { label: 'π', latex: '\\pi' },
  { label: 'σ', latex: '\\sigma' },
  { label: 'Δ', latex: '\\Delta' },
  { label: '∞', latex: '\\infty' },
  { label: 'a/b', latex: '\\frac{a}{b}' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: '±', latex: '\\pm' },
  { label: '≈', latex: '\\approx' },
  { label: '→', latex: '\\rightarrow' },
  { label: '⇌', latex: '\\rightleftharpoons' },
  { label: '°', latex: '^\\circ' },
  { label: '∫', latex: '\\int' },
  { label: '∑', latex: '\\sum' }
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type here or drop scientific formulas...',
  compact = false,
  autoFocus = false,
  className = '',
  showPreview = false,
  onImagePasted,
  onBlur,
  onKeyDown
}) => {
  const [showMathMenu, setShowMathMenu] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(showPreview);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const mathMenuRef = useRef<HTMLDivElement>(null);

  // Convert HTML or plain text from TipTap to text
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: compact ? false : { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {}
      }),
      Underline,
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder
      })
    ],
    content: value || '',
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);
    },
    onBlur: () => {
      if (onBlur) onBlur();
    }
  });

  // Keep content in sync with external value prop
  useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  // Close math menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mathMenuRef.current && !mathMenuRef.current.contains(e.target as Node)) {
        setShowMathMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const insertSymbol = (latex: string) => {
    editor.chain().focus().insertContent(` ${latex} `).run();
    setShowMathMenu(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const eduData = e.dataTransfer.getData('application/eduforge-item');
      let inserted = '';
      if (eduData) {
        const item = JSON.parse(eduData);
        inserted = item.latex || item.symbol || item.value || item.formula || '';
      } else {
        inserted = e.dataTransfer.getData('text/plain') || '';
      }
      if (inserted) {
        editor.chain().focus().insertContent(` ${inserted} `).run();
      }
    } catch (err) {
      console.error('Error dropping into editor:', err);
    }
  };

  // Copy-paste handler for images & screenshots
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      setIsUploadingImage(true);
      try {
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            const res = await api.uploadImage(file);
            if (res.url) {
              if (onImagePasted) {
                onImagePasted(res.url);
              }
              // Insert image marker in text
              editor.chain().focus().insertContent(` [Figure: ${file.name || 'Pasted Image'}] `).run();
            }
          }
        }
      } catch (err) {
        console.error('Error uploading pasted image:', err);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={`rounded-lg border border-slate-300 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden shadow-2xs relative ${className}`}
    >
      {/* Uploading overlay banner if image being pasted */}
      {isUploadingImage && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2 z-50 text-xs font-bold text-indigo-700">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Uploading pasted image...</span>
        </div>
      )}

      {/* Top Formatting Ribbon / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1 select-none">
        <div className="flex flex-wrap items-center gap-0.5 text-slate-700">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
              editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 font-black' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
              editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 font-black' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
              editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700 font-black' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

          {/* Superscript */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
              editor.isActive('superscript') ? 'bg-indigo-100 text-indigo-700 font-black' : ''
            }`}
            title="Superscript (e.g. x²)"
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>

          {/* Subscript */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`p-1 rounded hover:bg-slate-200 transition-colors ${
              editor.isActive('subscript') ? 'bg-indigo-100 text-indigo-700 font-black' : ''
            }`}
            title="Subscript (e.g. H₂O)"
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>

          {!compact && (
            <>
              <div className="h-3.5 w-px bg-slate-300 mx-0.5" />
              {/* Bullet List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                  editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>

              {/* Numbered List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                  editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

          {/* Math & Greek Symbols Menu */}
          <div className="relative" ref={mathMenuRef}>
            <button
              type="button"
              onClick={() => setShowMathMenu(!showMathMenu)}
              className={`p-1 rounded flex items-center gap-1 text-xs font-bold transition-colors ${
                showMathMenu ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-50'
              }`}
              title="Insert Science & Math Formulas / Greek Symbols"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Math</span>
            </button>

            {/* Quick Symbols Dropdown */}
            {showMathMenu && (
              <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border border-slate-300 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                {COMMON_MATH_SYMBOLS.map((sym, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertSymbol(sym.latex)}
                    className="p-1.5 text-center font-mono font-bold hover:bg-indigo-50 hover:text-indigo-700 rounded border border-slate-200 transition-all text-slate-800"
                    title={sym.latex}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side tools (Undo / Redo / KaTeX Preview toggle) */}
        <div className="flex items-center gap-1 text-slate-500">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          {!compact && (
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className={`p-1 rounded transition-colors text-[10px] flex items-center gap-1 font-bold cursor-pointer ${
                previewOpen ? 'bg-sky-100 text-sky-800' : 'hover:bg-slate-200'
              }`}
              title="Toggle Live Formula Preview"
            >
              {previewOpen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Content editable area */}
      <div className={`p-2.5 text-slate-900 leading-relaxed font-medium ${compact ? 'min-h-[38px]' : 'min-h-[75px]'}`}>
        <EditorContent
          editor={editor}
          onKeyDown={onKeyDown}
          className="outline-hidden focus:outline-hidden prose prose-sm max-w-none text-black"
        />
      </div>

      {/* Optional Live KaTeX Formula Preview */}
      {previewOpen && value && (
        <div className="border-t border-slate-200 bg-sky-50/50 p-2 text-xs">
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Live Equation & Formatting Preview:
          </div>
          <div className="text-slate-900 font-semibold">
            <MathTextRenderer text={value} />
          </div>
        </div>
      )}
    </div>
  );
};
