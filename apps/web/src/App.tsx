import React, { useState, useEffect } from 'react';
import { Sidebar, PageView } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { QuestionBankPage } from './pages/QuestionBankPage.js';
import { CreateQuestionPage } from './pages/CreateQuestionPage.js';
import { SubjectsPage, SubjectItem } from './pages/SubjectsPage.js';
import { ChaptersPage, ChapterItem } from './pages/ChaptersPage.js';
import { TestsPage } from './pages/TestsPage.js';
import { GenerateTestPage } from './pages/GenerateTestPage.js';
import { TestAttemptsPage } from './pages/TestAttemptsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { MediaLibraryPage } from './pages/MediaLibraryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { EditorPage } from './pages/EditorPage.js';
import { TemplatesPage } from './pages/TemplatesPage.js';
import { ScienceLibraryPage } from './pages/ScienceLibraryPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { PaperWizardModal } from './paper/PaperWizardModal.js';
import { QuestionBuilderModal } from './questions/QuestionBuilderModal.js';
import { TemplateGalleryModal } from './templates/TemplateGalleryModal.js';
import { api } from './services/api.js';
import { DocumentModel, Template, Question } from '@eduforge/shared';
import { ThemeProvider } from './state/ThemeContext.js';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentModel[]>([]);

  // Shared frontend state for subjects and chapters
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([
    { name: 'Biology', code: 'BIO', chapters: 28, questions: 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Physics', code: 'PHY', chapters: 32, questions: 0, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { name: 'Chemistry', code: 'CHE', chapters: 26, questions: 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Mathematics', code: 'MAT', chapters: 24, questions: 0, color: 'bg-amber-50 text-amber-700 border-amber-200' }
  ]);

  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([
    { id: 'BIO-CELL-0012', title: 'Cell Structure & Function', subject: 'Biology', count: 0 },
    { id: 'PHY-MOT-0041', title: 'Kinematics & Motion', subject: 'Physics', count: 0 },
    { id: 'CHE-ATOM-0027', title: 'Atomic Structure & Bonding', subject: 'Chemistry', count: 0 },
    { id: 'PHY-ELE-0089', title: 'Electrostatics & Current', subject: 'Physics', count: 0 },
    { id: 'CHE-ORG-0105', title: 'Organic Reaction Mechanisms', subject: 'Chemistry', count: 0 },
    { id: 'BIO-GEN-0054', title: 'Genetics & Inheritance', subject: 'Biology', count: 0 }
  ]);

  const handleAddSubject = (newSub: SubjectItem) => {
    setSubjectsList(prev => [...prev, newSub]);
  };

  const handleEditSubject = (originalCode: string, updatedSub: SubjectItem) => {
    setSubjectsList(prev => prev.map(s => s.code === originalCode ? updatedSub : s));
  };

  const handleAddChapter = (newCh: ChapterItem) => {
    setChaptersList(prev => [newCh, ...prev]);
    // Increment chapter count in target subject
    setSubjectsList(prev =>
      prev.map(s =>
        s.name.toLowerCase() === newCh.subject.toLowerCase()
          ? { ...s, chapters: s.chapters + 1 }
          : s
      )
    );
  };

  const handleEditChapter = (originalId: string, updatedCh: ChapterItem) => {
    setChaptersList(prev => prev.map(c => c.id === originalId ? updatedCh : c));
  };

  const handleDeleteSubject = async (codeOrId: string) => {
    const subObj = subjectsList.find(s => (s as any).code === codeOrId || String((s as any).id) === String(codeOrId));
    const targetId = (subObj as any)?.id || codeOrId;
    setSubjectsList(prev => prev.filter(s => (s as any).code !== codeOrId && String((s as any).id) !== String(codeOrId)));
    try {
      await api.deleteSubject(targetId);
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    setChaptersList(prev => prev.filter(c => String(c.id) !== String(id)));
    try {
      await api.deleteChapter(id);
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    }
  };

  // Pre-warm in-memory caches on startup for instantaneous 0ms loading
  useEffect(() => {
    loadDocs();
    api.getPhysicsChapters().catch(() => {});
    api.getChemistryElements().catch(() => {});
    api.getChemistryNotations().catch(() => {});
    api.getUnits().catch(() => {});
    api.getConstants().catch(() => {});
    api.getTemplates().catch(() => {});
    api.getSymbols().catch(() => {});
  }, []);

  const loadDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [editingQuestionForCreatePage, setEditingQuestionForCreatePage] = useState<Question | null>(null);

  const handleOpenCreatePage = (q?: Question) => {
    setEditingQuestionForCreatePage(q || null);
    setCurrentPage('create');
  };
  const [isPaperWizardOpen, setIsPaperWizardOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const handleOpenDocument = (docId: string) => {
    setActiveDocumentId(docId);
    setCurrentPage('editor');
  };

  const handleCreatePaper = async (newDoc: Partial<DocumentModel>) => {
    try {
      const created = await api.createDocument(newDoc);
      setActiveDocumentId(created.id);
      loadDocs();
      setCurrentPage('tests');
    } catch (err) {
      console.error('Failed to create paper:', err);
      alert('Failed to create paper');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Delete this document?')) {
      try {
        await api.deleteDocument(docId);
        loadDocs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDuplicateDocument = async (docId: string) => {
    try {
      await api.duplicateDocument(docId);
      loadDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTemplateAndCreate = async (tpl: Template) => {
    const newDoc: Partial<DocumentModel> = {
      title: `${tpl.name} - ${new Date().toLocaleDateString()}`,
      templateId: tpl.id,
      settings: tpl.settings,
      metadata: {
        ...tpl.defaultMetadata,
        subject: tpl.defaultMetadata.subject || 'Physics & Chemistry',
        timeAllowedMinutes: tpl.defaultMetadata.timeAllowedMinutes || 180,
        maxMarks: tpl.defaultMetadata.maxMarks || 100
      },
      sections: tpl.defaultSections.map((s, idx) => ({
        id: `sec-${Date.now()}-${idx + 1}`,
        title: s.defaultTitle,
        instructions: s.defaultInstructions,
        marks: s.defaultMarks,
        blocks: []
      }))
    };
    await handleCreatePaper(newDoc);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (currentPage === 'editor' && activeDocumentId) {
    return (
      <EditorPage
        documentId={activeDocumentId}
        onNavigateHome={() => {
          loadDocs();
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  const [activeChapterFilter, setActiveChapterFilter] = useState<{ id?: string; title?: string } | null>(null);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <Header currentPage={currentPage} onLogout={() => setIsAuthenticated(false)} />

        {/* Dynamic Page Views */}
        <main className="flex-1 bg-slate-50 pb-12">
          {currentPage === 'dashboard' && (
            <DashboardPage
              subjectsList={subjectsList}
              chaptersList={chaptersList}
              onOpenDocument={handleOpenDocument}
              onNewPaperWizard={() => setIsPaperWizardOpen(true)}
              onOpenQuestionBuilder={() => handleOpenCreatePage()}
              onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
              onNavigateToQuestionBank={() => setCurrentPage('question_bank')}
              onNavigateToTemplates={() => setCurrentPage('templates')}
              onNavigateToScience={() => setCurrentPage('media_library')}
              onNavigateToReports={() => setCurrentPage('reports')}
            />
          )}

          {currentPage === 'question_bank' && (
            <QuestionBankPage
              onBackToDashboard={() => setCurrentPage('dashboard')}
              onOpenCreateQuestion={q => handleOpenCreatePage(q)}
              selectedChapter={activeChapterFilter}
              onClearChapterFilter={() => setActiveChapterFilter(null)}
            />
          )}

          {currentPage === 'create' && (
            <CreateQuestionPage
              initialQuestion={editingQuestionForCreatePage}
              onBackToQuestionBank={() => {
                setEditingQuestionForCreatePage(null);
                setCurrentPage('question_bank');
              }}
            />
          )}

          {currentPage === 'subjects' && (
            <SubjectsPage
              subjectsList={subjectsList}
              onAddSubject={handleAddSubject}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {currentPage === 'chapters' && (
            <ChaptersPage
              subjectsList={subjectsList}
              chaptersList={chaptersList}
              onAddChapter={handleAddChapter}
              onEditChapter={handleEditChapter}
              onDeleteChapter={handleDeleteChapter}
              onNavigateToQuestionBank={ch => {
                setActiveChapterFilter(ch || null);
                setCurrentPage('question_bank');
              }}
            />
          )}

          {currentPage === 'generate_test' && (
            <GenerateTestPage
              onOpenDocument={handleOpenDocument}
              onNavigateToTests={() => setCurrentPage('tests')}
            />
          )}

          {currentPage === 'tests' && (
            <TestsPage
              documents={documents}
              onOpenDocument={handleOpenDocument}
              onNewPaperWizard={() => setCurrentPage('generate_test')}
              onDeleteDocument={handleDeleteDocument}
              onDuplicateDocument={handleDuplicateDocument}
            />
          )}

          {currentPage === 'test_attempts' && <TestAttemptsPage />}

          {currentPage === 'reports' && <ReportsPage />}

          {currentPage === 'media_library' && <MediaLibraryPage />}

          {currentPage === 'settings' && <SettingsPage />}

          {currentPage === 'templates' && (
            <TemplatesPage
              onBackToDashboard={() => setCurrentPage('dashboard')}
              onUseTemplate={handleSelectTemplateAndCreate}
            />
          )}

          {currentPage === 'science' && (
            <ScienceLibraryPage onBackToDashboard={() => setCurrentPage('dashboard')} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <PaperWizardModal
        isOpen={isPaperWizardOpen}
        onClose={() => setIsPaperWizardOpen(false)}
        onCreatePaper={handleCreatePaper}
      />

      <QuestionBuilderModal
        isOpen={isQuestionBuilderOpen}
        onClose={() => setIsQuestionBuilderOpen(false)}
        onSave={async q => {
          await api.createQuestion(q);
          alert('Question saved to Question Bank!');
        }}
      />

      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={handleSelectTemplateAndCreate}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
