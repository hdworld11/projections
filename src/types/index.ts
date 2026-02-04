export interface Stage {
  id: string;
  name: string;
  isTerminal: boolean;
}

export interface StageEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Cohort {
  id: string;
  name: string;
  color: string;
  entries: Record<string, number>; // stageId -> volume (supports multiple entry points)
  conversionRates: Record<string, number>; // edgeId -> rate (0–1)
}

/** Helper: total entry volume across all entry points */
export function totalEntryVolume(cohort: Cohort): number {
  return Object.values(cohort.entries).reduce((s, v) => s + v, 0);
}

export type OpportunityMode = 'rate' | 'absolute';

export interface Opportunity {
  id: string;
  name: string;
  mode: OpportunityMode;
  // "rate" mode: set a new target conversion % on an edge
  edgeId: string;        // which transition it affects
  targetRate: number;    // the new conversion rate (0–1), e.g. 0.45 = 45%
  // "absolute" mode: add N new customers to a stage
  targetStageId: string; // which stage gets the new customers
  absoluteCount: number; // how many new customers
  // common
  cohortIds: string[];   // empty = applies to all
  likelihood: number;    // 0–1
  enabled: boolean;
  // legacy (kept for migration)
  improvement?: number;
}

export interface ProjectionResult {
  cohortId: string;
  baselineConversion: number;
  projectedConversion: number;
  baselinePaid: number;
  projectedPaid: number;
  delta: number;
  perOpportunity: {
    opportunityId: string;
    contribution: number; // weighted absolute lift
  }[];
}
