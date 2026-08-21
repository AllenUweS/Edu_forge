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

const API_BASE = '/api';

// In-Memory Cache for ultra-fast instant UI rendering (0ms network roundtrip)
const cache = {
  templates: null as Template[] | null,
  symbols: null as SymbolCategory[] | null,
  physicsChapters: null as PhysicsChapter[] | null,
  chemistryElements: null as ChemistryElement[] | null,
  chemistryNotations: null as ChemistryNotation[] | null,
  units: null as Unit[] | null,
  constants: null as ScientificConstant[] | null,
  settings: null as AppSettings | null,
  documents: null as DocumentModel[] | null,
  questions: null as Question[] | null
};

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
    if (!search && cache.documents) {
      // Return cached documents instantly, refresh in background
      fetchJson<DocumentModel[]>(`${API_BASE}/documents`).then(d => { cache.documents = d; }).catch(() => {});
      return cache.documents;
    }
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const docs = await fetchJson<DocumentModel[]>(`${API_BASE}/documents${query}`);
    if (!search) cache.documents = docs;
    return docs;
  },

  async getDocument(id: string): Promise<DocumentModel> {
    return fetchJson<DocumentModel>(`${API_BASE}/documents/${id}`);
  },

  async createDocument(doc: Partial<DocumentModel>): Promise<DocumentModel> {
    cache.documents = null; // Invalidate
    return fetchJson<DocumentModel>(`${API_BASE}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc)
    });
  },

  async updateDocument(id: string, doc: DocumentModel): Promise<DocumentModel> {
    cache.documents = null; // Invalidate
    return fetchJson<DocumentModel>(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doc)
    });
  },

  async duplicateDocument(id: string): Promise<DocumentModel> {
    cache.documents = null;
    return fetchJson<DocumentModel>(`${API_BASE}/documents/${id}/duplicate`, {
      method: 'POST'
    });
  },

  async deleteDocument(id: string): Promise<void> {
    cache.documents = null;
    return fetchJson<void>(`${API_BASE}/documents/${id}`, {
      method: 'DELETE'
    });
  },

  // Question Bank
  async getQuestions(filters?: Record<string, any>): Promise<Question[]> {
    const hasFilters = filters && Object.values(filters).some(v => v && v !== 'all');
    if (!hasFilters && cache.questions) {
      fetchJson<Question[]>(`${API_BASE}/question-bank`).then(q => { cache.questions = q; }).catch(() => {});
      return cache.questions;
    }
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
    if (!hasFilters) cache.questions = questions;
    return questions;
  },

  async getQuestion(id: string): Promise<Question> {
    return fetchJson<Question>(`${API_BASE}/question-bank/${id}`);
  },

  async createQuestion(question: Partial<Question>): Promise<Question> {
    cache.questions = null;
    return fetchJson<Question>(`${API_BASE}/question-bank`, {
      method: 'POST',
      body: JSON.stringify(question)
    });
  },

  async updateQuestion(id: string, question: Question): Promise<Question> {
    cache.questions = null;
    return fetchJson<Question>(`${API_BASE}/question-bank/${id}`, {
      method: 'PUT',
      body: JSON.stringify(question)
    });
  },

  async duplicateQuestion(id: string): Promise<Question> {
    cache.questions = null;
    return fetchJson<Question>(`${API_BASE}/question-bank/${id}/duplicate`, {
      method: 'POST'
    });
  },

  async deleteQuestion(id: string): Promise<void> {
    cache.questions = null;
    return fetchJson<void>(`${API_BASE}/question-bank/${id}`, {
      method: 'DELETE'
    });
  },

  async importQuestions(questions: Question[]): Promise<{ count: number }> {
    cache.questions = null;
    return fetchJson<{ count: number }>(`${API_BASE}/question-bank/import`, {
      method: 'POST',
      body: JSON.stringify(questions)
    });
  },

  getQuestionBankExportUrl(): string {
    return `${API_BASE}/question-bank/export`;
  },

  // Templates - cached in-memory for instant switching
  async getTemplates(): Promise<Template[]> {
    if (cache.templates) return cache.templates;
    const data = await fetchJson<Template[]>(`${API_BASE}/templates`);
    cache.templates = data;
    return data;
  },

  async getTemplate(id: string): Promise<Template> {
    return fetchJson<Template>(`${API_BASE}/templates/${id}`);
  },

  async createTemplate(template: Partial<Template>): Promise<Template> {
    cache.templates = null;
    return fetchJson<Template>(`${API_BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify(template)
    });
  },

  async deleteTemplate(id: string): Promise<void> {
    cache.templates = null;
    return fetchJson<void>(`${API_BASE}/templates/${id}`, {
      method: 'DELETE'
    });
  },

  // Science & Symbols - 100% instant in-memory cached
  async getSymbols(): Promise<SymbolCategory[]> {
    if (cache.symbols) return cache.symbols;
    const data = await fetchJson<SymbolCategory[]>(`${API_BASE}/symbols`);
    cache.symbols = data;
    return data;
  },

  async getPhysicsChapters(): Promise<PhysicsChapter[]> {
    if (cache.physicsChapters) return cache.physicsChapters;
    const data = await fetchJson<PhysicsChapter[]>(`${API_BASE}/physics/chapters`);
    cache.physicsChapters = data;
    return data;
  },

  async getChemistryElements(): Promise<ChemistryElement[]> {
    if (cache.chemistryElements) return cache.chemistryElements;
    const data = await fetchJson<ChemistryElement[]>(`${API_BASE}/chemistry/elements`);
    cache.chemistryElements = data;
    return data;
  },

  async getChemistryNotations(): Promise<ChemistryNotation[]> {
    if (cache.chemistryNotations) return cache.chemistryNotations;
    const data = await fetchJson<ChemistryNotation[]>(`${API_BASE}/chemistry/notations`);
    cache.chemistryNotations = data;
    return data;
  },

  async getUnits(): Promise<Unit[]> {
    if (cache.units) return cache.units;
    const data = await fetchJson<Unit[]>(`${API_BASE}/units`);
    cache.units = data;
    return data;
  },

  async getConstants(): Promise<ScientificConstant[]> {
    if (cache.constants) return cache.constants;
    const data = await fetchJson<ScientificConstant[]>(`${API_BASE}/constants`);
    cache.constants = data;
    return data;
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    if (cache.settings) return cache.settings;
    const data = await fetchJson<AppSettings>(`${API_BASE}/settings`);
    cache.settings = data;
    return data;
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    cache.settings = settings;
    return fetchJson<AppSettings>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // Assets
  async uploadAsset(file: File): Promise<{ id: string; url: string; originalName: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }

    const json = await res.json();
    return json.data;
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
