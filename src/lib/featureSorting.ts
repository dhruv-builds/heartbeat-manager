import { Feature } from '@/types/heartbeat';

// Status priority for active section
const STATUS_PRIORITY: Record<string, number> = {
  'next': 0,
  'backlog': 1,
};

// Filter functions
export function getActiveFeatures(features: Feature[]): Feature[] {
  return features.filter(f => f.status !== 'done');
}

export function getCompletedFeatures(features: Feature[]): Feature[] {
  return features.filter(f => f.status === 'done');
}

// Sorting functions
export function sortActiveFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    // 1. Status priority: 'next' first, 'backlog' second
    const statusDiff = (STATUS_PRIORITY[a.status] ?? 1) - (STATUS_PRIORITY[b.status] ?? 1);
    if (statusDiff !== 0) return statusDiff;
    
    // 2. Manual order ascending
    const orderDiff = a.order - b.order;
    if (orderDiff !== 0) return orderDiff;
    
    // 3. Updated at DESC (most recent first)
    const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updatedDiff !== 0) return updatedDiff;
    
    // 4. Created at ASC (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function sortCompletedFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    // 1. Updated at DESC (most recently completed first)
    const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updatedDiff !== 0) return updatedDiff;
    
    // 2. Created at DESC (tie-breaker)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
