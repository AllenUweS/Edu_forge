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

function getLocalDocs(): DocumentModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDocs(docs: DocumentModel[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function getLocalQuestions(): Question[] {
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
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(qs));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
  // Documents
  async getDocuments(search?: string): Promise<DocumentModel[]> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const docs = await fetchJson<DocumentModel[]>(`${API_BASE}/documents${query}`);
      cache.documents = docs;
      saveLocalDocs(docs);
      return docs;
    } catch {
      // Fallback to local storage on Vercel / offline mode
      const local = getLocalDocs();
      if (search) {
        return local.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
      }
      return local;
    }
  },

  async getDocument(id: string): Promise<DocumentModel> {
    try {
      return await fetchJson<DocumentModel>(`${API_BASE}/documents/${id}`);
    } catch {
      const local = getLocalDocs();
      const found = local.find(d => d.id === id);
      if (found) return found;
      throw new Error('Document not found');
    }
  },

  async createDocument(doc: Partial<DocumentModel>): Promise<DocumentModel> {
    try {
      const created = await fetchJson<DocumentModel>(`${API_BASE}/documents`, {
        method: 'POST',
        body: JSON.stringify(doc)
      });
      cache.documents = null;
      return created;
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
      const updated = await fetchJson<DocumentModel>(`${API_BASE}/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(doc)
      });
      cache.documents = null;
      return updated;
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
      const dup = await fetchJson<DocumentModel>(`${API_BASE}/documents/${id}/duplicate`, {
        method: 'POST'
      });
      cache.documents = null;
      return dup;
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
      await fetchJson<void>(`${API_BASE}/documents/${id}`, {
        method: 'DELETE'
      });
      cache.documents = null;
    } catch {
      const local = getLocalDocs().filter(d => d.id !== id);
      saveLocalDocs(local);
      cache.documents = local;
    }
  },

  // Question Bank
  async getQuestions(filters?: Record<string, any>): Promise<Question[]> {
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
      cache.questions = questions;
      return questions;
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
    try {
      await fetchJson<void>(`${API_BASE}/question-bank/${id}`, {
        method: 'DELETE'
      });
      cache.questions = null;
    } catch {
      const local = getLocalQuestions().filter(q => q.id !== id);
      saveLocalQuestions(local);
      cache.questions = local;
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

  // Assets & Image Upload
  async uploadAsset(file: File): Promise<{ id: string; url: string; originalName: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/assets/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const json = await res.json();
      const result = json.data || json;
      let url = result.url || '';
      if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
        const backendOrigin = API_BASE.replace(/\/api\/?$/, '');
        url = `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return { ...result, url };
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
