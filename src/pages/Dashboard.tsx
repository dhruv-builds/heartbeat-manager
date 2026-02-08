import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useChromeMessaging } from '@/hooks/useChromeMessaging';
import { Header } from '@/components/heartbeat/Header';
import { ProjectSelector } from '@/components/heartbeat/ProjectSelector';
import { FeatureList } from '@/components/heartbeat/FeatureList';
import { FeatureDetailSheet } from '@/components/heartbeat/FeatureDetailSheet';
import { NewProjectDialog } from '@/components/heartbeat/NewProjectDialog';
import { CreditsBadge } from '@/components/heartbeat/CreditsBadge';
import { ProjectContextSheet } from '@/components/heartbeat/ProjectContextSheet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const {
    projects,
    activeProject,
    loading,
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
    findProjectByLovableId,
    linkProject,
    updateProjectContext,
  } = useProjects();

  const { 
    isExtension, 
    pageInfo, 
    checkCurrentPage, 
    injectPrompt,
    detectedLovableId,
    isOnLovableHost,
    isRestrictedTab,
    navigateActiveTab,
  } = useChromeMessaging();
  const { toast } = useToast();

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [suggestedProjectName, setSuggestedProjectName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);

  const hasContext = !!activeProject?.context_content;

  // Auto-detect Lovable project on initial load and when tab changes
  useEffect(() => {
    // Only run after projects are loaded
    if (loading) return;
    
    // Check for lovable_project_id match first (linked projects)
    if (detectedLovableId) {
      const matchByLovableId = findProjectByLovableId(detectedLovableId);
      if (matchByLovableId) {
        setActiveProject(matchByLovableId.id);
        return;
      }
    }
    
    // Fallback to existing name-based matching (pageInfo.projectName)
    if (pageInfo?.isLovable && pageInfo.projectName) {
      const existingProject = findProjectByName(pageInfo.projectName);
      if (existingProject) {
        setActiveProject(existingProject.id);
      } else {
        setSuggestedProjectName(pageInfo.projectName);
        setShowNewProjectDialog(true);
      }
    }
  }, [detectedLovableId, pageInfo, findProjectByLovableId, findProjectByName, setActiveProject, loading]);

  // Compute inline action state for extension
  const selectedLovableId = activeProject?.lovable_project_id || null;

  const handleLoadProject = useCallback(async () => {
    if (!selectedLovableId) return;
    
    const url = `https://lovable.dev/projects/${selectedLovableId}`;
    
    // Confirm if not already on Lovable
    if (!isOnLovableHost) {
      const confirmed = window.confirm('This will replace the current page. Continue?');
      if (!confirmed) return;
    }
    
    const success = await navigateActiveTab(url);
    if (!success) {
      toast({
        title: 'Cannot navigate',
        description: 'This tab cannot be navigated.',
        variant: 'destructive',
      });
    }
  }, [selectedLovableId, isOnLovableHost, navigateActiveTab, toast]);

  const handleLinkProject = useCallback(async () => {
    if (!activeProject || !detectedLovableId) return;
    
    const success = await linkProject(activeProject.id, detectedLovableId);
    
    if (success) {
      toast({
        title: 'Project linked!',
        description: `"${activeProject.name}" is now linked to this Lovable project.`,
      });
    } else {
      toast({
        title: 'Link failed',
        description: 'Could not save the link. Please try again.',
        variant: 'destructive',
      });
    }
  }, [activeProject, detectedLovableId, linkProject, toast]);

  const inlineAction = useMemo(() => {
    if (!isExtension) return null;
    
    // MATCHED: no button
    if (selectedLovableId && selectedLovableId === detectedLovableId) {
      return null;
    }
    
    // MISMATCH: show Load
    if (selectedLovableId && selectedLovableId !== detectedLovableId) {
      return {
        type: 'load' as const,
        onAction: handleLoadProject,
        disabled: isRestrictedTab,
      };
    }
    
    // UNLINKED + on Lovable: show Link
    if (!selectedLovableId && detectedLovableId) {
      return {
        type: 'link' as const,
        onAction: handleLinkProject,
        disabled: false,
      };
    }
    
    // UNLINKED + not on Lovable: no button
    return null;
  }, [isExtension, selectedLovableId, detectedLovableId, isRestrictedTab, handleLoadProject, handleLinkProject]);

  const selectedFeature = activeProject?.features.find(f => f.id === selectedFeatureId) || null;

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const info = await checkCurrentPage();
      
      if (info?.isLovable && info.projectName) {
        const existingProject = findProjectByName(info.projectName);
        if (existingProject) {
          setActiveProject(existingProject.id);
          toast({
            title: 'Synced!',
            description: `Switched to "${info.projectName}"`,
          });
        } else {
          setSuggestedProjectName(info.projectName);
          setShowNewProjectDialog(true);
          toast({
            title: 'New project detected',
            description: `"${info.projectName}" - Create it to start tracking features.`,
          });
        }
      } else {
        toast({
          title: 'Synced',
          description: 'No Lovable project detected on current page.',
        });
      }
    } catch (e) {
      toast({
        title: 'Sync failed',
        description: 'Could not connect to the current page.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lavalog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported!',
      description: 'Your LavaLog data has been downloaded.',
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

  const handleInjectPrompt = async (featureId: string): Promise<boolean> => {
    const feature = activeProject?.features.find(f => f.id === featureId);
    if (!feature?.prompt) return false;

    const success = await injectPrompt(feature.prompt);
    
    if (success) {
      toast({
        title: 'Prompt injected!',
        description: isExtension 
          ? 'Your prompt is ready in the chat. Press Enter to send.' 
          : 'Copied to clipboard (dev mode).',
      });
    } else {
      toast({
        title: 'Injection failed',
        description: 'Could not find the Lovable chat input. Make sure you\'re on a Lovable project page with the chat visible.',
        variant: 'destructive',
      });
    }
    
    return success;
  };

  const handleCreateProject = (name: string) => {
    createProject(name);
    setSuggestedProjectName(null);
  };

  const handleSelectFeature = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setIsDetailSheetOpen(true);
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
        onSync={handleSync}
        isSyncing={isSyncing}
      />

{/* Credits + Project Selector Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Project
          </span>
          {activeProject && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 relative"
              onClick={() => setIsContextSheetOpen(true)}
            >
              <FileText className={cn("w-3.5 h-3.5", hasContext ? "text-brand-purple" : "text-muted-foreground")} />
              {hasContext && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-purple rounded-full" />}
            </Button>
          )}
        </div>
        {isExtension && <CreditsBadge />}
      </div>

      <ProjectSelector
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        onRenameProject={(id, name) => updateProject(id, { name })}
        onDeleteProject={deleteProject}
        inlineAction={inlineAction}
      />

      {activeProject ? (
        <div className={cn("flex-1 flex flex-col overflow-hidden", !isExtension && "pb-32")}>
<FeatureList
            features={activeProject.features}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={handleSelectFeature}
            onCreateFeature={async (title) => {
              const feature = await createFeature(activeProject.id, title);
              if (feature) {
                setSelectedFeatureId(feature.id);
                setIsDetailSheetOpen(true);
              }
            }}
            onUpdateFeature={(featureId, updates) =>
              updateFeature(activeProject.id, featureId, updates)
            }
            onDeleteFeature={(featureId) => {
              deleteFeature(activeProject.id, featureId);
              if (selectedFeatureId === featureId) {
                setSelectedFeatureId(null);
                setIsDetailSheetOpen(false);
              }
            }}
            onDuplicateFeature={async (featureId) => {
              const newFeature = await duplicateFeature(activeProject.id, featureId);
              if (newFeature) {
                setSelectedFeatureId(newFeature.id);
                setIsDetailSheetOpen(true);
              }
            }}
            onReorderFeatures={(features) => reorderFeatures(activeProject.id, features)}
            onInjectPrompt={handleInjectPrompt}
            isExtension={isExtension}
          />
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
                className="text-brand-purple hover:underline"
              >
                Create a project
              </button>
            )}
          </div>
        </div>
      )}

<FeatureDetailSheet
        feature={selectedFeature}
        existingFeatures={activeProject?.features || []}
        projectContext={activeProject?.context_content}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        onUpdate={(updates) => {
          if (selectedFeatureId && activeProject) {
            updateFeature(activeProject.id, selectedFeatureId, updates);
          }
        }}
        onInject={() => selectedFeatureId ? handleInjectPrompt(selectedFeatureId) : Promise.resolve(false)}
        isExtension={isExtension}
      />

      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onCreateProject={handleCreateProject}
        suggestedName={suggestedProjectName}
      />

      <ProjectContextSheet
        open={isContextSheetOpen}
        onOpenChange={setIsContextSheetOpen}
        project={activeProject}
        onSaveContext={async (content, fileName) => {
          if (!activeProject) return false;
          return updateProjectContext(activeProject.id, content, fileName);
        }}
        isExtension={isExtension}
        onInjectPrompt={async (text) => {
          const success = await injectPrompt(text);
          return success;
        }}
      />
    </div>
  );
}
