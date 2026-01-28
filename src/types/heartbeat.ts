export type FeatureStatus = 'backlog' | 'in-progress' | 'done';

export interface Feature {
  id: string;
  project_id?: string;
  title: string;
  status: FeatureStatus;
  prompt: string;
  order: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  features: Feature[];
  created_at: string;
  updated_at: string;
}

export interface HeartbeatData {
  projects: Project[];
  activeProjectId: string | null;
}

export const DEFAULT_DATA: HeartbeatData = {
  projects: [],
  activeProjectId: null,
};

// Database row types (what comes from Supabase)
export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbFeature {
  id: string;
  project_id: string;
  title: string;
  status: FeatureStatus;
  prompt: string;
  order: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}
