import { supabase, isSupabaseConfigured } from './supabase';
import type { Stage, StageEdge, Cohort, Opportunity } from '../types';

const STORAGE_KEY = 'projections-store';

interface LocalStorageData {
  state: {
    stages: Stage[];
    edges: StageEdge[];
    cohorts: Cohort[];
    opportunities: Opportunity[];
  };
  version?: number;
}

export function hasLocalStorageData(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;

    const parsed = JSON.parse(data) as LocalStorageData;
    const state = parsed.state;

    // Check if there's meaningful data
    return (
      (state.stages?.length > 0) ||
      (state.cohorts?.length > 0) ||
      (state.opportunities?.length > 0)
    );
  } catch {
    return false;
  }
}

export function getLocalStorageData(): LocalStorageData['state'] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data) as LocalStorageData;
    return parsed.state;
  } catch {
    return null;
  }
}

export async function migrateLocalStorage(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot migrate');
    return null;
  }

  const localData = getLocalStorageData();
  if (!localData) {
    console.warn('No local data to migrate');
    return null;
  }

  try {
    // Create new project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: 'Imported Project',
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Error creating project:', projectError);
      return null;
    }

    // Create project data
    const { error: dataError } = await supabase.from('project_data').insert({
      project_id: project.id,
      stages: localData.stages || [],
      edges: localData.edges || [],
      cohorts: localData.cohorts || [],
      opportunities: localData.opportunities || [],
    });

    if (dataError) {
      console.error('Error creating project data:', dataError);
      // Clean up project
      await supabase.from('projects').delete().eq('id', project.id);
      return null;
    }

    // Clear localStorage after successful migration
    clearLocalStorage();

    return project.id;
  } catch (error) {
    console.error('Migration error:', error);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('Failed to clear localStorage');
  }
}
