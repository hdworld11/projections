import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Stage, StageEdge, Cohort, Opportunity } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppState {
  stages: Stage[];
  edges: StageEdge[];
  cohorts: Cohort[];
  opportunities: Opportunity[];
  selectedCohortId: string | null;
  activeTab: 'funnel' | 'impact';
  currentProjectId: string | null;

  // Stage actions
  addStage: (name: string, isTerminal?: boolean) => Stage;
  updateStage: (id: string, updates: Partial<Omit<Stage, 'id'>>) => void;
  removeStage: (id: string) => void;

  // Edge actions
  addEdge: (sourceId: string, targetId: string) => StageEdge | null;
  removeEdge: (id: string) => void;

  // Cohort actions
  addCohort: (name: string) => void;
  updateCohort: (id: string, updates: Partial<Omit<Cohort, 'id'>>) => void;
  removeCohort: (id: string) => void;
  setConversionRate: (cohortId: string, edgeId: string, rate: number) => void;
  setCohortEntry: (cohortId: string, stageId: string, volume: number) => void;
  removeCohortEntry: (cohortId: string, stageId: string) => void;

  // Opportunity actions
  addOpportunity: (opp: Omit<Opportunity, 'id'>) => void;
  updateOpportunity: (id: string, updates: Partial<Omit<Opportunity, 'id'>>) => void;
  removeOpportunity: (id: string) => void;
  toggleOpportunity: (id: string) => void;

  // UI actions
  setSelectedCohortId: (id: string | null) => void;
  setActiveTab: (tab: 'funnel' | 'impact') => void;

  // Supabase sync actions
  setCurrentProjectId: (id: string | null) => void;
  loadFromSupabase: (projectId: string) => Promise<void>;
  saveToSupabase: (projectId: string) => Promise<void>;
  loadSharedData: (data: {
    stages: Stage[];
    edges: StageEdge[];
    cohorts: Cohort[];
    opportunities: Opportunity[];
  }) => void;
}

const COHORT_COLORS = [
  '#4f46e5', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#be185d', '#65a30d',
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      stages: [],
      edges: [],
      cohorts: [],
      opportunities: [],
      selectedCohortId: null,
      activeTab: 'funnel',
      currentProjectId: null,

      addStage: (name, isTerminal = false) => {
        const stage: Stage = { id: uuid(), name, isTerminal };
        set((s) => ({ stages: [...s.stages, stage] }));
        return stage;
      },

      updateStage: (id, updates) =>
        set((s) => ({
          stages: s.stages.map((st) => (st.id === id ? { ...st, ...updates } : st)),
        })),

      removeStage: (id) =>
        set((s) => ({
          stages: s.stages.filter((st) => st.id !== id),
          edges: s.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
          cohorts: s.cohorts.map((c) => {
            const { [id]: _, ...rest } = c.entries;
            return { ...c, entries: rest };
          }),
        })),

      addEdge: (sourceId, targetId) => {
        const existing = get().edges.find(
          (e) => e.sourceId === sourceId && e.targetId === targetId,
        );
        if (existing) return null;
        const edge: StageEdge = { id: uuid(), sourceId, targetId };
        set((s) => ({ edges: [...s.edges, edge] }));
        return edge;
      },

      removeEdge: (id) =>
        set((s) => ({
          edges: s.edges.filter((e) => e.id !== id),
          cohorts: s.cohorts.map((c) => {
            const { [id]: _, ...rest } = c.conversionRates;
            return { ...c, conversionRates: rest };
          }),
          opportunities: s.opportunities.filter((o) => o.edgeId !== id),
        })),

      addCohort: (name) => {
        const color = COHORT_COLORS[get().cohorts.length % COHORT_COLORS.length];
        const firstStageId = get().stages[0]?.id;
        const cohort: Cohort = {
          id: uuid(),
          name,
          color,
          entries: firstStageId ? { [firstStageId]: 10000 } : {},
          conversionRates: {},
        };
        set((s) => ({ cohorts: [...s.cohorts, cohort] }));
      },

      updateCohort: (id, updates) =>
        set((s) => ({
          cohorts: s.cohorts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeCohort: (id) =>
        set((s) => ({
          cohorts: s.cohorts.filter((c) => c.id !== id),
          opportunities: s.opportunities.map((o) => ({
            ...o,
            cohortIds: o.cohortIds.filter((cid) => cid !== id),
          })),
          selectedCohortId: s.selectedCohortId === id ? null : s.selectedCohortId,
        })),

      setConversionRate: (cohortId, edgeId, rate) =>
        set((s) => ({
          cohorts: s.cohorts.map((c) =>
            c.id === cohortId
              ? { ...c, conversionRates: { ...c.conversionRates, [edgeId]: rate } }
              : c,
          ),
        })),

      setCohortEntry: (cohortId, stageId, volume) =>
        set((s) => ({
          cohorts: s.cohorts.map((c) =>
            c.id === cohortId
              ? { ...c, entries: { ...c.entries, [stageId]: volume } }
              : c,
          ),
        })),

      removeCohortEntry: (cohortId, stageId) =>
        set((s) => ({
          cohorts: s.cohorts.map((c) => {
            if (c.id !== cohortId) return c;
            const { [stageId]: _, ...rest } = c.entries;
            return { ...c, entries: rest };
          }),
        })),

      addOpportunity: (opp) =>
        set((s) => ({
          opportunities: [...s.opportunities, { ...opp, id: uuid() }],
        })),

      updateOpportunity: (id, updates) =>
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? { ...o, ...updates } : o,
          ),
        })),

      removeOpportunity: (id) =>
        set((s) => ({
          opportunities: s.opportunities.filter((o) => o.id !== id),
        })),

      toggleOpportunity: (id) =>
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? { ...o, enabled: !o.enabled } : o,
          ),
        })),

      setSelectedCohortId: (id) => set({ selectedCohortId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Supabase sync
      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      loadFromSupabase: async (projectId: string) => {
        if (!isSupabaseConfigured) return;

        const { data, error } = await supabase
          .from('project_data')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error) {
          // If no data exists yet, that's okay - project was just created
          if (error.code !== 'PGRST116') {
            console.error('Error loading project data:', error);
          }
          return;
        }

        if (data) {
          set({
            stages: data.stages || [],
            edges: data.edges || [],
            cohorts: data.cohorts || [],
            opportunities: data.opportunities || [],
            currentProjectId: projectId,
          });
        }
      },

      saveToSupabase: async (projectId: string) => {
        if (!isSupabaseConfigured) return;

        const { stages, edges, cohorts, opportunities } = get();

        const { error } = await supabase
          .from('project_data')
          .upsert(
            {
              project_id: projectId,
              stages,
              edges,
              cohorts,
              opportunities,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'project_id' }
          );

        if (error) {
          console.error('Error saving project data:', error);
          throw error;
        }

        // Also update project's updated_at
        await supabase
          .from('projects')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', projectId);
      },

      loadSharedData: (data) => {
        set({
          stages: data.stages,
          edges: data.edges,
          cohorts: data.cohorts,
          opportunities: data.opportunities,
          currentProjectId: null,
        });
      },
    }),
    {
      name: 'projections-store',
      version: 2,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        // Migrate cohorts from old single-entry format to multi-entry
        if (Array.isArray(state.cohorts)) {
          state.cohorts = (state.cohorts as Record<string, unknown>[]).map((c) => {
            if (!c.entries && typeof c.entryStageId === 'string') {
              const entries: Record<string, number> = {};
              if (c.entryStageId && typeof c.entryVolume === 'number') {
                entries[c.entryStageId as string] = c.entryVolume as number;
              }
              const { entryStageId: _, entryVolume: __, ...rest } = c;
              return { ...rest, entries };
            }
            return c;
          });
        }
        // Migrate opportunities from old improvement format to mode-based
        if (Array.isArray(state.opportunities)) {
          state.opportunities = (state.opportunities as Record<string, unknown>[]).map((o) => {
            if (!o.mode) {
              const improvement = (o.improvement as number) ?? 0;
              return {
                ...o,
                mode: 'rate',
                targetRate: improvement, // will be approximate; user can fix
                targetStageId: '',
                absoluteCount: 0,
              };
            }
            return o;
          });
        }
        return state;
      },
    },
  ),
);
