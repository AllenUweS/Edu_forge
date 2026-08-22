import { DocumentModel, DocumentBlock, QuestionBlock, TextRun } from '@eduforge/shared';

export class PdfExportService {
  public static generatePrintableHtml(docModel: DocumentModel): string {
    const isTwoColumn = docModel.settings.columns === 2;
    const margins = docModel.settings.margins || { top: 15, bottom: 15, left: 15, right: 15 };

    let sectionsHtml = '';

    for (const section of docModel.sections) {
      let blocksHtml = '';
      for (const block of section.blocks) {
        blocksHtml += PdfExportService.renderBlockToHtml(block);
      }

      sectionsHtml += `
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">${PdfExportService.escapeHtml(section.title)}${section.marks ? ` <span class="section-marks">(${section.marks} Marks)</span>` : ''}</h2>
            ${section.instructions ? `<p class="section-instructions">${PdfExportService.escapeHtml(section.instructions)}</p>` : ''}
          </div>
          <div class="section-content ${isTwoColumn ? 'two-columns' : 'single-column'}">
            ${blocksHtml}
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${PdfExportService.escapeHtml(docModel.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    @page {
      size: A4 portrait;
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-family: ${docModel.settings.defaultFont || 'Inter'}, sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${docModel.settings.defaultFont || 'Inter'}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${docModel.settings.defaultFontSize || 10.5}pt;
      line-height: ${docModel.settings.lineSpacing || 1.25};
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .paper-header {
      border: 2px solid #334155;
      padding: 12px 16px;
      margin-bottom: 16px;
      text-align: center;
      background: #f8fafc;
    }

    .institute-name {
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .exam-name {
      font-size: 12pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 0;
      margin-bottom: 8px;
      font-size: 10pt;
      font-weight: 600;
    }

    .instructions-box {
      text-align: left;
      font-size: 9pt;
      color: #334155;
    }

    .instructions-title {
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 3px;
    }

    .instructions-list {
      padding-left: 16px;
    }

    .section-container {
      margin-bottom: 20px;
    }

    .section-header {
      text-align: center;
      margin: 16px 0 10px 0;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .section-marks {
      font-size: 10.5pt;
      color: #2563eb;
      font-weight: 700;
    }

    .section-instructions {
      font-size: 9.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 2px;
    }

    .two-columns {
      column-count: 2;
      column-gap: ${docModel.settings.columnGap || 8}mm;
      ${docModel.settings.columnDivider ? 'column-rule: 1px solid #cbd5e1;' : ''}
    }

    .single-column {
      column-count: 1;
    }

    .question-block {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: ${docModel.settings.questionSpacing || 12}px;
      font-size: ${docModel.settings.defaultFontSize || 10.5}pt;
    }

    .question-head {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 6px;
    }

    .question-num {
      font-weight: 700;
      min-width: 20px;
    }

    .question-text {
      flex: 1;
    }

    .question-marks {
      font-weight: 700;
      font-size: 9pt;
      color: #2563eb;
      white-space: nowrap;
      margin-left: 4px;
    }

    .options-grid-2x2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
      margin-top: 4px;
      padding-left: 20px;
    }

    .options-vertical {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
      padding-left: 20px;
    }

    .option-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .option-key {
      font-weight: 700;
    }

    .equation-block {
      text-align: center;
      margin: 8px 0;
      font-size: 11pt;
    }

    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }

    table.doc-table td, table.doc-table th {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
    }

    .wordart-banner {
      text-align: center;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 6px;
      margin: 8px 0;
      background: #f1f5f9;
      border: 1.5px dashed #6366f1;
      color: #4338ca;
    }
  </style>
</head>
<body>

  <header class="paper-header">
    ${docModel.metadata.instituteName ? `<div class="institute-name">${PdfExportService.escapeHtml(docModel.metadata.instituteName)}</div>` : ''}
    ${docModel.metadata.examName ? `<div class="exam-name">${PdfExportService.escapeHtml(docModel.metadata.examName)}</div>` : ''}
    <div class="meta-row">
      <span><strong>Subject:</strong> ${PdfExportService.escapeHtml(docModel.metadata.subject || 'Physics')}</span>
      <span><strong>Time Allowed:</strong> ${docModel.metadata.timeAllowedMinutes || 180} Mins</span>
      <span><strong>Max Marks:</strong> ${docModel.metadata.maxMarks || 100}</span>
    </div>
    ${
      docModel.metadata.generalInstructions && docModel.metadata.generalInstructions.length > 0
        ? `
      <div class="instructions-box">
        <div class="instructions-title">General Instructions:</div>
        <ol class="instructions-list">
          ${docModel.metadata.generalInstructions.map((i: string) => `<li>${PdfExportService.escapeHtml(i)}</li>`).join('')}
        </ol>
      </div>
    `
        : ''
    }
  </header>

  <main>
    ${sectionsHtml}
  </main>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });
      }
    });
  </script>
</body>
</html>`;
  }

  private static renderBlockToHtml(block: DocumentBlock): string {
    switch (block.type) {
      case 'paragraph': {
        const runs = block.runs
          .map((r: TextRun) => {
            let t = PdfExportService.escapeHtml(r.text);
            const f = r.formatting || {};
            if (f.bold) t = `<strong>${t}</strong>`;
            if (f.italic) t = `<em>${t}</em>`;
            if (f.underline) t = `<u>${t}</u>`;
            if (f.strikethrough) t = `<del>${t}</del>`;
            if (f.superscript) t = `<sup>${t}</sup>`;
            if (f.subscript) t = `<sub>${t}</sub>`;
            return t;
          })
          .join('');
        return `<p style="margin-bottom: 6px; text-align: ${block.alignment || 'left'};">${runs}</p>`;
      }

      case 'heading': {
        const text = block.runs.map((r: TextRun) => r.text).join('');
        return `<h${block.level} style="margin: 8px 0; text-align: ${block.alignment || 'left'};">${PdfExportService.escapeHtml(text)}</h${block.level}>`;
      }

      case 'equation': {
        return `<div class="equation-block">$$${block.rawLatex}$$</div>`;
      }

      case 'question': {
        const qb = block as QuestionBlock;
        const q = qb.question;
        const num = q.questionNumber ? `${q.questionNumber}.` : '';
        const marks = q.marks ? `[${q.marks}${q.negativeMarks ? `, -${q.negativeMarks}` : ''}]` : '';

        let optionsHtml = '';
        if (q.options && q.options.length > 0) {
          const isGrid = q.optionLayout === 'grid_2x2' && q.options.length === 4;
          const optItems = q.options
            .map(
              (o: any, idx: number) => `
            <div class="option-item">
              <span class="option-key">(${o.key || String.fromCharCode(97 + idx)})</span>
              <span class="option-text">${o.rawText ? (o.rawText.startsWith('\\') || o.rawText.includes('\\frac') ? `$${o.rawText}$` : PdfExportService.escapeHtml(o.rawText)) : ''}</span>
            </div>
          `
            )
            .join('');

          optionsHtml = `<div class="${isGrid ? 'options-grid-2x2' : 'options-vertical'}">${optItems}</div>`;
        }

        return `
          <div class="question-block">
            <div class="question-head">
              <span class="question-num">${num}</span>
              <span class="question-text">${PdfExportService.escapeHtml(q.rawText || '')}</span>
              ${marks ? `<span class="question-marks">${marks}</span>` : ''}
            </div>
            ${optionsHtml}
          </div>
        `;
      }

      case 'wordart': {
        return `<div class="wordart-banner">${PdfExportService.escapeHtml(block.text)}</div>`;
      }

      case 'image': {
        return `<div style="text-align: ${block.alignment || 'center'}; margin: 8px 0;"><img src="${block.src}" alt="${block.alt || ''}" style="max-width: 100%; height: auto;" /></div>`;
      }

      default:
        return '';
    }
  }

  private static escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
