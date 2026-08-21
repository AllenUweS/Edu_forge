import React, { useState } from 'react';
import { Navbar, PageView } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EditorPage } from './pages/EditorPage.js';
import { QuestionBankPage } from './pages/QuestionBankPage.js';
import { TemplatesPage } from './pages/TemplatesPage.js';
import { ScienceLibraryPage } from './pages/ScienceLibraryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { PaperWizardModal } from './paper/PaperWizardModal.js';
import { QuestionBuilderModal } from './questions/QuestionBuilderModal.js';
import { TemplateGalleryModal } from './templates/TemplateGalleryModal.js';
import { api } from './services/api.js';
import { DocumentModel, Template } from '@eduforge/shared';
import { ThemeProvider, useTheme } from './state/ThemeContext.js';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const { theme } = useTheme();

  // Pre-warm in-memory caches on startup for instantaneous 0ms loading
  React.useEffect(() => {
    api.getPhysicsChapters().catch(() => {});
    api.getChemistryElements().catch(() => {});
    api.getChemistryNotations().catch(() => {});
    api.getUnits().catch(() => {});
    api.getConstants().catch(() => {});
    api.getTemplates().catch(() => {});
    api.getSymbols().catch(() => {});
  }, []);

  // Global wizard modals
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
      setCurrentPage('editor');
    } catch (err) {
      console.error('Failed to create paper:', err);
      alert('Failed to create paper');
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

  // Background style based on theme
  const getAppBgClass = () => {
    if (theme === 'white') return 'bg-slate-100 text-slate-900';
    if (theme === 'dark-blue') return 'bg-[#070e1e] text-slate-100';
    return 'bg-[#0f172a] text-slate-100'; // dark default
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${getAppBgClass()}`}>
      
      {/* Top Navbar */}
      {currentPage !== 'editor' && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onNewPaper={() => setIsPaperWizardOpen(true)}
        />
      )}

      {/* Main Page View */}
      <div className="flex-1">
        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenDocument={handleOpenDocument}
            onNewPaperWizard={() => setIsPaperWizardOpen(true)}
            onOpenQuestionBuilder={() => setIsQuestionBuilderOpen(true)}
            onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
            onNavigateToQuestionBank={() => setCurrentPage('question_bank')}
            onNavigateToTemplates={() => setCurrentPage('templates')}
            onNavigateToScience={() => setCurrentPage('science')}
          />
        )}

        {currentPage === 'editor' && activeDocumentId && (
          <EditorPage
            documentId={activeDocumentId}
            onNavigateHome={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'question_bank' && (
          <QuestionBankPage
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'templates' && (
          <TemplatesPage
            onBackToDashboard={() => setCurrentPage('dashboard')}
            onUseTemplate={handleSelectTemplateAndCreate}
          />
        )}

        {currentPage === 'science' && (
          <ScienceLibraryPage
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}
      </div>

      {/* Modals */}
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
