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
import { FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GradientLogo } from '@/components/ui/GradientLogo';

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
    createMergedFeature,
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
    
    const success = await navigateActiveTab(url);
    if (!success) {
      toast({
        title: 'Cannot navigate',
        description: 'This tab cannot be navigated.',
        variant: 'destructive',
      });
    }
  }, [selectedLovableId, navigateActiveTab, toast]);

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
    // MATCHED: hide button (both extension and web)
    if (selectedLovableId && selectedLovableId === detectedLovableId) {
      return null;
    }

    // Extension: show Load for linked projects (never disabled)
    if (isExtension && selectedLovableId && selectedLovableId !== detectedLovableId) {
      return { type: 'load' as const, onAction: handleLoadProject, disabled: false };
    }

    // Web dashboard: show Load for linked projects (opens new tab)
    if (!isExtension && selectedLovableId) {
      return {
        type: 'load' as const,
        onAction: () => window.open(`https://lovable.dev/projects/${selectedLovableId}`, '_blank'),
        disabled: false,
      };
    }

    // UNLINKED + on Lovable: show Link (extension only)
    if (isExtension && !selectedLovableId && detectedLovableId) {
      return { type: 'link' as const, onAction: handleLinkProject, disabled: false };
    }

    return null;
  }, [isExtension, selectedLovableId, detectedLovableId, handleLoadProject, handleLinkProject]);

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
            hasContext ? (
              <Button variant="ghost" size="icon" className="h-6 w-6 relative"
                onClick={() => setIsContextSheetOpen(true)}>
                <FileText className="w-3.5 h-3.5 text-brand-purple" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-purple rounded-full" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm"
                className="h-6 px-2 text-brand-purple hover:text-brand-purple gap-1"
                onClick={() => setIsContextSheetOpen(true)}>
                <Plus className="w-3 h-3" />
                <span className="text-xs font-medium">Add Context</span>
              </Button>
            )
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
            hasContext={hasContext}
            onOpenContext={() => setIsContextSheetOpen(true)}
            projectId={activeProject.id}
            onCreateMergedFeature={(data) => createMergedFeature(activeProject.id, data)}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <GradientLogo size="sm" showText={false} className="justify-center" />
            {isOnLovableHost ? (
              <>
                <h2 className="text-lg font-semibold text-foreground">Ready to build?</h2>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                  Select a project from Lovable to start tracking features.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-foreground">Welcome to LovaLog</h2>
                <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
                  Navigate to a project on Lovable to create your first LovaLog.
                </p>
                <Button
                  className="bg-brand-purple hover:bg-brand-purple/90 text-white"
                  onClick={() => {
                    if (isExtension) {
                      navigateActiveTab('https://lovable.dev/');
                    } else {
                      window.open('https://lovable.dev/', '_blank');
                    }
                  }}
                >
                  Go to Lovable
                </Button>
              </>
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
        totalFeatureCount={activeProject?.features.length || 0}
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
