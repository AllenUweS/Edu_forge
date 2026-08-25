import React from 'react';
import { KaTeXRenderer } from './KaTeXRenderer.js';

interface MathTextRendererProps {
  text?: string;
  className?: string;
  block?: boolean;
}

// Helper to check if a character is whitespace or punctuation
const isBoundary = (ch: string) => /\s|[.,;:!?"'()\[\]{}]/.test(ch);

// Helper to consume a balanced bracket/brace block e.g. {...} or [...]
function consumeBalanced(str: string, startIndex: number, openChar = '{', closeChar = '}'): { content: string; endIndex: number } | null {
  if (str[startIndex] !== openChar) return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      i++; // Skip escaped character
      continue;
    }
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) {
        return {
          content: str.substring(startIndex, i + 1),
          endIndex: i + 1
        };
      }
    }
  }
  return null;
}

// Helper to extract a full LaTeX command with all its arguments and modifiers
function extractFullLatexExpression(str: string, startIndex: number): { latex: string; endIndex: number } | null {
  if (str[startIndex] !== '\\') return null;

  // Match command name e.g. \frac, \sqrt, \alpha, \text
  const match = str.substring(startIndex).match(/^\\([a-zA-Z]+|[,;:! %])/);
  if (!match) return null;

  let currentIdx = startIndex + match[0].length;

  // Consume optional arguments e.g. \sqrt[3]{x}
  if (str[currentIdx] === '[') {
    const opt = consumeBalanced(str, currentIdx, '[', ']');
    if (opt) currentIdx = opt.endIndex;
  }

  // Consume required arguments e.g. {numerator}{denominator}
  while (currentIdx < str.length && str[currentIdx] === '{') {
    const arg = consumeBalanced(str, currentIdx, '{', '}');
    if (arg) {
      currentIdx = arg.endIndex;
    } else {
      break;
    }
  }

  // Consume sub/superscripts attached to this command e.g. \int_a^b or \sigma_{total}^2
  while (currentIdx < str.length && (str[currentIdx] === '_' || str[currentIdx] === '^')) {
    currentIdx++;
    if (str[currentIdx] === '{') {
      const subSup = consumeBalanced(str, currentIdx, '{', '}');
      if (subSup) currentIdx = subSup.endIndex;
      else break;
    } else if (currentIdx < str.length && /[a-zA-Z0-9]/.test(str[currentIdx])) {
      currentIdx++;
    } else {
      break;
    }
  }

  return {
    latex: str.substring(startIndex, currentIdx),
    endIndex: currentIdx
  };
}

// Regex to test if a string contains common LaTeX keywords or mathematical markers
const LATEX_KEYWORD_REGEX = /\\(frac|sqrt|vec|int|sum|prod|partial|alpha|beta|gamma|delta|Delta|theta|Theta|lambda|Lambda|mu|pi|Pi|sigma|Sigma|omega|Omega|phi|Phi|psi|Psi|infty|times|div|pm|mp|le|ge|neq|approx|equiv|rightarrow|leftarrow|rightleftharpoons|ce|text|mathrm|mathbf|mathit|textsubscript|textsuperscript|cdot|circ|degree|angle|sin|cos|tan|cot|sec|csc|log|ln|lim|Omega|quad|qquad)\b|[_^]\{|\\[a-zA-Z]+/;

export const MathTextRenderer: React.FC<MathTextRendererProps> = ({
  text = '',
  className = '',
  block = false
}) => {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();

  // 1. Explicit $...$ or $$...$$ delimiters
  if (trimmed.includes('$')) {
    const parts: React.ReactNode[] = [];
    const delimiterRegex = /\$\$([\s\S]*?)\$\$|\$([^\$]+?)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = delimiterRegex.exec(trimmed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`}>{trimmed.substring(lastIndex, match.index)}</span>
        );
      }

      const isBlockMath = Boolean(match[1]);
      const mathContent = match[1] || match[2] || '';

      parts.push(
        <KaTeXRenderer
          key={`math-${match.index}`}
          math={mathContent.trim()}
          block={isBlockMath || block}
        />
      );

      lastIndex = delimiterRegex.lastIndex;
    }

    if (lastIndex < trimmed.length) {
      parts.push(
        <span key={`txt-${lastIndex}`}>{trimmed.substring(lastIndex)}</span>
      );
    }

    return <span className={className}>{parts}</span>;
  }

  // 2. Explicit LaTeX environment like \begin{equation} or \begin{matrix}
  if (trimmed.startsWith('\\begin{') && trimmed.endsWith('\\end{')) {
    return (
      <KaTeXRenderer
        math={trimmed}
        block={block || true}
        className={className}
      />
    );
  }

  // 3. Pure formula test:
  // Must NOT be a natural language sentence (i.e. contains spaces between ordinary words)
  const wordCount = trimmed.split(/\s+/).length;
  const hasEnglishWords = /\b(the|is|are|of|in|to|and|for|with|from|by|at|which|what|calculate|find|determine|when|if|where|each|connected|equivalent|combination|resistor|resistors|identical)\b/i.test(trimmed);

  const isPureFormula = !hasEnglishWords && wordCount <= 4 && (
    (trimmed.startsWith('\\') && !trimmed.includes('. ')) ||
    (trimmed.includes('\\frac') && !trimmed.includes('. ')) ||
    (trimmed.includes('\\rightleftharpoons')) ||
    (trimmed.includes('\\rightarrow') && trimmed.includes('\\text{')) ||
    (trimmed.includes('=') && (trimmed.includes('\\') || trimmed.includes('^') || trimmed.includes('_')) && !trimmed.includes('. ') && trimmed.length < 50) ||
    (/^\d+\s*\\Omega$/.test(trimmed)) ||
    (/^[a-zA-Z]\s*=\s*\\frac/.test(trimmed))
  );

  if (isPureFormula) {
    return (
      <KaTeXRenderer
        math={trimmed}
        block={block}
        className={className}
      />
    );
  }

  // 4. Mixed Text with embedded LaTeX expressions e.g.
  // "Find the maximum height H = \frac{u^2 \sin^2\theta}{2g} when \theta = 30^\circ."
  if (trimmed.includes('\\') || LATEX_KEYWORD_REGEX.test(trimmed)) {
    const parts: React.ReactNode[] = [];
    let i = 0;
    let textBuffer = '';

    while (i < trimmed.length) {
      if (trimmed[i] === '\\') {
        const expr = extractFullLatexExpression(trimmed, i);
        if (expr && expr.latex) {
          // Flush text buffer
          if (textBuffer) {
            parts.push(<span key={`t-${parts.length}-${i}`}>{textBuffer}</span>);
            textBuffer = '';
          }
          // Push rendered KaTeX equation
          parts.push(
            <KaTeXRenderer
              key={`m-${parts.length}-${i}`}
              math={expr.latex}
              block={false}
            />
          );
          i = expr.endIndex;
          continue;
        }
      }

      textBuffer += trimmed[i];
      i++;
    }

    if (textBuffer) {
      parts.push(<span key={`t-end-${parts.length}`}>{textBuffer}</span>);
    }

    return <span className={className}>{parts}</span>;
  }

  // 5. Normal plain text
  return <span className={className}>{trimmed}</span>;
};
