import { Question } from '@eduforge/shared';

/**
 * Format dynamic question code based on subject and chapter
 * Example: BIO-CEL-1042, PHY-KIN-2981, CHE-ATO-4401, MAT-ALG-8812
 */
export const formatQuestionCode = (q?: Partial<Question> | null): string => {
  if (!q) return 'BIO-CEL-0001';

  // If question id already matches 3-letter code hyphen 3-letter chapter hyphen number
  if (q.id && /^[A-Z]{3}-[A-Z]{3}-\d+/i.test(q.id)) {
    return q.id.toUpperCase();
  }

  const sub = q.subject || 'Biology';
  const chap = q.chapter || 'Cell Structure and Function';

  const subCode = sub.substring(0, 3).toUpperCase();
  const cleanChap = chap.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const chapCode = cleanChap.length >= 3 ? cleanChap.substring(0, 3) : (cleanChap || 'GEN').padEnd(3, 'X');

  const rawNum = q.id ? q.id.replace(/\D/g, '') : '';
  const numPart = rawNum ? rawNum.slice(-4) : String(Math.floor(Math.random() * 9000) + 1000);
  const paddedNum = numPart.padStart(4, '0');

  return `${subCode}-${chapCode}-${paddedNum}`;
};
