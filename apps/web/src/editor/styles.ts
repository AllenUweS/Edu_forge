import { TextFormatting, Alignment } from '@eduforge/shared';

export interface DocumentStylePreset {
  id: string;
  name: string;
  previewLabel: string;
  description: string;
  blockType: 'paragraph' | 'heading';
  headingLevel?: 1 | 2 | 3;
  formatting: TextFormatting;
  alignment?: Alignment;
  lineSpacing?: number;
  indent?: number;
  backgroundColor?: string;
  border?: 'none' | 'box' | 'bottom' | 'top' | 'left' | 'all';
  previewStyle: React.CSSProperties;
}

export const DOCUMENT_STYLES: DocumentStylePreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    previewLabel: 'Normal',
    description: 'Standard body text',
    blockType: 'paragraph',
    formatting: {
      fontSize: 10.5,
      bold: false,
      italic: false,
      color: '#0f172a'
    },
    lineSpacing: 1.15,
    alignment: 'left',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '13px',
      color: '#0f172a'
    }
  },
  {
    id: 'no-spacing',
    name: 'No Spacing',
    previewLabel: 'No Spacing',
    description: 'Compact single-spaced text',
    blockType: 'paragraph',
    formatting: {
      fontSize: 10,
      bold: false,
      italic: false,
      color: '#0f172a'
    },
    lineSpacing: 1.0,
    alignment: 'left',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '12px',
      color: '#0f172a'
    }
  },
  {
    id: 'heading-1',
    name: 'Heading 1',
    previewLabel: 'Heading 1',
    description: 'Main section heading',
    blockType: 'heading',
    headingLevel: 1,
    formatting: {
      fontSize: 16,
      bold: true,
      color: '#0369a1' // sky-700
    },
    alignment: 'left',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#0369a1'
    }
  },
  {
    id: 'heading-2',
    name: 'Heading 2',
    previewLabel: 'Heading 2',
    description: 'Subsection heading',
    blockType: 'heading',
    headingLevel: 2,
    formatting: {
      fontSize: 13,
      bold: true,
      color: '#0284c7' // sky-600
    },
    alignment: 'left',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#0284c7'
    }
  },
  {
    id: 'heading-3',
    name: 'Heading 3',
    previewLabel: 'Heading 3',
    description: 'Sub-subsection heading',
    blockType: 'heading',
    headingLevel: 3,
    formatting: {
      fontSize: 11,
      bold: true,
      italic: true,
      color: '#334155'
    },
    alignment: 'left',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: '#334155'
    }
  },
  {
    id: 'title',
    name: 'Title',
    previewLabel: 'Title',
    description: 'Large document main title',
    blockType: 'heading',
    headingLevel: 1,
    formatting: {
      fontSize: 22,
      bold: true,
      color: '#0f172a',
      letterSpacing: -0.5
    },
    alignment: 'center',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '17px',
      fontWeight: '900',
      color: '#0f172a'
    }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    previewLabel: 'Subtitle',
    description: 'Secondary subtitle text',
    blockType: 'paragraph',
    formatting: {
      fontSize: 12,
      bold: false,
      italic: false,
      color: '#64748b' // slate-500
    },
    alignment: 'center',
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '12px',
      color: '#64748b'
    }
  },
  {
    id: 'subtle-emphasis',
    name: 'Subtle Emphasis',
    previewLabel: 'Subtle Emphasis',
    description: 'Subtle italic text in slate',
    blockType: 'paragraph',
    formatting: {
      fontSize: 10.5,
      italic: true,
      color: '#64748b'
    },
    previewStyle: {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#64748b'
    }
  },
  {
    id: 'emphasis',
    name: 'Emphasis',
    previewLabel: 'Emphasis',
    description: 'Strong italic text',
    blockType: 'paragraph',
    formatting: {
      fontSize: 10.5,
      bold: true,
      italic: true,
      color: '#0f172a'
    },
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: '#0f172a'
    }
  },
  {
    id: 'intense-emphasis',
    name: 'Intense Emphasis',
    previewLabel: 'Intense Emphasis',
    description: 'Colored bold emphasis',
    blockType: 'paragraph',
    formatting: {
      fontSize: 10.5,
      bold: true,
      italic: true,
      color: '#0284c7'
    },
    previewStyle: {
      fontFamily: 'Calibri, Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#0284c7'
    }
  },
  {
    id: 'quote',
    name: 'Quote',
    previewLabel: '“ Quote ”',
    description: 'Indented block quote with border',
    blockType: 'paragraph',
    formatting: {
      fontSize: 11,
      italic: true,
      color: '#334155'
    },
    indent: 20,
    border: 'left',
    previewStyle: {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#334155',
      borderLeft: '2px solid #0284c7',
      paddingLeft: '4px'
    }
  },
  {
    id: 'intense-quote',
    name: 'Intense Quote',
    previewLabel: 'Intense Quote',
    description: 'Centered quote with top and bottom borders',
    blockType: 'paragraph',
    formatting: {
      fontSize: 11.5,
      italic: true,
      bold: true,
      color: '#0284c7'
    },
    alignment: 'center',
    border: 'all',
    previewStyle: {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      fontStyle: 'italic',
      fontWeight: 'bold',
      color: '#0284c7',
      borderTop: '1px solid #bae6fd',
      borderBottom: '1px solid #bae6fd'
    }
  },
  {
    id: 'code-block',
    name: 'Code / Formula',
    previewLabel: '< Code />',
    description: 'Monospace code block',
    blockType: 'paragraph',
    formatting: {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 9.5,
      color: '#0f172a',
      backgroundColor: '#f1f5f9'
    },
    indent: 10,
    border: 'box',
    previewStyle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      color: '#0f172a',
      backgroundColor: '#f1f5f9',
      padding: '2px 4px',
      borderRadius: '2px'
    }
  }
];
