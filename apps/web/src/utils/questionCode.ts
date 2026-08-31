import { Question } from '@eduforge/shared';

const KNOWN_CHAPTER_CODES: Record<string, string> = {
  'units and measurements': 'UNI',
  'motion in a plane': 'MIP',
  'motion in a straight line': 'MSL',
  'laws of motion': 'LOM',
  'work, energy and power': 'WEP',
  'gravitation': 'GRA',
  'thermodynamics': 'THE',
  'oscillations': 'OSC',
  'waves': 'WAV',
  'current electricity': 'CUR',
  'ray optics': 'RAY',
  'wave optics': 'WVO',
  'atoms': 'ATM',
  'nuclei': 'NUC',
  'some basic concepts of chemistry': 'BAS',
  'structure of atom': 'ATO',
  'chemical bonding': 'BND',
  'equilibrium': 'EQU',
  'electrochemistry': 'ECH',
  'chemical kinetics': 'KIN',
  'hydrocarbons': 'HYD',
  'the living world': 'LIV',
  'animal kingdom': 'ANI',
  'plant kingdom': 'PLK',
  'biological classification': 'BCL',
  'cell: the unit of life': 'CEL',
  'cell structure and function': 'CEL',
  'biomolecules': 'BIO',
  'human reproduction': 'REP',
  'genetics': 'GEN',
  'evolution': 'EVO'
};

/**
 * Format dynamic question code based strictly on subject and chosen chapter
 * Example: BIO-ANI-0071, PHY-UNI-0042, CHE-BAS-0045, MAT-ALG-8812
 */
export const formatQuestionCode = (q?: Partial<Question> | any | null): string => {
  if (!q) return 'BIO-LIV-0001';

  const sub = (q.subject || 'Biology').trim();
  const chap = (q.chapter || 'The Living World').trim();

  let subCode = 'GEN';
  const subLower = sub.toLowerCase();
  if (subLower.includes('phys')) subCode = 'PHY';
  else if (subLower.includes('chem')) subCode = 'CHE';
  else if (subLower.includes('bio')) subCode = 'BIO';
  else if (subLower.includes('math')) subCode = 'MAT';
  else subCode = sub.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';

  let chapCode = 'GEN';
  const chapLower = chap.toLowerCase();
  if (KNOWN_CHAPTER_CODES[chapLower]) {
    chapCode = KNOWN_CHAPTER_CODES[chapLower];
  } else {
    const matchedKnown = Object.entries(KNOWN_CHAPTER_CODES).find(([k]) => chapLower.includes(k));
    if (matchedKnown) {
      chapCode = matchedKnown[1];
    } else {
      const words = chap.split(/\s+/).filter((w: string) => !['and', 'of', 'the', 'in', 'a', '&', 'to', 'for'].includes(w.toLowerCase()));
      if (words.length >= 3) {
        chapCode = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      } else if (words.length === 2) {
        chapCode = (words[0].substring(0, 2) + words[1][0]).toUpperCase();
      } else {
        const clean = chap.replace(/[^a-zA-Z]/g, '').toUpperCase();
        chapCode = clean.length >= 3 ? clean.substring(0, 3) : (clean || 'GEN').padEnd(3, 'X');
      }
    }
  }

  // Extract sequence number from existing questionCode or id
  const existingCode = String(q.questionCode || q.question_code || (typeof q.id === 'string' ? q.id : '') || '');
  const matchNum = existingCode.match(/(\d{1,4})$/);
  const numPart = matchNum
    ? matchNum[1].padStart(4, '0')
    : (typeof q.id === 'string' && q.id.replace(/\D/g, '')
        ? q.id.replace(/\D/g, '').slice(-4).padStart(4, '0')
        : String(Math.floor(Math.random() * 9000) + 1000));

  return `${subCode}-${chapCode}-${numPart}`;
};
