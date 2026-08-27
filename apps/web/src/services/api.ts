import {
  DocumentModel,
  Question,
  Template,
  SymbolCategory,
  PhysicsChapter,
  ChemistryElement,
  ChemistryNotation,
  Unit,
  ScientificConstant,
  AppSettings
} from '@eduforge/shared';

// Static bundled fallback datasets for 100% offline & static Vercel deployment support
import defaultChapters from '../../../../resources/physics/chapters.json';
import defaultElements from '../../../../resources/chemistry/elements.json';
import defaultNotations from '../../../../resources/chemistry/notations.json';
import defaultSymbols from '../../../../resources/symbols/symbols.json';
import defaultUnits from '../../../../resources/units/units.json';
import defaultConstants from '../../../../resources/constants/constants.json';
import defaultTemplates from '../../../../resources/templates/templates.json';
import defaultQuestions from '../../../../resources/presets/initial_questions.json';

const API_BASE = '/api';

// In-Memory Cache
const cache = {
  templates: defaultTemplates as unknown as Template[],
  symbols: defaultSymbols as unknown as SymbolCategory[],
  physicsChapters: defaultChapters as unknown as PhysicsChapter[],
  chemistryElements: defaultElements as unknown as ChemistryElement[],
  chemistryNotations: defaultNotations as unknown as ChemistryNotation[],
  units: defaultUnits as unknown as Unit[],
  constants: defaultConstants as unknown as ScientificConstant[],
  settings: null as AppSettings | null,
  documents: null as DocumentModel[] | null,
  questions: defaultQuestions as unknown as Question[] | null
};

// LocalStorage helpers for standalone client-side hosting (Vercel)
const STORAGE_KEYS = {
  DOCS: 'eduforge_local_documents',
  QUESTIONS: 'eduforge_local_questions',
  SETTINGS: 'eduforge_local_settings'
};

const defaultAdminDocs: DocumentModel[] = [];

function isFacultyUser(): boolean {
  try {
    const raw = localStorage.getItem('eduforge_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.role === 'FACULTY' || parsed.user === 'faculty';
    }
  } catch {}
  return false;
}

function getLocalDocs(): DocumentModel[] {
  if (isFacultyUser()) {
    try {
      const raw = localStorage.getItem('eduforge_local_documents_faculty');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
    if (raw !== null) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

function saveLocalDocs(docs: DocumentModel[]): void {
  try {
    const key = isFacultyUser() ? 'eduforge_local_documents_faculty' : STORAGE_KEYS.DOCS;
    localStorage.setItem(key, JSON.stringify(docs));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function getLocalQuestions(): Question[] {
  if (isFacultyUser()) {
    try {
      const raw = localStorage.getItem('eduforge_local_questions_faculty');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (raw) return JSON.parse(raw);
    return defaultQuestions as unknown as Question[];
  } catch {
    return defaultQuestions as unknown as Question[];
  }
}

function saveLocalQuestions(qs: Question[]): void {
  try {
    const key = isFacultyUser() ? 'eduforge_local_questions_faculty' : STORAGE_KEYS.QUESTIONS;
    localStorage.setItem(key, JSON.stringify(qs));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function getAuthHeader(): Record<string, string> {
  try {
    const authData = localStorage.getItem('eduforge_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.token) {
        return { Authorization: `Token ${parsed.token}` };
      }
    }
  } catch {}
  // Default fallback token for admin session
  return { Authorization: 'Token 8f73d4d931452ac3db8b329c32aa129051278598' };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeader();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Documents & Exam Papers
  async getDocuments(search?: string): Promise<DocumentModel[]> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const docs = await fetchJson<any[]>(`${API_BASE}/exam-papers/${query}`);
      if (Array.isArray(docs)) {
        const formatted: DocumentModel[] = docs.map(doc => ({
          id: String(doc.id),
          title: doc.title || 'Untitled Test',
          templateId: doc.templateId || 'a4-single-column',
          metadata: doc.metadata || {
            subject: doc.subject || 'Physics & Chemistry',
            timeAllowedMinutes: doc.durationMinutes || doc.timeAllowedMinutes || 60,
            totalQuestions: doc.totalQuestions || 25,
            maxMarks: doc.maxMarks || 100
          },
          settings: doc.settings || {} as any,
          sections: doc.sections || [],
          createdAt: doc.created_at || doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updated_at || doc.updatedAt || new Date().toISOString()
        }));
        cache.documents = formatted;
        saveLocalDocs(formatted);
        return formatted;
      }
      return getLocalDocs();
    } catch {
      const local = getLocalDocs();
      if (search) {
        return local.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
      }
      return local;
    }
  },

  async getDocument(id: string): Promise<DocumentModel> {
    try {
      let doc = await fetchJson<any>(`${API_BASE}/exam-papers/${id}/`);
      if (doc) {
        return {
          id: String(doc.id),
          title: doc.title || 'Untitled Exam',
          templateId: doc.templateId || 'a4-single-column',
          metadata: doc.metadata || { subject: 'Physics & Chemistry', timeAllowedMinutes: 60, maxMarks: 100 },
          settings: doc.settings || {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
            columns: 1,
            columnGap: 8,
            columnDivider: false,
            defaultFont: 'Calibri, sans-serif',
            defaultFontSize: 10.5,
            questionSpacing: 6,
            optionSpacing: 4,
            lineSpacing: 1.15,
            paragraphSpacing: 4
          },
          sections: doc.sections || [],
          createdAt: doc.created_at || new Date().toISOString(),
          updatedAt: doc.updated_at || new Date().toISOString()
        };
      }
      throw new Error('Document not found');
    } catch {
      const local = getLocalDocs();
      const found = local.find(d => d.id === id);
      if (found) return found;
      throw new Error('Document not found');
    }
  },

  async createDocument(doc: Partial<DocumentModel>): Promise<DocumentModel> {
    try {
      const payload = {
        title: doc.title || 'Untitled Test',
        metadata: doc.metadata,
        settings: doc.settings,
        sections: doc.sections
      };
      const created = await fetchJson<any>(`${API_BASE}/exam-papers/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      cache.documents = null;
      return {
        id: String(created.id),
        title: created.title || doc.title || 'Untitled Test',
        templateId: doc.templateId || 'a4-single-column',
        metadata: doc.metadata || {},
        settings: doc.settings || {} as any,
        sections: doc.sections || [],
        createdAt: created.created_at || new Date().toISOString(),
        updatedAt: created.updated_at || new Date().toISOString()
      };
    } catch {
      const local = getLocalDocs();
      const newDoc: DocumentModel = {
        id: `doc-${Date.now()}`,
        title: doc.title || 'Untitled Document',
        templateId: doc.templateId,
        metadata: doc.metadata || {},
        settings: doc.settings || {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 15, bottom: 15, left: 15, right: 15 },
          columns: 2,
          columnGap: 8,
          columnDivider: true,
          defaultFont: 'Calibri, sans-serif',
          defaultFontSize: 10.5,
          questionSpacing: 6,
          optionSpacing: 4,
          lineSpacing: 1.15,
          paragraphSpacing: 4
        },
        sections: doc.sections || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      local.unshift(newDoc);
      saveLocalDocs(local);
      cache.documents = local;
      return newDoc;
    }
  },

  async updateDocument(id: string, doc: DocumentModel): Promise<DocumentModel> {
    try {
      const payload = {
        title: doc.title,
        metadata: doc.metadata,
        settings: doc.settings,
        sections: doc.sections
      };
      let res = await fetch(`${API_BASE}/exam-papers/${id}/`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE}/documents/${id}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(payload)
        });
      }

      cache.documents = null;
      return doc;
    } catch {
      const local = getLocalDocs();
      const idx = local.findIndex(d => d.id === id);
      if (idx !== -1) {
        local[idx] = { ...doc, updatedAt: new Date().toISOString() };
      } else {
        local.unshift(doc);
      }
      saveLocalDocs(local);
      cache.documents = local;
      return doc;
    }
  },

  async duplicateDocument(id: string): Promise<DocumentModel> {
    try {
      const target = await this.getDocument(id);
      const dupDoc: Partial<DocumentModel> = {
        ...target,
        title: `${target.title} (Copy)`
      };
      delete (dupDoc as any).id;
      return await this.createDocument(dupDoc);
    } catch {
      const local = getLocalDocs();
      const target = local.find(d => d.id === id);
      if (!target) throw new Error('Document not found');
      const dupDoc: DocumentModel = {
        ...JSON.parse(JSON.stringify(target)),
        id: `doc-${Date.now()}`,
        title: `${target.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      local.unshift(dupDoc);
      saveLocalDocs(local);
      cache.documents = local;
      return dupDoc;
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      let res = await fetch(`${API_BASE}/exam-papers/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE}/documents/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
      }

      cache.documents = null;
      const local = getLocalDocs().filter(d => d.id !== id);
      saveLocalDocs(local);
    } catch {
      const local = getLocalDocs().filter(d => d.id !== id);
      saveLocalDocs(local);
      cache.documents = local;
    }
  },

  // Subjects & Chapters
  async getSubjects(): Promise<any[]> {
    if (isFacultyUser()) {
      try {
        const raw = localStorage.getItem('eduforge_local_subjects_faculty');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    try {
      const subs = await fetchJson<any[]>(`${API_BASE}/subjects/`);
      return Array.isArray(subs) ? subs : [];
    } catch {
      return [];
    }
  },

  async createSubject(subject: { name: string; code: string }): Promise<any> {
    try {
      const created = await fetchJson<any>(`${API_BASE}/subjects/`, {
        method: 'POST',
        body: JSON.stringify(subject)
      });
      if (isFacultyUser()) {
        const raw = localStorage.getItem('eduforge_local_subjects_faculty');
        const list = raw ? JSON.parse(raw) : [];
        list.push(created);
        localStorage.setItem('eduforge_local_subjects_faculty', JSON.stringify(list));
      }
      return created;
    } catch {
      const newSub = { id: Date.now(), ...subject, chapters: 0, questions: 0, status: 'Active' };
      if (isFacultyUser()) {
        const raw = localStorage.getItem('eduforge_local_subjects_faculty');
        const list = raw ? JSON.parse(raw) : [];
        list.push(newSub);
        localStorage.setItem('eduforge_local_subjects_faculty', JSON.stringify(list));
      }
      return newSub;
    }
  },

  async updateSubject(id: number | string, subject: { name: string; code: string }): Promise<any> {
    try {
      return await fetchJson<any>(`${API_BASE}/subjects/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(subject)
      });
    } catch {
      return { id, ...subject, status: 'Active' };
    }
  },

  async deleteSubject(id: number | string): Promise<void> {
    if (isFacultyUser()) {
      try {
        const raw = localStorage.getItem('eduforge_local_subjects_faculty');
        const list = raw ? JSON.parse(raw) : [];
        const updated = list.filter((s: any) => String(s.id) !== String(id) && s.code !== id);
        localStorage.setItem('eduforge_local_subjects_faculty', JSON.stringify(updated));
      } catch {}
    }
    try {
      await fetch(`${API_BASE}/subjects/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
    } catch (e) {
      console.error('Delete subject error:', e);
    }
  },

  async getChapters(subjectId?: number | string): Promise<any[]> {
    if (isFacultyUser()) {
      try {
        const raw = localStorage.getItem('eduforge_local_chapters_faculty');
        const list = raw ? JSON.parse(raw) : [];
        if (subjectId) {
          return list.filter((ch: any) => String(ch.subjectId) === String(subjectId));
        }
        return list;
      } catch {
        return [];
      }
    }
    try {
      const url = subjectId ? `${API_BASE}/subjects/${subjectId}/chapters/` : `${API_BASE}/chapters/`;
      const chs = await fetchJson<any[]>(url);
      return Array.isArray(chs) ? chs : [];
    } catch {
      return [];
    }
  },

  async createChapter(subjectId: number | string, chapter: { title: string; name?: string }): Promise<any> {
    try {
      const created = await fetchJson<any>(`${API_BASE}/subjects/${subjectId}/chapters/`, {
        method: 'POST',
        body: JSON.stringify({ name: chapter.title || chapter.name })
      });
      if (isFacultyUser()) {
        const raw = localStorage.getItem('eduforge_local_chapters_faculty');
        const list = raw ? JSON.parse(raw) : [];
        list.push(created);
        localStorage.setItem('eduforge_local_chapters_faculty', JSON.stringify(list));
      }
      return created;
    } catch {
      const newCh = { id: `CH-${Date.now()}`, title: chapter.title || chapter.name, count: 0, subjectId };
      if (isFacultyUser()) {
        const raw = localStorage.getItem('eduforge_local_chapters_faculty');
        const list = raw ? JSON.parse(raw) : [];
        list.push(newCh);
        localStorage.setItem('eduforge_local_chapters_faculty', JSON.stringify(list));
      }
      return newCh;
    }
  },

  async updateChapter(id: number | string, chapter: { title: string; name?: string }): Promise<any> {
    try {
      return await fetchJson<any>(`${API_BASE}/chapters/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(chapter)
      });
    } catch {
      return { id, title: chapter.title || chapter.name };
    }
  },

  async deleteChapter(id: number | string): Promise<void> {
    if (isFacultyUser()) {
      try {
        const raw = localStorage.getItem('eduforge_local_chapters_faculty');
        const list = raw ? JSON.parse(raw) : [];
        const updated = list.filter((c: any) => String(c.id) !== String(id));
        localStorage.setItem('eduforge_local_chapters_faculty', JSON.stringify(updated));
      } catch {}
    }
    try {
      await fetch(`${API_BASE}/chapters/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
    } catch (e) {
      console.error('Delete chapter error:', e);
    }
  },

  // Question Bank
  async getQuestions(filters?: Record<string, any>): Promise<Question[]> {
    if (isFacultyUser()) {
      let questions = getLocalQuestions();
      if (filters) {
        if (filters.subject && filters.subject !== 'all') {
          questions = questions.filter(q => q.subject === filters.subject);
        }
        if (filters.difficulty && filters.difficulty !== 'all') {
          questions = questions.filter(q => q.difficulty === filters.difficulty);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          questions = questions.filter(item =>
            (item.rawText && item.rawText.toLowerCase().includes(q)) ||
            (item.chapter && item.chapter.toLowerCase().includes(q))
          );
        }
      }
      return questions;
    }
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '' && v !== 'all') {
            params.append(k, String(v));
          }
        });
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const questions = await fetchJson<Question[]>(`${API_BASE}/question-bank${qs}`);
      if (Array.isArray(questions) && questions.length > 0) {
        cache.questions = questions;
        return questions;
      }
      return getLocalQuestions();
    } catch {
      let questions = getLocalQuestions();
      if (filters) {
        if (filters.subject && filters.subject !== 'all') {
          questions = questions.filter(q => q.subject === filters.subject);
        }
        if (filters.difficulty && filters.difficulty !== 'all') {
          questions = questions.filter(q => q.difficulty === filters.difficulty);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          questions = questions.filter(item =>
            (item.rawText && item.rawText.toLowerCase().includes(q)) ||
            (item.chapter && item.chapter.toLowerCase().includes(q))
          );
        }
      }
      return questions;
    }
  },

  async getQuestion(id: string): Promise<Question> {
    try {
      return await fetchJson<Question>(`${API_BASE}/question-bank/${id}`);
    } catch {
      const local = getLocalQuestions();
      const q = local.find(x => x.id === id);
      if (q) return q;
      throw new Error('Question not found');
    }
  },

  async createQuestion(question: Partial<Question>): Promise<Question> {
    try {
      const created = await fetchJson<Question>(`${API_BASE}/question-bank`, {
        method: 'POST',
        body: JSON.stringify(question)
      });
      cache.questions = null;
      return created;
    } catch {
      const local = getLocalQuestions();
      const newQ = {
        ...question,
        id: question.id || `q-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Question;
      local.unshift(newQ);
      saveLocalQuestions(local);
      cache.questions = local;
      return newQ;
    }
  },

  async updateQuestion(id: string, question: Question): Promise<Question> {
    try {
      const updated = await fetchJson<Question>(`${API_BASE}/question-bank/${id}`, {
        method: 'PUT',
        body: JSON.stringify(question)
      });
      cache.questions = null;
      return updated;
    } catch {
      const local = getLocalQuestions();
      const idx = local.findIndex(q => q.id === id);
      if (idx !== -1) {
        local[idx] = { ...question, updatedAt: new Date().toISOString() };
      } else {
        local.unshift(question);
      }
      saveLocalQuestions(local);
      cache.questions = local;
      return question;
    }
  },

  async duplicateQuestion(id: string): Promise<Question> {
    try {
      const dup = await fetchJson<Question>(`${API_BASE}/question-bank/${id}/duplicate`, {
        method: 'POST'
      });
      cache.questions = null;
      return dup;
    } catch {
      const local = getLocalQuestions();
      const target = local.find(q => q.id === id);
      if (!target) throw new Error('Question not found');
      const newQ = {
        ...JSON.parse(JSON.stringify(target)),
        id: `q-${Date.now()}`,
        rawText: `${target.rawText} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      local.unshift(newQ);
      saveLocalQuestions(local);
      cache.questions = local;
      return newQ;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    if (isFacultyUser()) {
      const local = getLocalQuestions().filter(q => q.id !== id);
      saveLocalQuestions(local);
      cache.questions = local;
      return;
    }
    try {
      let res = await fetch(`${API_BASE}/bank-questions/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/question-bank/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
      }
      cache.questions = null;
    } catch {
      const local = getLocalQuestions().filter(q => q.id !== id);
      saveLocalQuestions(local);
      cache.questions = local;
    }
  },

  async deleteMultipleQuestions(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.deleteQuestion(id);
    }
  },

  async importQuestions(questions: Question[]): Promise<{ count: number }> {
    try {
      return await fetchJson<{ count: number }>(`${API_BASE}/question-bank/import`, {
        method: 'POST',
        body: JSON.stringify(questions)
      });
    } catch {
      const local = getLocalQuestions();
      const combined = [...questions, ...local];
      saveLocalQuestions(combined);
      cache.questions = combined;
      return { count: questions.length };
    }
  },

  getQuestionBankExportUrl(): string {
    return `${API_BASE}/question-bank/export`;
  },

  // Templates
  async getTemplates(): Promise<Template[]> {
    try {
      const data = await fetchJson<Template[]>(`${API_BASE}/templates`);
      cache.templates = data;
      return data;
    } catch {
      return defaultTemplates as unknown as Template[];
    }
  },

  async getTemplate(id: string): Promise<Template> {
    try {
      return await fetchJson<Template>(`${API_BASE}/templates/${id}`);
    } catch {
      const t = (defaultTemplates as unknown as Template[]).find(x => x.id === id);
      if (t) return t;
      return defaultTemplates[0] as unknown as Template;
    }
  },

  async createTemplate(template: Partial<Template>): Promise<Template> {
    try {
      return await fetchJson<Template>(`${API_BASE}/templates`, {
        method: 'POST',
        body: JSON.stringify(template)
      });
    } catch {
      return template as Template;
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      await fetchJson<void>(`${API_BASE}/templates/${id}`, {
        method: 'DELETE'
      });
    } catch {
      // noop
    }
  },

  // Science & Symbols
  async getSymbols(): Promise<SymbolCategory[]> {
    try {
      const data = await fetchJson<SymbolCategory[]>(`${API_BASE}/symbols`);
      cache.symbols = data;
      return data;
    } catch {
      return defaultSymbols as unknown as SymbolCategory[];
    }
  },

  async getPhysicsChapters(): Promise<PhysicsChapter[]> {
    try {
      const data = await fetchJson<PhysicsChapter[]>(`${API_BASE}/physics/chapters`);
      cache.physicsChapters = data;
      return data;
    } catch {
      return defaultChapters as unknown as PhysicsChapter[];
    }
  },

  async getChemistryElements(): Promise<ChemistryElement[]> {
    try {
      const data = await fetchJson<ChemistryElement[]>(`${API_BASE}/chemistry/elements`);
      cache.chemistryElements = data;
      return data;
    } catch {
      return defaultElements as unknown as ChemistryElement[];
    }
  },

  async getChemistryNotations(): Promise<ChemistryNotation[]> {
    try {
      const data = await fetchJson<ChemistryNotation[]>(`${API_BASE}/chemistry/notations`);
      cache.chemistryNotations = data;
      return data;
    } catch {
      return defaultNotations as unknown as ChemistryNotation[];
    }
  },

  async getUnits(): Promise<Unit[]> {
    try {
      const data = await fetchJson<any>(`${API_BASE}/units`);
      const unitsArray = Array.isArray(data) ? data : (data?.units || []);
      cache.units = unitsArray;
      return unitsArray;
    } catch {
      const fallback = Array.isArray(defaultUnits) ? defaultUnits : ((defaultUnits as any)?.units || []);
      return fallback as unknown as Unit[];
    }
  },

  async getPrefixes(): Promise<any[]> {
    try {
      const data = await fetchJson<any>(`${API_BASE}/units/prefixes`);
      if (Array.isArray(data)) return data;
      return (defaultUnits as any)?.prefixes || [];
    } catch {
      return (defaultUnits as any)?.prefixes || [];
    }
  },

  async getConstants(): Promise<ScientificConstant[]> {
    try {
      const data = await fetchJson<ScientificConstant[]>(`${API_BASE}/constants`);
      cache.constants = data;
      return Array.isArray(data) ? data : [];
    } catch {
      return defaultConstants as unknown as ScientificConstant[];
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await fetchJson<AppSettings>(`${API_BASE}/settings`);
      cache.settings = data;
      return data;
    } catch {
      return {
        defaultFont: 'Calibri, sans-serif',
        defaultFontSize: 10.5,
        defaultPaperSize: 'A4',
        defaultMargins: { top: 15, bottom: 15, left: 15, right: 15 },
        defaultQuestionStyle: 'number_dot',
        defaultOptionStyle: 'grid_2x2',
        defaultEquationSize: 12,
        autosaveIntervalMs: 2000,
        theme: 'white',
        exportSettings: {
          pdfDpi: 300,
          embedFonts: true,
          showPageNumbers: true
        },
        backupSettings: {
          autoBackupDaily: true,
          maxBackupsToKeep: 5
        }
      };
    }
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    cache.settings = settings;
    try {
      return await fetchJson<AppSettings>(`${API_BASE}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch {
      return settings;
    }
  },

  // Media Library
  async getMedia(): Promise<any[]> {
    try {
      const data = await fetchJson<any[]>(`${API_BASE}/media/`);
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: String(item.id),
          name: item.original_name || (item.file ? item.file.split('/').pop() : `Media #${item.id}`),
          label: (item.media_type || 'IMAGE').toUpperCase(),
          url: item.url || item.file || '',
          usesCount: 0
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async deleteMedia(id: string): Promise<void> {
    try {
      await fetchJson<void>(`${API_BASE}/media/${id}/`, {
        method: 'DELETE'
      });
    } catch {
      // noop
    }
  },

  // Assets & Image Upload
  async uploadAsset(file: File): Promise<{ id: string; url: string; originalName: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image', file);

      let res = await fetch(`${API_BASE}/media/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE}/images/upload/`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: formData
        });
      }

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const json = await res.json();
      const result = json.data || json;
      let url = result.url || result.file || '';
      if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
        url = url.startsWith('/') ? url : `/${url}`;
      }
      return { id: String(result.id || Date.now()), url, originalName: file.name };
    } catch {
      // Create local Base64 Data URL as robust fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `asset-${Date.now()}`,
            url: reader.result as string,
            originalName: file.name
          });
        };
        reader.onerror = () => {
          resolve({
            id: `asset-${Date.now()}`,
            url: URL.createObjectURL(file),
            originalName: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    }
  },

  async uploadImage(file: File): Promise<{ id: string; url: string; originalName: string }> {
    return this.uploadAsset(file);
  },

  // Exports
  async exportDocx(doc: DocumentModel): Promise<Blob> {
    const res = await fetch(`${API_BASE}/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('DOCX export failed');
    return await res.blob();
  },

  async exportPdfHtml(doc: DocumentModel): Promise<string> {
    const res = await fetch(`${API_BASE}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('PDF render failed');
    return await res.text();
  }
};
