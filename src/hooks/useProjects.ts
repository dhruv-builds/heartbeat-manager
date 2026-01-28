import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Project, Feature, FeatureStatus } from '@/types/heartbeat';

// Use 'any' for Supabase queries since we're connecting to an external Supabase
// whose types aren't in the auto-generated types file

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Fetch projects and features from Supabase
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projectsError) throw projectsError;

      // Fetch all features for user's projects
      const projectIds = projectsData?.map((p: any) => p.id) || [];
      let featuresData: any[] = [];

      if (projectIds.length > 0) {
        const { data, error: featuresError } = await (supabase as any)
          .from('features')
          .select('*')
          .in('project_id', projectIds)
          .order('order', { ascending: true });

        if (featuresError) throw featuresError;
        featuresData = data || [];
      }

      // Combine projects with their features
      const projectsWithFeatures: Project[] = (projectsData || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        created_at: p.created_at,
        updated_at: p.updated_at,
        features: featuresData
          .filter((f: any) => f.project_id === p.id)
          .map((f: any) => ({
            id: f.id,
            project_id: f.project_id,
            title: f.title,
            status: f.status as FeatureStatus,
            prompt: f.prompt,
            order: f.order,
            image_url: f.image_url,
            created_at: f.created_at,
            updated_at: f.updated_at,
          })),
      }));

      setProjects(projectsWithFeatures);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const setActiveProject = useCallback((projectId: string | null) => {
    setActiveProjectId(projectId);
  }, []);

  const createProject = useCallback(async (name: string): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      const newProject: Project = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        features: [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, [user]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Pick<Project, 'name'>>) => {
    try {
      const { error } = await (supabase as any)
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        )
      );
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }, [activeProjectId]);

  const createFeature = useCallback(async (projectId: string, title: string): Promise<Feature | null> => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('features')
        .insert({
          project_id: projectId,
          title,
          status: 'backlog',
          prompt: '',
          order: project.features.length,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      const newFeature: Feature = {
        id: data.id,
        project_id: data.project_id,
        title: data.title,
        status: data.status as FeatureStatus,
        prompt: data.prompt,
        order: data.order,
        image_url: data.image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, features: [...p.features, newFeature], updated_at: new Date().toISOString() }
            : p
        )
      );

      return newFeature;
    } catch (error) {
      console.error('Error creating feature:', error);
      return null;
    }
  }, [projects]);

  const updateFeature = useCallback(async (
    projectId: string,
    featureId: string,
    updates: Partial<Pick<Feature, 'title' | 'status' | 'prompt' | 'image_url'>>
  ) => {
    try {
      const { error } = await (supabase as any)
        .from('features')
        .update(updates)
        .eq('id', featureId);

      if (error) throw error;

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                features: p.features.map(f =>
                  f.id === featureId
                    ? { ...f, ...updates, updated_at: new Date().toISOString() }
                    : f
                ),
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  }, []);

  const deleteFeature = useCallback(async (projectId: string, featureId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                features: p.features.filter(f => f.id !== featureId),
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  }, []);

  const reorderFeatures = useCallback(async (projectId: string, features: Feature[]) => {
    // Optimistic update
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              features: features.map((f, idx) => ({ ...f, order: idx })),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    // Update in database
    try {
      for (let i = 0; i < features.length; i++) {
        await (supabase as any)
          .from('features')
          .update({ order: i })
          .eq('id', features[i].id);
      }
    } catch (error) {
      console.error('Error reordering features:', error);
      // Refetch on error
      fetchProjects();
    }
  }, [fetchProjects]);

  const duplicateFeature = useCallback(async (projectId: string, featureId: string): Promise<Feature | null> => {
    const project = projects.find(p => p.id === projectId);
    const feature = project?.features.find(f => f.id === featureId);
    if (!feature || !project) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('features')
        .insert({
          project_id: projectId,
          title: `${feature.title} (copy)`,
          status: feature.status,
          prompt: feature.prompt,
          image_url: feature.image_url,
          order: project.features.length,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      const newFeature: Feature = {
        id: data.id,
        project_id: data.project_id,
        title: data.title,
        status: data.status as FeatureStatus,
        prompt: data.prompt,
        order: data.order,
        image_url: data.image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, features: [...p.features, newFeature], updated_at: new Date().toISOString() }
            : p
        )
      );

      return newFeature;
    } catch (error) {
      console.error('Error duplicating feature:', error);
      return null;
    }
  }, [projects]);

  const exportData = useCallback((): string => {
    return JSON.stringify({ projects, activeProjectId }, null, 2);
  }, [projects, activeProjectId]);

  const importData = useCallback(async (jsonString: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const imported = JSON.parse(jsonString);
      if (!imported.projects || !Array.isArray(imported.projects)) {
        throw new Error('Invalid data format');
      }

      // Import each project and its features
      for (const project of imported.projects) {
        const { data: newProject, error: projectError } = await (supabase as any)
          .from('projects')
          .insert({ name: project.name, user_id: user.id })
          .select()
          .single();

        if (projectError) throw projectError;
        if (!newProject) continue;

        if (project.features && project.features.length > 0) {
          const features = project.features.map((f: any, idx: number) => ({
            project_id: newProject.id,
            title: f.title,
            status: f.status || 'backlog',
            prompt: f.prompt || '',
            order: idx,
          }));

          const { error: featuresError } = await (supabase as any)
            .from('features')
            .insert(features);

          if (featuresError) throw featuresError;
        }
      }

      await fetchProjects();
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }, [user, fetchProjects]);

  const findProjectByName = useCallback((name: string): Project | null => {
    return projects.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }, [projects]);

  return {
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
    refetch: fetchProjects,
  };
}
