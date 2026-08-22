import {
  Document as DocxDocument,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  Packer,
  convertMillimetersToTwip,
  ImageRun
} from 'docx';
import { DocumentModel, DocumentBlock, QuestionBlock, TableBlock, TextRun as SharedTextRun } from '@eduforge/shared';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../../../../uploads');

export class DocxExportService {
  public static async generateDocx(docModel: DocumentModel): Promise<Buffer> {
    const margins = docModel.settings.margins || { top: 15, bottom: 15, left: 15, right: 15 };
    const isTwoColumn = docModel.settings.columns === 2;

    const children: (Paragraph | Table)[] = [];

    // Header & Title Box
    if (docModel.metadata.instituteName) {
      children.push(
        new Paragraph({
          text: docModel.metadata.instituteName.toUpperCase(),
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 120 }
        })
      );
    }

    if (docModel.metadata.examName) {
      children.push(
        new Paragraph({
          text: docModel.metadata.examName,
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 160 }
        })
      );
    }

    // Exam Meta Details (Subject, Time, Max Marks)
    const metaTableCells: TableCell[] = [];
    if (docModel.metadata.subject) {
      metaTableCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `Subject: `, bold: true }), new TextRun(docModel.metadata.subject)] })],
          width: { size: 33, type: WidthType.PERCENTAGE }
        })
      );
    }
    if (docModel.metadata.timeAllowedMinutes) {
      metaTableCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `Time: `, bold: true }), new TextRun(`${docModel.metadata.timeAllowedMinutes} Mins`)] })],
          width: { size: 33, type: WidthType.PERCENTAGE }
        })
      );
    }
    if (docModel.metadata.maxMarks) {
      metaTableCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `Max Marks: `, bold: true }), new TextRun(`${docModel.metadata.maxMarks}`)] })],
          width: { size: 34, type: WidthType.PERCENTAGE }
        })
      );
    }

    if (metaTableCells.length > 0) {
      children.push(
        new Table({
          rows: [new TableRow({ children: metaTableCells })],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          }
        })
      );
      children.push(new Paragraph({ spacing: { after: 160 } }));
    }

    // General Instructions
    if (docModel.metadata.generalInstructions && docModel.metadata.generalInstructions.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'General Instructions:', bold: true, underline: {} })],
          spacing: { before: 100, after: 60 }
        })
      );
      docModel.metadata.generalInstructions.forEach((inst: string, idx: number) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${idx + 1}. ${inst}`, size: 19 })],
            spacing: { after: 40 }
          })
        );
      });
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }

    // Process Sections
    for (const section of docModel.sections) {
      // Section Header
      const sectionText = section.marks ? `${section.title.toUpperCase()}  (${section.marks} Marks)` : section.title.toUpperCase();
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sectionText,
              bold: true,
              size: 24,
              color: '1E293B'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 80 }
        })
      );

      if (section.instructions) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: section.instructions, italics: true, size: 19, color: '475569' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 }
          })
        );
      }

      // Section Blocks
      for (const block of section.blocks) {
        DocxExportService.convertBlockToDocx(block, children);
      }
    }

    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertMillimetersToTwip(margins.top),
                bottom: convertMillimetersToTwip(margins.bottom),
                left: convertMillimetersToTwip(margins.left),
                right: convertMillimetersToTwip(margins.right)
              }
            },
            column: isTwoColumn
              ? {
                  count: 2,
                  space: convertMillimetersToTwip(docModel.settings.columnGap || 8),
                  separate: docModel.settings.columnDivider || false
                }
              : undefined
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: docModel.title, size: 16, color: '94A3B8' })],
                  alignment: AlignmentType.RIGHT
                })
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Page ' }),
                    new TextRun({ children: [PageNumber.CURRENT] }),
                    new TextRun({ text: ' of ' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES] })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ]
            })
          },
          children
        }
      ]
    });

    return await Packer.toBuffer(doc);
  }

  private static convertBlockToDocx(block: DocumentBlock, container: (Paragraph | Table)[]) {
    switch (block.type) {
      case 'paragraph': {
        const runs = block.runs.map((r: SharedTextRun) => DocxExportService.convertRun(r));
        container.push(
          new Paragraph({
            children: runs,
            spacing: { after: 100 },
            alignment: DocxExportService.convertAlignment(block.alignment)
          })
        );
        break;
      }

      case 'heading': {
        const runs = block.runs.map((r: SharedTextRun) => DocxExportService.convertRun(r));
        container.push(
          new Paragraph({
            children: runs,
            heading: block.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 }
          })
        );
        break;
      }

      case 'equation': {
        container.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.rawLatex,
                font: 'Cambria Math',
                italics: true,
                bold: true
              })
            ],
            alignment: DocxExportService.convertAlignment(block.alignment || 'center'),
            spacing: { before: 80, after: 80 }
          })
        );
        break;
      }

      case 'question': {
        DocxExportService.convertQuestionBlock(block as QuestionBlock, container);
        break;
      }

      case 'table': {
        DocxExportService.convertTableBlock(block as TableBlock, container);
        break;
      }

      case 'image': {
        try {
          const filename = path.basename(block.src);
          const fullPath = path.join(uploadsDir, filename);
          if (fs.existsSync(fullPath)) {
            const imgBuffer = fs.readFileSync(fullPath);
            container.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgBuffer,
                    transformation: {
                      width: Math.min(block.width || 300, 450),
                      height: Math.min(block.height || 200, 300)
                    },
                    type: 'png'
                  })
                ],
                alignment: DocxExportService.convertAlignment(block.alignment || 'center'),
                spacing: { after: 120 }
              })
            );
          }
        } catch {
          // ignore missing image
        }
        break;
      }

      case 'wordart': {
        container.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `« ${block.text} »`,
                bold: true,
                size: 28,
                color: '6366F1'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 }
          })
        );
        break;
      }

      case 'shape': {
        container.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[ Shape: ${block.shapeType.toUpperCase()}${block.labelText ? ' - ' + block.labelText : ''} ]`,
                italics: true,
                color: '64748B'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 }
          })
        );
        break;
      }
    }
  }

  private static convertQuestionBlock(block: QuestionBlock, container: (Paragraph | Table)[]) {
    const q = block.question;
    const qNum = q.questionNumber ? `${q.questionNumber}. ` : '';
    const qText = q.rawText || '';
    const marksText = q.marks ? ` [${q.marks} Mark${q.marks > 1 ? 's' : ''}${q.negativeMarks ? `, -${q.negativeMarks}` : ''}]` : '';

    const runs: TextRun[] = [
      new TextRun({ text: qNum, bold: true, size: 21 }),
      new TextRun({ text: qText, size: 21 }),
      new TextRun({ text: marksText, bold: true, color: '2563EB', size: 19 })
    ];

    container.push(
      new Paragraph({
        children: runs,
        spacing: { before: 140, after: 60 }
      })
    );

    // Option layout
    if (q.options && q.options.length > 0) {
      if (q.optionLayout === 'grid_2x2' && q.options.length === 4) {
        // Render 2x2 Word Table for clean grid
        const row1 = new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `(a)  ${q.options[0].rawText || ''}`, size: 20 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `(b)  ${q.options[1].rawText || ''}`, size: 20 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            })
          ]
        });
        const row2 = new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `(c)  ${q.options[2].rawText || ''}`, size: 20 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `(d)  ${q.options[3].rawText || ''}`, size: 20 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            })
          ]
        });

        container.push(
          new Table({
            rows: [row1, row2],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            }
          })
        );
      } else {
        // Vertical stack
        q.options.forEach((opt: any, idx: number) => {
          const optKey = opt.key ? `(${opt.key}) ` : `(${String.fromCharCode(97 + idx)}) `;
          container.push(
            new Paragraph({
              children: [
                new TextRun({ text: optKey, bold: true, size: 20 }),
                new TextRun({ text: opt.rawText || '', size: 20 })
              ],
              indent: { left: 360 },
              spacing: { after: 40 }
            })
          );
        });
      }
    }

    container.push(new Paragraph({ spacing: { after: 80 } }));
  }

  private static convertTableBlock(block: TableBlock, container: (Paragraph | Table)[]) {
    const rows: TableRow[] = [];
    for (const r of block.cells) {
      const cells: TableCell[] = [];
      for (const c of r) {
        const cellParas: Paragraph[] = [];
        for (const b of c.content) {
          DocxExportService.convertBlockToDocx(b, cellParas);
        }
        if (cellParas.length === 0) {
          cellParas.push(new Paragraph({ text: '' }));
        }
        cells.push(
          new TableCell({
            children: cellParas,
            columnSpan: c.colSpan,
            rowSpan: c.rowSpan
          })
        );
      }
      rows.push(new TableRow({ children: cells }));
    }

    container.push(
      new Table({
        rows,
        width: { size: block.widthPercent || 100, type: WidthType.PERCENTAGE }
      })
    );
    container.push(new Paragraph({ spacing: { after: 120 } }));
  }

  private static convertRun(run: SharedTextRun): TextRun {
    const fmt = run.formatting || {};
    return new TextRun({
      text: run.text,
      bold: fmt.bold,
      italics: fmt.italic,
      underline: fmt.underline ? {} : undefined,
      strike: fmt.strikethrough,
      subScript: fmt.subscript,
      superScript: fmt.superscript,
      color: fmt.color ? fmt.color.replace('#', '') : undefined,
      size: fmt.fontSize ? Math.round(fmt.fontSize * 2) : 21,
      font: fmt.fontFamily || 'Inter'
    });
  }

  private static convertAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
    switch (align) {
      case 'center': return AlignmentType.CENTER;
      case 'right': return AlignmentType.RIGHT;
      case 'justify': return AlignmentType.JUSTIFIED;
      default: return AlignmentType.LEFT;
    }
  }
}
