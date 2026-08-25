import { describe, it, expect } from 'vitest';
import { Question, DocumentModel, EquationBlock, ParagraphBlock } from '@eduforge/shared';

describe('MathType Separate Numerator & Denominator Construction', () => {
  const constructFraction = (num: string, den: string, type: 'standard' | 'derivative' | 'partial' | 'slash') => {
    const n = num.trim() || 'a';
    const d = den.trim() || 'b';
    if (type === 'derivative') return `\\frac{d (${n})}{d (${d})}`;
    if (type === 'partial') return `\\frac{\\partial (${n})}{\\partial (${d})}`;
    if (type === 'slash') return `(${n}) / (${d})`;
    return `\\frac{${n}}{${d}}`;
  };

  it('builds standard fraction with complex numerator and denominator', () => {
    const frac = constructFraction('u^2 \\sin 2\\theta', '2g', 'standard');
    expect(frac).toBe('\\frac{u^2 \\sin 2\\theta}{2g}');
  });

  it('builds derivative fraction', () => {
    const frac = constructFraction('x^3 + 3x', 't', 'derivative');
    expect(frac).toBe('\\frac{d (x^3 + 3x)}{d (t)}');
  });

  it('builds partial derivative fraction', () => {
    const frac = constructFraction('\\psi(x,t)', 'x', 'partial');
    expect(frac).toBe('\\frac{\\partial (\\psi(x,t))}{\\partial (x)}');
  });

  it('builds inline slash fraction', () => {
    const frac = constructFraction('a + b', 'c + d', 'slash');
    expect(frac).toBe('(a + b) / (c + d)');
  });
});

describe('Diagram Studio SVG Structure & Question Attachment', () => {
  it('creates valid SVG diagram markup for circuits and optics', () => {
    const sampleCircuitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320">
      <rect x="80" y="110" width="120" height="40" stroke="#0284c7" stroke-width="2" fill="none"/>
      <text x="140" y="135" font-size="13">R_1 = 6 \u03A9</text>
    </svg>`;

    expect(sampleCircuitSvg).toContain('<svg');
    expect(sampleCircuitSvg).toContain('viewBox="0 0 600 320"');
    expect(sampleCircuitSvg).toContain('R_1 = 6');

    const questionWithDiagram: Question = {
      id: 'q-stem-1',
      questionNumber: 1,
      questionType: 'MCQ_SINGLE',
      rawText: 'Find equivalent resistance across terminals A and B.',
      content: [{ id: 'p-1', type: 'paragraph', runs: [{ id: 'r-1', text: 'Find equivalent resistance...' }] }],
      options: [
        { id: 'opt-a', key: 'a', rawText: '4 \u03A9', content: [], isCorrect: true },
        { id: 'opt-b', key: 'b', rawText: '8 \u03A9', content: [], isCorrect: false }
      ],
      correctAnswer: 'a',
      marks: 4,
      negativeMarks: 1,
      subject: 'Physics',
      chapter: 'Current Electricity',
      topic: 'Resistor Networks',
      difficulty: 'Medium',
      diagramSvg: sampleCircuitSvg,
      tags: ['circuits', 'resistors'],
      optionLayout: 'grid_2x2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(questionWithDiagram.diagramSvg).toBeDefined();
    expect(questionWithDiagram.diagramSvg).toContain('<svg');
  });
});

describe('Science Library Drag & Drop Payload Processing', () => {
  it('correctly processes dropped physics formula payload into EquationBlock', () => {
    const payload = {
      category: 'physics',
      type: 'formula',
      latex: 'F = \\frac{G m_1 m_2}{r^2}',
      name: 'Gravitational Force'
    };

    const serialized = JSON.stringify(payload);
    const parsed = JSON.parse(serialized);

    expect(parsed.type).toBe('formula');
    expect(parsed.category).toBe('physics');
    expect(parsed.latex).toBe('F = \\frac{G m_1 m_2}{r^2}');

    const newBlock: EquationBlock = {
      id: `eq-${Date.now()}`,
      type: 'equation',
      rawLatex: parsed.latex
    };

    expect(newBlock.type).toBe('equation');
    expect(newBlock.rawLatex).toContain('\\frac{G m_1 m_2}{r^2}');
  });

  it('correctly processes dropped chemistry reaction payload', () => {
    const payload = {
      category: 'chemistry',
      type: 'reaction',
      latex: 'N_2 + 3H_2 \\rightleftharpoons 2NH_3',
      name: 'Haber Process'
    };

    const serialized = JSON.stringify(payload);
    const parsed = JSON.parse(serialized);

    expect(parsed.type).toBe('reaction');
    expect(parsed.latex).toContain('\\rightleftharpoons');
  });

  it('correctly processes dropped question payload into Question block', () => {
    const payload = {
      category: 'questions',
      type: 'question',
      questionData: {
        id: 'q-dropped-1',
        questionNumber: 5,
        rawText: 'Calculate the de Broglie wavelength of an electron.',
        marks: 4,
        difficulty: 'Medium'
      }
    };

    const serialized = JSON.stringify(payload);
    const parsed = JSON.parse(serialized);

    expect(parsed.category).toBe('questions');
    expect(parsed.questionData.rawText).toContain('de Broglie');
  });
});

describe('Question and Option Local Image Attachment Support', () => {
  it('supports attaching local image URL to question statement', () => {
    const qWithImage: Question = {
      id: 'q-img-1',
      questionNumber: 1,
      questionType: 'MCQ_SINGLE',
      rawText: 'Identify the logic gate represented in the diagram below:',
      imageUrl: '/api/assets/logic_gate_nand.png',
      content: [],
      options: [
        { id: 'o-1', key: 'a', rawText: 'NAND Gate', isCorrect: true, content: [] },
        { id: 'o-2', key: 'b', rawText: 'NOR Gate', isCorrect: false, content: [] }
      ],
      correctAnswer: 'a',
      marks: 4,
      difficulty: 'Easy',
      tags: ['digital-electronics', 'logic-gates'],
      optionLayout: 'grid_2x2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(qWithImage.imageUrl).toBe('/api/assets/logic_gate_nand.png');
    expect(qWithImage.options.length).toBe(2);
  });

  it('supports attaching local image URLs to individual multiple choice options', () => {
    const qWithOptionsImages: Question = {
      id: 'q-img-options-1',
      questionNumber: 2,
      questionType: 'MCQ_SINGLE',
      rawText: 'Which of the following V-I graphs represents an Ohmic conductor?',
      content: [],
      options: [
        { id: 'o-1', key: 'a', rawText: 'Linear Graph', imageUrl: '/api/assets/vi_linear.png', isCorrect: true, content: [] },
        { id: 'o-2', key: 'b', rawText: 'Non-linear Diode', imageUrl: '/api/assets/vi_diode.png', isCorrect: false, content: [] },
        { id: 'o-3', key: 'c', rawText: 'Filament Lamp', imageUrl: '/api/assets/vi_lamp.png', isCorrect: false, content: [] },
        { id: 'o-4', key: 'd', rawText: 'Thermistor', imageUrl: '/api/assets/vi_thermistor.png', isCorrect: false, content: [] }
      ],
      correctAnswer: 'a',
      marks: 4,
      difficulty: 'Medium',
      tags: ['ohms-law', 'graphs'],
      optionLayout: 'grid_2x2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(qWithOptionsImages.options[0].imageUrl).toBe('/api/assets/vi_linear.png');
    expect(qWithOptionsImages.options[1].imageUrl).toBe('/api/assets/vi_diode.png');
    expect(qWithOptionsImages.options[2].imageUrl).toBe('/api/assets/vi_lamp.png');
    expect(qWithOptionsImages.options[3].imageUrl).toBe('/api/assets/vi_thermistor.png');
  });
});

