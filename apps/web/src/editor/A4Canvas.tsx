import React from 'react';
import { DocumentModel, DocumentBlock, QuestionBlock, EquationBlock, Question } from '@eduforge/shared';
import { paginateDocument, PageLayout } from './PaginationEngine.js';
import { BlockRenderer } from './BlockRenderer.js';
import { PaperHeader } from '../paper/PaperHeader.js';
import { FormattingState } from './EditorRibbon.js';

interface A4CanvasProps {
  document: DocumentModel;
  zoom?: number; // 50 to 200
  showMarginGuides?: boolean;
  showColumnGuides?: boolean;
  showFormattingMarks?: boolean;
  isFormatPainterActive?: boolean;
  printPreviewMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onUpdateBlock?: (sectionId: string, block: DocumentBlock) => void;
  onDeleteBlock?: (sectionId: string, blockId: string) => void;
  onDuplicateBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (sectionId: string, blockId: string, direction: 'up' | 'down') => void;
  onInsertNextParagraph?: (currentBlockId: string) => void;
  onFocusPreviousBlock?: (currentBlockId: string) => void;
  onApplyFormatPainter?: (targetBlock: DocumentBlock) => void;
  onEditQuestion?: (question: QuestionBlock) => void;
  onEditEquation?: (eq: EquationBlock) => void;
  onEditHeader?: () => void;
  onUpdateMetadata?: (metadata: DocumentModel['metadata']) => void;
  onTextSelectionChange?: (formatting: Partial<FormattingState>) => void;
  onAddBlankParagraph?: () => void;
  onDropQuestion?: (question: Question, targetBlockId?: string) => void;
  onDropItemOnSection?: (sectionId: string, item: any) => void;
}

export const A4Canvas: React.FC<A4CanvasProps> = ({
  document: doc,
  zoom = 100,
  showMarginGuides = false,
  showColumnGuides = false,
  showFormattingMarks = false,
  isFormatPainterActive = false,
  printPreviewMode = false,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onInsertNextParagraph,
  onFocusPreviousBlock,
  onApplyFormatPainter,
  onEditQuestion,
  onEditEquation,
  onEditHeader,
  onUpdateMetadata,
  onTextSelectionChange,
  onAddBlankParagraph,
  onDropQuestion,
  onDropItemOnSection
}) => {
  const pages: PageLayout[] = React.useMemo(() => paginateDocument(doc), [doc]);
  const isTwoColumn = doc.settings.columns === 2;
  const margins = doc.settings.margins || { top: 15, bottom: 15, left: 15, right: 15 };

  // Convert mm to CSS px (1mm = 3.7795px)
  const topPx = Math.round(margins.top * 3.7795);
  const bottomPx = Math.round(margins.bottom * 3.7795);
  const leftPx = Math.round(margins.left * 3.7795);
  const rightPx = Math.round(margins.right * 3.7795);
  const gapPx = Math.round((doc.settings.columnGap || 8) * 3.7795);

  const handleContainerDrop = (e: React.DragEvent, targetBlockId?: string) => {
    e.preventDefault();
    try {
      const eduforgeData = e.dataTransfer.getData('application/eduforge-item');
      if (eduforgeData) {
        const item = JSON.parse(eduforgeData);
        if (item.category === 'questions' && item.questionData && onDropQuestion) {
          onDropQuestion(item.questionData, targetBlockId);
          return;
        } else if (onDropItemOnSection) {
          const targetSecId = doc.sections[0]?.id || 'sec-0';
          onDropItemOnSection(targetSecId, item);
          return;
        }
      }

      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'question' && parsed.data && onDropQuestion) {
          onDropQuestion(parsed.data, targetBlockId);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped item:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8 w-full select-text">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          style={{
            width: '794px',
            minHeight: '1123px',
            height: '1123px',
            paddingTop: `${topPx}px`,
            paddingBottom: `${bottomPx}px`,
            paddingLeft: `${leftPx}px`,
            paddingRight: `${rightPx}px`,
            fontFamily: doc.settings.defaultFont || 'Inter',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom !== 100 ? `${1123 * (zoom / 100 - 1)}px` : undefined
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => handleContainerDrop(e)}
          onClick={(e) => {
            // If user clicks on the empty page area, create/focus a new paragraph
            if (e.target === e.currentTarget && onAddBlankParagraph) {
              onAddBlankParagraph();
            }
          }}
          className={`page-sheet relative bg-white text-slate-900 shadow-page rounded-xs flex flex-col justify-between overflow-hidden transition-all ${
            printPreviewMode ? 'border-none' : 'border border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Margin Guides (Overlay) */}
          {showMarginGuides && !printPreviewMode && (
            <div
              style={{
                top: `${topPx}px`,
                bottom: `${bottomPx}px`,
                left: `${leftPx}px`,
                right: `${rightPx}px`
              }}
              className="absolute pointer-events-none border border-dashed border-sky-400/40 z-30"
            />
          )}

          {/* Page Top Area */}
          <div className="w-full flex-1 flex flex-col">
            {/* Header (First page only) */}
            {page.isFirstPage && (
              <PaperHeader
                metadata={doc.metadata}
                onEditMetadata={onEditHeader}
                onUpdateMetadata={onUpdateMetadata}
              />
            )}

            {/* Columns Content Container */}
            <div
              style={{ gap: `${gapPx}px` }}
              className={`flex-1 ${
                isTwoColumn ? 'grid grid-cols-2 relative' : 'flex flex-col'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => handleContainerDrop(e)}
              onClick={(e) => {
                if (e.target === e.currentTarget && onAddBlankParagraph) {
                  onAddBlankParagraph();
                }
              }}
            >
              {/* Column divider line */}
              {isTwoColumn && (doc.settings.columnDivider || showColumnGuides) && (
                <div
                  style={{ left: '50%' }}
                  className={`absolute top-0 bottom-0 w-px ${
                    doc.settings.columnDivider ? 'bg-slate-300' : 'bg-dashed bg-sky-300/60'
                  } -translate-x-1/2 pointer-events-none`}
                />
              )}

              {/* Render Columns */}
              {page.columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="flex flex-col gap-1 min-w-0 flex-1"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => handleContainerDrop(e)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget && onAddBlankParagraph) {
                      onAddBlankParagraph();
                    }
                  }}
                >
                  {col.blocks.map((item, bIdx) => (
                    <div
                      key={item.block.id || bIdx}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleContainerDrop(e, item.block.id);
                      }}
                    >
                      <BlockRenderer
                        block={item.block}
                        sectionId={item.sectionId}
                        isSelected={selectedBlockId === item.block.id}
                        isFormatPainterActive={isFormatPainterActive}
                        showFormattingMarks={showFormattingMarks}
                        onSelect={() => onSelectBlock && onSelectBlock(item.block.id)}
                        onUpdateBlock={updated => onUpdateBlock && onUpdateBlock(item.sectionId, updated)}
                        onDeleteBlock={() => onDeleteBlock && onDeleteBlock(item.sectionId, item.block.id)}
                        onDuplicateBlock={() => onDuplicateBlock && onDuplicateBlock(item.sectionId, item.block.id)}
                        onMoveUp={() => onMoveBlock && onMoveBlock(item.sectionId, item.block.id, 'up')}
                        onMoveDown={() => onMoveBlock && onMoveBlock(item.sectionId, item.block.id, 'down')}
                        onInsertNextParagraph={onInsertNextParagraph}
                        onFocusPreviousBlock={onFocusPreviousBlock}
                        onApplyFormatPainter={onApplyFormatPainter}
                        onEditQuestion={q => onEditQuestion && onEditQuestion(q)}
                        onEditEquation={eq => onEditEquation && onEditEquation(eq)}
                        onTextSelectionChange={onTextSelectionChange}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Page Footer */}
          {doc.settings.showPageNumbers && (
            <div className="w-full pt-3 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[9pt] text-slate-500 font-mono select-none">
              <span>{doc.title}</span>
              <span>
                Page {page.pageNumber} of {pages.length}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
