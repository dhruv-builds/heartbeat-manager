import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useChromeMessaging } from '@/hooks/useChromeMessaging';
import { Header } from '@/components/heartbeat/Header';
import { ProjectSelector } from '@/components/heartbeat/ProjectSelector';
import { FeatureList } from '@/components/heartbeat/FeatureList';
import { FeatureEditor } from '@/components/heartbeat/FeatureEditor';
import { NewProjectDialog } from '@/components/heartbeat/NewProjectDialog';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const {
    projects,
    activeProject,
    setActiveProject,
    createProject,
    updateProject,
    deleteProject,
    createFeature,
    updateFeature,
    deleteFeature,
    reorderFeatures,
    duplicateFeature,
    exportData,
    importData,
    findProjectByName,
  } = useProjects();

  const { isExtension, pageInfo, injectPrompt } = useChromeMessaging();
  const { toast } = useToast();

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [suggestedProjectName, setSuggestedProjectName] = useState<string | null>(null);
  const [isWide, setIsWide] = useState(window.innerWidth >= 600);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-detect Lovable project
  useEffect(() => {
    if (pageInfo?.isLovable && pageInfo.projectName) {
      const existingProject = findProjectByName(pageInfo.projectName);
      if (existingProject) {
        setActiveProject(existingProject.id);
      } else {
        setSuggestedProjectName(pageInfo.projectName);
        setShowNewProjectDialog(true);
      }
    }
  }, [pageInfo, findProjectByName, setActiveProject]);

  const selectedFeature = activeProject?.features.find(f => f.id === selectedFeatureId) || null;

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartbeat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported!',
      description: 'Your Heartbeat data has been downloaded.',
    });
  };

  const handleImport = (json: string) => {
    const success = importData(json);
    if (success) {
      toast({
        title: 'Imported!',
        description: 'Your data has been restored.',
      });
    } else {
      toast({
        title: 'Import failed',
        description: 'The file format was invalid.',
        variant: 'destructive',
      });
    }
  };

  const handleInjectPulse = async (featureId: string) => {
    const feature = activeProject?.features.find(f => f.id === featureId);
    if (!feature?.pulse) return;

    const success = await injectPrompt(feature.pulse);
    
    if (success) {
      toast({
        title: 'Pulse injected!',
        description: isExtension 
          ? 'Your prompt is ready in the chat. Press Enter to send.' 
          : 'Copied to clipboard (dev mode).',
      });
    } else {
      toast({
        title: 'Injection failed',
        description: 'Could not find the Lovable chat input.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateProject = (name: string) => {
    createProject(name);
    setSuggestedProjectName(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onExport={handleExport}
        onImport={handleImport}
        onNewProject={() => {
          setSuggestedProjectName(null);
          setShowNewProjectDialog(true);
        }}
      />

      <ProjectSelector
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        onRenameProject={(id, name) => updateProject(id, { name })}
        onDeleteProject={deleteProject}
      />

      {activeProject ? (
        <div className={`flex-1 flex overflow-hidden ${isWide ? 'flex-row' : 'flex-col'}`}>
          <div className={`${isWide ? 'w-80 border-r border-border' : 'flex-1'} flex flex-col overflow-hidden`}>
            <FeatureList
              features={activeProject.features}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={setSelectedFeatureId}
              onCreateFeature={(title) => {
                const feature = createFeature(activeProject.id, title);
                if (feature) setSelectedFeatureId(feature.id);
              }}
              onUpdateFeature={(featureId, updates) =>
                updateFeature(activeProject.id, featureId, updates)
              }
              onDeleteFeature={(featureId) => {
                deleteFeature(activeProject.id, featureId);
                if (selectedFeatureId === featureId) {
                  setSelectedFeatureId(null);
                }
              }}
              onDuplicateFeature={(featureId) => {
                const newFeature = duplicateFeature(activeProject.id, featureId);
                if (newFeature) setSelectedFeatureId(newFeature.id);
              }}
              onReorderFeatures={(features) => reorderFeatures(activeProject.id, features)}
              onInjectPulse={handleInjectPulse}
              isCompact={!isWide}
            />
          </div>

          {isWide && (
            <FeatureEditor
              feature={selectedFeature}
              onUpdate={(updates) => {
                if (selectedFeatureId && activeProject) {
                  updateFeature(activeProject.id, selectedFeatureId, updates);
                }
              }}
              onInject={() => {
                if (selectedFeatureId) {
                  handleInjectPulse(selectedFeatureId);
                }
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {projects.length === 0
                ? 'Create your first project to get started'
                : 'Select a project to manage features'}
            </p>
            {projects.length === 0 && (
              <button
                onClick={() => setShowNewProjectDialog(true)}
                className="text-heartbeat hover:underline"
              >
                Create a project
              </button>
            )}
          </div>
        </div>
      )}

      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onCreateProject={handleCreateProject}
        suggestedName={suggestedProjectName}
      />
    </div>
  );
}
