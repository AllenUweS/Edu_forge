import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import {
  DocumentModel, DocumentBlock, QuestionBlock, EquationBlock, ParagraphBlock, HeadingBlock,
  Question, OptionLayoutType, WordArtStyle, ShapeType, Alignment, TableBlock, TextRun
} from '@eduforge/shared';
import { EditorRibbon, RibbonTab, FormattingState } from '../editor/EditorRibbon.js';
import { A4Canvas } from '../editor/A4Canvas.js';
import { StatusBar } from '../components/StatusBar.js';
import { EquationEditorModal } from '../equation/EquationEditorModal.js';
import { SymbolPickerModal } from '../symbols/SymbolPickerModal.js';
import { PhysicsLibraryModal } from '../symbols/PhysicsLibraryModal.js';
import { ChemistryLibraryModal } from '../symbols/ChemistryLibraryModal.js';
import { UnitsLibraryModal } from '../symbols/UnitsLibraryModal.js';
import { ConstantsLibraryModal } from '../symbols/ConstantsLibraryModal.js';
import { QuestionBuilderModal } from '../questions/QuestionBuilderModal.js';
import { QuestionBankModal } from '../questions/QuestionBankModal.js';
import { TemplateGalleryModal } from '../templates/TemplateGalleryModal.js';
import { FindReplaceModal } from '../editor/FindReplaceModal.js';
import { preloadCoreFonts, ensureFontLoaded } from '../editor/fonts.js';
import { useTheme } from '../state/ThemeContext.js';

interface EditorPageProps {
  documentId: string;
  onNavigateHome: () => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  documentId,
  onNavigateHome
}) => {
  const { theme } = useTheme();
  const [doc, setDoc] = useState<DocumentModel | null>(null);
  const [activeTab, setActiveTab] = useState<RibbonTab>('Home');
  const [zoom, setZoom] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(false);
  const [showColumnGuides, setShowColumnGuides] = useState<boolean>(false);
  const [showFormattingMarks, setShowFormattingMarks] = useState<boolean>(false);
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Active Formatting Under Cursor
  const [currentFormatting, setCurrentFormatting] = useState<FormattingState>({
    fontFamily: 'Calibri, Inter, sans-serif',
    fontSize: 10.5,
    bold: false,
    italic: false,
    underline: false,
    color: '#0f172a',
    alignment: 'left',
    lineSpacing: 1.15,
    styleName: 'Normal'
  });

  // Format Painter State
  const [isFormatPainterActive, setIsFormatPainterActive] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<FormattingState | null>(null);

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // History stack for Undo / Redo
  const [past, setPast] = useState<DocumentModel[]>([]);
  const [future, setFuture] = useState<DocumentModel[]>([]);

  // Modals state
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [editingEquationBlock, setEditingEquationBlock] = useState<EquationBlock | null>(null);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isPhysicsModalOpen, setIsPhysicsModalOpen] = useState(false);
  const [isChemistryModalOpen, setIsChemistryModalOpen] = useState(false);
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false);
  const [isConstantsModalOpen, setIsConstantsModalOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | undefined>(undefined);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  // Preload top fonts on mount
  useEffect(() => {
    preloadCoreFonts();
    loadDoc();
  }, [documentId]);

  const loadDoc = async () => {
    try {
      const data = await api.getDocument(documentId);
      setDoc(data);
      setLastSavedAt(new Date(data.updatedAt));
      if (data.settings.defaultFont) {
        ensureFontLoaded(data.settings.defaultFont);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

  // Push snapshot for undo
  const pushState = (newDoc: DocumentModel) => {
    if (doc) {
      setPast(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(doc))]);
      setFuture([]);
    }
    setDoc(newDoc);
    triggerAutosave(newDoc);
  };

  // Debounced Autosave
  const triggerAutosave = useCallback((currentDoc: DocumentModel) => {
    setAutosaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateDocument(currentDoc.id, currentDoc);
        setAutosaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (err) {
        console.error('Autosave failed:', err);
        setAutosaveStatus('error');
      }
    }, 1200);
  }, []);

  // Undo / Redo
  const handleUndo = () => {
    if (past.length === 0 || !doc) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [JSON.parse(JSON.stringify(doc)), ...prev]);
    setPast(newPast);
    setDoc(previous);
    triggerAutosave(previous);
  };

  const handleRedo = () => {
    if (future.length === 0 || !doc) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, JSON.parse(JSON.stringify(doc))]);
    setFuture(newFuture);
    setDoc(next);
    triggerAutosave(next);
  };

  // Keyboard Shortcuts (MS Word standards: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+F, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (doc) {
            api.updateDocument(doc.id, doc).then(() => {
              setAutosaveStatus('saved');
              setLastSavedAt(new Date());
            });
          }
        } else if (e.key === 'b') {
          e.preventDefault();
          handleApplyFormat({ bold: !currentFormatting.bold });
        } else if (e.key === 'i') {
          e.preventDefault();
          handleApplyFormat({ italic: !currentFormatting.italic });
        } else if (e.key === 'u') {
          e.preventDefault();
          handleApplyFormat({ underline: !currentFormatting.underline });
        } else if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'f') {
          e.preventDefault();
          setIsFindReplaceOpen(true);
        } else if (e.key === 'p') {
          e.preventDefault();
          handleExportPdf();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc, past, future, currentFormatting]);

  // Exports
  const handleExportDocx = async () => {
    if (!doc) return;
    try {
      const blob = await api.exportDocx(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate DOCX export');
    }
  };

  const handleExportPdf = async () => {
    if (!doc) return;
    try {
      const html = await api.exportPdfHtml(doc);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      alert('Failed to render PDF preview');
    }
  };

  // Block Mutations Helper
  const getTargetSectionId = () => {
    if (!doc || doc.sections.length === 0) return 'sec-default';
    return doc.sections[0].id;
  };

  const handleAddBlockToSection = (block: DocumentBlock, targetSecId?: string) => {
    if (!doc) return;
    const secId = targetSecId || getTargetSectionId();
    const updatedSections = doc.sections.map(s => {
      if (s.id === secId) {
        return { ...s, blocks: [...s.blocks, block] };
      }
      return s;
    });
    pushState({ ...doc, sections: updatedSections });
    setSelectedBlockId(block.id);
  };

  const handleUpdateBlock = (secId: string, updated: DocumentBlock) => {
    if (!doc) return;
    const updatedSections = doc.sections.map(s => {
      if (s.id === secId) {
        return { ...s, blocks: s.blocks.map(b => (b.id === updated.id ? updated : b)) };
      }
      return s;
    });
    pushState({ ...doc, sections: updatedSections });
  };

  const handleDeleteBlock = (secId: string, blockId: string) => {
    if (!doc) return;
    const updatedSections = doc.sections.map(s => {
      if (s.id === secId) {
        return { ...s, blocks: s.blocks.filter(b => b.id !== blockId) };
      }
      return s;
    });
    pushState({ ...doc, sections: updatedSections });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (secId: string, blockId: string) => {
    if (!doc) return;
    const updatedSections = doc.sections.map(s => {
      if (s.id === secId) {
        const idx = s.blocks.findIndex(b => b.id === blockId);
        if (idx >= 0) {
          const clone: DocumentBlock = JSON.parse(JSON.stringify(s.blocks[idx]));
          clone.id = `${clone.type}-${Date.now()}`;
          const newBlocks = [...s.blocks];
          newBlocks.splice(idx + 1, 0, clone);
          return { ...s, blocks: newBlocks };
        }
      }
      return s;
    });
    pushState({ ...doc, sections: updatedSections });
  };

  const handleMoveBlock = (secId: string, blockId: string, direction: 'up' | 'down') => {
    if (!doc) return;
    const updatedSections = doc.sections.map(s => {
      if (s.id === secId) {
        const idx = s.blocks.findIndex(b => b.id === blockId);
        if (idx < 0) return s;
        if (direction === 'up' && idx === 0) return s;
        if (direction === 'down' && idx === s.blocks.length - 1) return s;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const newBlocks = [...s.blocks];
        const temp = newBlocks[idx];
        newBlocks[idx] = newBlocks[targetIdx];
        newBlocks[targetIdx] = temp;
        return { ...s, blocks: newBlocks };
      }
      return s;
    });
    pushState({ ...doc, sections: updatedSections });
  };

  // MS Word-style Enter key split / insert next paragraph
  const handleInsertNextParagraph = (currentBlockId: string) => {
    if (!doc) return;
    const sec = doc.sections[0];
    if (!sec) return;

    const idx = sec.blocks.findIndex(b => b.id === currentBlockId);
    const currentBlock = idx >= 0 ? sec.blocks[idx] : null;

    // Inherit list status or paragraph formatting if available
    let nextListType: any = 'none';
    let nextListBulletStyle = undefined;
    let nextIndent = undefined;

    if (currentBlock && currentBlock.type === 'paragraph') {
      const pb = currentBlock as ParagraphBlock;
      if (pb.listType && pb.listType !== 'none') {
        nextListType = pb.listType;
        if (pb.listType === 'number') {
          // Increment number
          const curNum = parseInt(pb.listBulletStyle || '1', 10);
          nextListBulletStyle = isNaN(curNum) ? '1.' : `${curNum + 1}.`;
        } else {
          nextListBulletStyle = pb.listBulletStyle;
        }
      }
      nextIndent = pb.indent;
    }

    const newBlockId = `p-${Date.now()}`;
    const newBlock: ParagraphBlock = {
      id: newBlockId,
      type: 'paragraph',
      runs: [
        {
          id: `r-${Date.now()}`,
          text: '',
          formatting: {
            fontFamily: currentFormatting.fontFamily,
            fontSize: currentFormatting.fontSize,
            color: currentFormatting.color
          }
        }
      ],
      alignment: currentFormatting.alignment || 'left',
      lineSpacing: currentFormatting.lineSpacing || 1.15,
      indent: nextIndent,
      listType: nextListType,
      listBulletStyle: nextListBulletStyle
    };

    const newBlocks = [...sec.blocks];
    if (idx >= 0) {
      newBlocks.splice(idx + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }

    pushState({
      ...doc,
      sections: doc.sections.map(s => (s.id === sec.id ? { ...s, blocks: newBlocks } : s))
    });

    setSelectedBlockId(newBlockId);

    // Auto focus newly created paragraph
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newBlockId}"]`) as HTMLElement;
      if (el) {
        el.focus();
      }
    }, 50);
  };

  // MS Word-style Backspace delete empty block and focus previous
  const handleFocusPreviousBlock = (currentBlockId: string) => {
    if (!doc) return;
    const sec = doc.sections[0];
    if (!sec) return;

    const idx = sec.blocks.findIndex(b => b.id === currentBlockId);
    if (idx <= 0 && sec.blocks.length === 1) return; // Keep at least 1 block

    if (idx >= 0) {
      const prevBlock = sec.blocks[idx - 1];
      handleDeleteBlock(sec.id, currentBlockId);
      if (prevBlock) {
        setSelectedBlockId(prevBlock.id);
        setTimeout(() => {
          const el = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLElement;
          if (el) el.focus();
        }, 50);
      }
    }
  };

  // Apply Formatting from Ribbon to selected block or document
  const handleApplyFormat = (formatUpdate: Partial<FormattingState>) => {
    const updatedFormatting = { ...currentFormatting, ...formatUpdate };
    setCurrentFormatting(updatedFormatting);

    if (formatUpdate.fontFamily) {
      ensureFontLoaded(formatUpdate.fontFamily);
    }

    if (!doc) return;

    // If a block is currently selected, apply to it
    if (selectedBlockId) {
      const sec = doc.sections[0];
      const targetBlock = sec?.blocks.find(b => b.id === selectedBlockId);

      if (targetBlock && targetBlock.type === 'paragraph') {
        const pb = targetBlock as ParagraphBlock;
        const runs = pb.runs && pb.runs.length > 0 ? pb.runs : [{ id: `r-${Date.now()}`, text: '' }];
        const newRuns: TextRun[] = runs.map(r => ({
          ...r,
          formatting: {
            ...r.formatting,
            bold: formatUpdate.bold !== undefined ? formatUpdate.bold : r.formatting?.bold,
            italic: formatUpdate.italic !== undefined ? formatUpdate.italic : r.formatting?.italic,
            underline: formatUpdate.underline !== undefined ? formatUpdate.underline : r.formatting?.underline,
            underlineStyle: formatUpdate.underlineStyle !== undefined ? formatUpdate.underlineStyle : r.formatting?.underlineStyle,
            underlineColor: formatUpdate.underlineColor !== undefined ? formatUpdate.underlineColor : r.formatting?.underlineColor,
            strikethrough: formatUpdate.strikethrough !== undefined ? formatUpdate.strikethrough : r.formatting?.strikethrough,
            superscript: formatUpdate.superscript !== undefined ? formatUpdate.superscript : r.formatting?.superscript,
            subscript: formatUpdate.subscript !== undefined ? formatUpdate.subscript : r.formatting?.subscript,
            color: formatUpdate.color !== undefined ? formatUpdate.color : r.formatting?.color,
            backgroundColor: formatUpdate.backgroundColor !== undefined ? formatUpdate.backgroundColor : r.formatting?.backgroundColor,
            fontFamily: formatUpdate.fontFamily !== undefined ? formatUpdate.fontFamily : r.formatting?.fontFamily,
            fontSize: formatUpdate.fontSize !== undefined ? formatUpdate.fontSize : r.formatting?.fontSize,
            characterBorder: formatUpdate.characterBorder !== undefined ? formatUpdate.characterBorder : r.formatting?.characterBorder,
            textEffect: formatUpdate.textEffect !== undefined ? formatUpdate.textEffect : r.formatting?.textEffect
          }
        }));

        const updatedPb: ParagraphBlock = {
          ...pb,
          runs: newRuns,
          alignment: formatUpdate.alignment !== undefined ? formatUpdate.alignment : pb.alignment,
          lineSpacing: formatUpdate.lineSpacing !== undefined ? formatUpdate.lineSpacing : pb.lineSpacing,
          indent: formatUpdate.indent !== undefined ? formatUpdate.indent : pb.indent,
          listType: formatUpdate.listType !== undefined ? formatUpdate.listType : pb.listType,
          listBulletStyle: formatUpdate.listBulletStyle !== undefined ? formatUpdate.listBulletStyle : pb.listBulletStyle,
          border: formatUpdate.border !== undefined ? formatUpdate.border : pb.border,
          styleName: formatUpdate.styleName !== undefined ? formatUpdate.styleName : pb.styleName
        };

        handleUpdateBlock(sec.id, updatedPb);
        return;
      }

      if (targetBlock && targetBlock.type === 'heading') {
        const hb = targetBlock as HeadingBlock;
        const runs = hb.runs && hb.runs.length > 0 ? hb.runs : [{ id: `r-${Date.now()}`, text: '' }];
        const newRuns: TextRun[] = runs.map(r => ({
          ...r,
          formatting: {
            ...r.formatting,
            bold: formatUpdate.bold !== undefined ? formatUpdate.bold : r.formatting?.bold,
            italic: formatUpdate.italic !== undefined ? formatUpdate.italic : r.formatting?.italic,
            fontFamily: formatUpdate.fontFamily !== undefined ? formatUpdate.fontFamily : r.formatting?.fontFamily,
            fontSize: formatUpdate.fontSize !== undefined ? formatUpdate.fontSize : r.formatting?.fontSize,
            color: formatUpdate.color !== undefined ? formatUpdate.color : r.formatting?.color
          }
        }));
        handleUpdateBlock(sec.id, {
          ...hb,
          runs: newRuns,
          alignment: formatUpdate.alignment !== undefined ? formatUpdate.alignment : hb.alignment
        });
        return;
      }
    }

    // Otherwise, if no block is selected, insert a new formatted paragraph
    const newP: ParagraphBlock = {
      id: `p-${Date.now()}`,
      type: 'paragraph',
      runs: [
        {
          id: `r-${Date.now()}`,
          text: '',
          formatting: {
            fontFamily: updatedFormatting.fontFamily,
            fontSize: updatedFormatting.fontSize,
            bold: updatedFormatting.bold,
            italic: updatedFormatting.italic,
            underline: updatedFormatting.underline,
            color: updatedFormatting.color
          }
        }
      ],
      alignment: updatedFormatting.alignment || 'left',
      lineSpacing: updatedFormatting.lineSpacing || 1.15
    };
    handleAddBlockToSection(newP);
  };

  // Format Painter Handlers
  const handleToggleFormatPainter = () => {
    if (isFormatPainterActive) {
      setIsFormatPainterActive(false);
      setCopiedFormat(null);
    } else {
      setIsFormatPainterActive(true);
      setCopiedFormat({ ...currentFormatting });
    }
  };

  const handleApplyFormatPainter = (targetBlock: DocumentBlock) => {
    if (!copiedFormat) return;
    if (targetBlock.type === 'paragraph') {
      const pb = targetBlock as ParagraphBlock;
      const newRuns = pb.runs.map(r => ({
        ...r,
        formatting: {
          ...r.formatting,
          bold: copiedFormat.bold,
          italic: copiedFormat.italic,
          underline: copiedFormat.underline,
          underlineStyle: copiedFormat.underlineStyle,
          color: copiedFormat.color,
          backgroundColor: copiedFormat.backgroundColor,
          fontFamily: copiedFormat.fontFamily,
          fontSize: copiedFormat.fontSize,
          characterBorder: copiedFormat.characterBorder
        }
      }));
      handleUpdateBlock(getTargetSectionId(), {
        ...pb,
        runs: newRuns,
        alignment: copiedFormat.alignment,
        lineSpacing: copiedFormat.lineSpacing,
        border: copiedFormat.border,
        styleName: copiedFormat.styleName
      });
    }
    setIsFormatPainterActive(false);
  };

  // Clipboard operations
  const handlePasteText = async (mode: 'formatted' | 'plain' = 'formatted') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const p: ParagraphBlock = {
          id: `p-${Date.now()}`,
          type: 'paragraph',
          runs: [
            {
              id: `r-${Date.now()}`,
              text,
              formatting: mode === 'formatted' ? {
                fontFamily: currentFormatting.fontFamily,
                fontSize: currentFormatting.fontSize,
                bold: currentFormatting.bold,
                italic: currentFormatting.italic,
                color: currentFormatting.color
              } : undefined
            }
          ]
        };
        handleAddBlockToSection(p);
      }
    } catch (e) {
      const text = prompt('Paste text:');
      if (text) {
        handleAddBlockToSection({
          id: `p-${Date.now()}`,
          type: 'paragraph',
          runs: [{ id: `r-${Date.now()}`, text }]
        });
      }
    }
  };

  const handleCopyText = () => {
    if (!doc || !selectedBlockId) return;
    const sec = doc.sections[0];
    const b = sec?.blocks.find(x => x.id === selectedBlockId);
    if (b && b.type === 'paragraph') {
      const txt = (b as ParagraphBlock).runs.map(r => r.text).join('');
      navigator.clipboard?.writeText(txt);
    }
  };

  const handleCutText = () => {
    if (!doc || !selectedBlockId) return;
    handleCopyText();
    handleDeleteBlock(getTargetSectionId(), selectedBlockId);
  };

  const handleSelectAll = () => {
    const el = document.querySelector('.page-sheet') as HTMLElement;
    if (el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  // Find and Replace Implementation
  const handleFind = (query: string): number => {
    if (!doc || !query) return 0;
    let count = 0;
    const qLower = query.toLowerCase();
    for (const sec of doc.sections) {
      for (const b of sec.blocks) {
        if (b.type === 'paragraph') {
          for (const r of (b as ParagraphBlock).runs) {
            if (r.text.toLowerCase().includes(qLower)) count++;
          }
        } else if (b.type === 'question') {
          if ((b as QuestionBlock).question.rawText?.toLowerCase().includes(qLower)) count++;
        }
      }
    }
    return count;
  };

  const handleReplace = (query: string, replacement: string) => {
    if (!doc || !query) return;
    let replaced = false;
    const updatedSections = doc.sections.map(s => ({
      ...s,
      blocks: s.blocks.map(b => {
        if (!replaced && b.type === 'paragraph') {
          const pb = b as ParagraphBlock;
          const newRuns = pb.runs.map(r => {
            if (!replaced && r.text.includes(query)) {
              replaced = true;
              return { ...r, text: r.text.replace(query, replacement) };
            }
            return r;
          });
          return { ...pb, runs: newRuns };
        }
        return b;
      })
    }));
    pushState({ ...doc, sections: updatedSections });
  };

  const handleReplaceAll = (query: string, replacement: string) => {
    if (!doc || !query) return;
    const updatedSections = doc.sections.map(s => ({
      ...s,
      blocks: s.blocks.map(b => {
        if (b.type === 'paragraph') {
          const pb = b as ParagraphBlock;
          return {
            ...pb,
            runs: pb.runs.map(r => ({ ...r, text: r.text.split(query).join(replacement) }))
          };
        } else if (b.type === 'question') {
          const qb = b as QuestionBlock;
          return {
            ...qb,
            question: {
              ...qb.question,
              rawText: qb.question.rawText?.split(query).join(replacement)
            }
          };
        }
        return b;
      })
    }));
    pushState({ ...doc, sections: updatedSections });
  };

  // Metrics calculations
  const calculateMetrics = () => {
    if (!doc) return { words: 0, questions: 0 };
    let words = 0;
    let questions = 0;
    for (const s of doc.sections) {
      for (const b of s.blocks) {
        if (b.type === 'question') {
          questions++;
          words += ((b as QuestionBlock).question.rawText?.split(/\s+/).length || 0);
        } else if (b.type === 'paragraph') {
          const txt = (b as ParagraphBlock).runs.map(r => r.text).join(' ');
          words += txt.split(/\s+/).filter(Boolean).length;
        }
      }
    }
    return { words, questions };
  };

  if (!doc) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-slate-400">
        Loading document workspace...
      </div>
    );
  }

  const { words, questions: questionCount } = calculateMetrics();

  const getWorkspaceBg = () => {
    if (theme === 'white') return 'bg-[#cbd5e1]';
    if (theme === 'dark-blue') return 'bg-[#060c18]';
    return 'bg-[#121418]';
  };

  return (
    <div className={`min-h-screen flex flex-col pb-12 transition-colors duration-200 ${getWorkspaceBg()}`}>
      
      {/* Full MS Word-style Ribbon with 80+ Fonts */}
      <EditorRibbon
        document={doc}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentFormatting={currentFormatting}
        onApplyFormat={handleApplyFormat}
        isFormatPainterActive={isFormatPainterActive}
        onToggleFormatPainter={handleToggleFormatPainter}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={() => triggerAutosave(doc)}
        onExportDocx={handleExportDocx}
        onExportPdf={handleExportPdf}
        onPrintPreview={() => setPrintPreviewMode(!printPreviewMode)}
        onNavigateHome={onNavigateHome}
        // Insert
        onOpenQuestionBuilder={() => {
          setEditingQuestion(undefined);
          setIsQuestionBuilderOpen(true);
        }}
        onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
        onOpenEquationModal={() => {
          setEditingEquationBlock(null);
          setIsEquationModalOpen(true);
        }}
        onOpenSymbolsModal={() => setIsSymbolModalOpen(true)}
        onOpenPhysicsModal={() => setIsPhysicsModalOpen(true)}
        onOpenChemistryModal={() => setIsChemistryModalOpen(true)}
        onOpenUnitsModal={() => setIsUnitsModalOpen(true)}
        onOpenConstantsModal={() => setIsConstantsModalOpen(true)}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onInsertParagraph={() => {
          const p: ParagraphBlock = {
            id: `p-${Date.now()}`,
            type: 'paragraph',
            runs: [{ id: `r-${Date.now()}`, text: '', formatting: { fontFamily: currentFormatting.fontFamily, fontSize: currentFormatting.fontSize } }]
          };
          handleAddBlockToSection(p);
          setTimeout(() => {
            const el = document.querySelector(`[data-block-id="${p.id}"]`) as HTMLElement;
            if (el) el.focus();
          }, 50);
        }}
        onInsertHeading={level => {
          const h = {
            id: `h-${Date.now()}`,
            type: 'heading' as const,
            level,
            runs: [{ id: `r-${Date.now()}`, text: `Heading Level ${level}` }]
          };
          handleAddBlockToSection(h);
        }}
        onInsertTable={(rows, cols) => {
          const cells = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, (_, cIdx) => ({
              id: `cell-${Date.now()}-${Math.random()}`,
              content: [
                {
                  id: `p-${Date.now()}-${Math.random()}`,
                  type: 'paragraph' as const,
                  runs: [{ id: `r-${Date.now()}-${Math.random()}`, text: `Cell` }]
                }
              ]
            }))
          );
          const tbl: TableBlock = {
            id: `tbl-${Date.now()}`,
            type: 'table',
            rows,
            cols,
            cells
          };
          handleAddBlockToSection(tbl);
        }}
        onInsertImage={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const res = await api.uploadAsset(file);
              handleAddBlockToSection({
                id: `img-${Date.now()}`,
                type: 'image',
                src: res.url,
                alt: res.originalName
              });
            }
          };
          input.click();
        }}
        onInsertShape={shapeType => {
          handleAddBlockToSection({
            id: `shape-${Date.now()}`,
            type: 'shape',
            shapeType,
            width: 140,
            height: 70,
            labelText: `${shapeType.toUpperCase()}`
          });
        }}
        onInsertWordArt={(text, style) => {
          handleAddBlockToSection({
            id: `wa-${Date.now()}`,
            type: 'wordart',
            text,
            style,
            fontSize: 22
          });
        }}
        onInsertPageBreak={() => {
          handleAddBlockToSection({ id: `pb-${Date.now()}`, type: 'page_break' });
        }}
        onInsertHorizontalLine={() => {
          handleAddBlockToSection({ id: `hr-${Date.now()}`, type: 'horizontal_line' });
        }}
        // Layout & View
        onSetColumns={cols => {
          pushState({ ...doc, settings: { ...doc.settings, columns: cols } });
        }}
        onSetMargins={margins => {
          pushState({ ...doc, settings: { ...doc.settings, margins } });
        }}
        onToggleColumnDivider={() => {
          pushState({
            ...doc,
            settings: { ...doc.settings, columnDivider: !doc.settings.columnDivider }
          });
        }}
        zoom={zoom}
        setZoom={setZoom}
        showMarginGuides={showMarginGuides}
        setShowMarginGuides={setShowMarginGuides}
        showColumnGuides={showColumnGuides}
        setShowColumnGuides={setShowColumnGuides}
        showFormattingMarks={showFormattingMarks}
        setShowFormattingMarks={setShowFormattingMarks}
        printPreviewMode={printPreviewMode}
        setPrintPreviewMode={setPrintPreviewMode}
        onChangeOptionLayout={layout => {
          const updated = doc.sections.map(s => ({
            ...s,
            blocks: s.blocks.map(b => {
              if (b.type === 'question') {
                const qb = b as QuestionBlock;
                return { ...qb, question: { ...qb.question, optionLayout: layout } };
              }
              return b;
            })
          }));
          pushState({ ...doc, sections: updated });
        }}
        onPasteText={handlePasteText}
        onCutText={handleCutText}
        onCopyText={handleCopyText}
        onSelectAll={handleSelectAll}
      />

      {/* Main Canvas Workspace with MS Word-like inline editing */}
      <main className={`flex-1 overflow-auto flex justify-center p-6 transition-colors duration-200 ${getWorkspaceBg()}`}>
        <A4Canvas
          document={doc}
          zoom={zoom}
          showMarginGuides={showMarginGuides}
          showColumnGuides={showColumnGuides}
          showFormattingMarks={showFormattingMarks}
          isFormatPainterActive={isFormatPainterActive}
          printPreviewMode={printPreviewMode}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onMoveBlock={handleMoveBlock}
          onInsertNextParagraph={handleInsertNextParagraph}
          onFocusPreviousBlock={handleFocusPreviousBlock}
          onApplyFormatPainter={handleApplyFormatPainter}
          onEditQuestion={qb => {
            setEditingQuestion(qb.question);
            setIsQuestionBuilderOpen(true);
          }}
          onEditEquation={eq => {
            setEditingEquationBlock(eq);
            setIsEquationModalOpen(true);
          }}
          onEditHeader={() => setIsTemplateGalleryOpen(true)}
          onTextSelectionChange={fmt => setCurrentFormatting(prev => ({ ...prev, ...fmt }))}
          onAddBlankParagraph={() => {
            const p: ParagraphBlock = {
              id: `p-${Date.now()}`,
              type: 'paragraph',
              runs: [{ id: `r-${Date.now()}`, text: '', formatting: { fontFamily: currentFormatting.fontFamily, fontSize: currentFormatting.fontSize } }]
            };
            handleAddBlockToSection(p);
            setTimeout(() => {
              const el = document.querySelector(`[data-block-id="${p.id}"]`) as HTMLElement;
              if (el) el.focus();
            }, 50);
          }}
        />
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        pageCount={Math.max(1, Math.ceil(doc.sections.reduce((acc, s) => acc + s.blocks.length, 0) / 6))}
        questionCount={questionCount}
        wordCount={words}
        autosaveStatus={autosaveStatus}
        lastSavedAt={lastSavedAt}
        columns={doc.settings.columns}
        zoom={zoom}
        setZoom={setZoom}
      />

      {/* Modals */}
      <EquationEditorModal
        isOpen={isEquationModalOpen}
        initialLatex={editingEquationBlock?.rawLatex || ''}
        onClose={() => setIsEquationModalOpen(false)}
        onSave={(latex, ast) => {
          if (editingEquationBlock) {
            handleUpdateBlock(getTargetSectionId(), {
              ...editingEquationBlock,
              rawLatex: latex,
              ast
            });
          } else {
            handleAddBlockToSection({
              id: `eq-${Date.now()}`,
              type: 'equation',
              rawLatex: latex,
              ast
            });
          }
        }}
      />

      <SymbolPickerModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        onSelectSymbol={(sym, latex) => {
          handleAddBlockToSection({
            id: `p-${Date.now()}`,
            type: 'paragraph',
            runs: [{ id: `r-${Date.now()}`, text: `${sym} (${latex})` }]
          });
        }}
      />

      <PhysicsLibraryModal
        isOpen={isPhysicsModalOpen}
        onClose={() => setIsPhysicsModalOpen(false)}
        onInsertSymbol={(sym, latex, formula) => {
          if (formula) {
            handleAddBlockToSection({
              id: `eq-${Date.now()}`,
              type: 'equation',
              rawLatex: formula,
              ast: { version: '1.0', nodes: [{ id: '1', type: 'text', value: formula }] }
            });
          } else {
            handleAddBlockToSection({
              id: `p-${Date.now()}`,
              type: 'paragraph',
              runs: [{ id: `r-${Date.now()}`, text: `${sym} (${latex})` }]
            });
          }
        }}
      />

      <ChemistryLibraryModal
        isOpen={isChemistryModalOpen}
        onClose={() => setIsChemistryModalOpen(false)}
        onInsertChemistry={(formula, latex) => {
          handleAddBlockToSection({
            id: `eq-${Date.now()}`,
            type: 'equation',
            rawLatex: latex,
            ast: { version: '1.0', nodes: [{ id: '1', type: 'text', value: latex }] }
          });
        }}
      />

      <UnitsLibraryModal
        isOpen={isUnitsModalOpen}
        onClose={() => setIsUnitsModalOpen(false)}
        onInsertUnit={(sym, name) => {
          handleAddBlockToSection({
            id: `p-${Date.now()}`,
            type: 'paragraph',
            runs: [{ id: `r-${Date.now()}`, text: `${name} [${sym}]` }]
          });
        }}
      />

      <ConstantsLibraryModal
        isOpen={isConstantsModalOpen}
        onClose={() => setIsConstantsModalOpen(false)}
        onInsertConstant={(sym, latex, val, unit) => {
          handleAddBlockToSection({
            id: `eq-${Date.now()}`,
            type: 'equation',
            rawLatex: `${sym} = ${val} \\text{ ${unit}}`,
            ast: { version: '1.0', nodes: [] }
          });
        }}
      />

      <QuestionBuilderModal
        isOpen={isQuestionBuilderOpen}
        initialQuestion={editingQuestion}
        onClose={() => setIsQuestionBuilderOpen(false)}
        onSave={q => {
          const qBlock: QuestionBlock = {
            id: `qblk-${q.id}`,
            type: 'question',
            question: q
          };
          if (editingQuestion?.id) {
            handleUpdateBlock(getTargetSectionId(), qBlock);
          } else {
            handleAddBlockToSection(qBlock);
          }
        }}
      />

      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onInsertQuestion={q => {
          const qBlock: QuestionBlock = {
            id: `qblk-${q.id}-${Date.now()}`,
            type: 'question',
            question: q
          };
          handleAddBlockToSection(qBlock);
        }}
      />

      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={tpl => {
          pushState({
            ...doc,
            templateId: tpl.id,
            settings: tpl.settings,
            metadata: { ...doc.metadata, ...tpl.defaultMetadata }
          });
        }}
      />

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
      />

    </div>
  );
};
