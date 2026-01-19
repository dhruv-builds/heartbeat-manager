import { useState, useEffect, useCallback } from 'react';
import { HeartbeatData, Project, Feature, FeatureStatus, DEFAULT_DATA } from '@/types/heartbeat';

const STORAGE_KEY = 'heartbeat-data';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadData(): HeartbeatData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load Heartbeat data:', e);
  }
  return DEFAULT_DATA;
}

function saveData(data: HeartbeatData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save Heartbeat data:', e);
  }
}

export function useProjects() {
  const [data, setData] = useState<HeartbeatData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const activeProject = data.projects.find(p => p.id === data.activeProjectId) || null;

  const setActiveProject = useCallback((projectId: string | null) => {
    setData(prev => ({ ...prev, activeProjectId: projectId }));
  }, []);

  const createProject = useCallback((name: string): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      name,
      features: [],
      createdAt: now,
      updatedAt: now,
    };
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
      activeProjectId: newProject.id,
    }));
    return newProject;
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Pick<Project, 'name'>>) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      activeProjectId: prev.activeProjectId === projectId ? null : prev.activeProjectId,
    }));
  }, []);

  const createFeature = useCallback((projectId: string, title: string): Feature | null => {
    const now = new Date().toISOString();
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return null;

    const newFeature: Feature = {
      id: generateId(),
      title,
      status: 'backlog',
      prompt: '',
      order: project.features.length,
      createdAt: now,
      updatedAt: now,
    };

    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, features: [...p.features, newFeature], updatedAt: now }
          : p
      ),
    }));

    return newFeature;
  }, [data.projects]);

  const updateFeature = useCallback((
    projectId: string,
    featureId: string,
    updates: Partial<Pick<Feature, 'title' | 'status' | 'prompt'>>
  ) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              features: p.features.map(f =>
                f.id === featureId
                  ? { ...f, ...updates, updatedAt: new Date().toISOString() }
                  : f
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
  }, []);

  const deleteFeature = useCallback((projectId: string, featureId: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              features: p.features.filter(f => f.id !== featureId),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
  }, []);

  const reorderFeatures = useCallback((projectId: string, features: Feature[]) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              features: features.map((f, idx) => ({ ...f, order: idx })),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
  }, []);

  const duplicateFeature = useCallback((projectId: string, featureId: string): Feature | null => {
    const project = data.projects.find(p => p.id === projectId);
    const feature = project?.features.find(f => f.id === featureId);
    if (!feature) return null;

    const now = new Date().toISOString();
    const newFeature: Feature = {
      ...feature,
      id: generateId(),
      title: `${feature.title} (copy)`,
      order: project!.features.length,
      createdAt: now,
      updatedAt: now,
    };

    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, features: [...p.features, newFeature], updatedAt: now }
          : p
      ),
    }));

    return newFeature;
  }, [data.projects]);

  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString) as HeartbeatData;
      if (!imported.projects || !Array.isArray(imported.projects)) {
        throw new Error('Invalid data format');
      }
      setData(imported);
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }, []);

  const findProjectByName = useCallback((name: string): Project | null => {
    return data.projects.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }, [data.projects]);

  return {
    data,
    projects: data.projects,
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
  };
}
