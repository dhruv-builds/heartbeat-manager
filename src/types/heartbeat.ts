export type FeatureStatus = 'backlog' | 'in-progress' | 'done';

export interface Feature {
  id: string;
  title: string;
  status: FeatureStatus;
  pulse: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  features: Feature[];
  createdAt: string;
  updatedAt: string;
}

export interface HeartbeatData {
  projects: Project[];
  activeProjectId: string | null;
}

export const DEFAULT_DATA: HeartbeatData = {
  projects: [],
  activeProjectId: null,
};
