import type { Stage, StageEdge, Cohort, Opportunity, ProjectionResult } from '../types';
import { totalEntryVolume } from '../types';

/**
 * Topologically sort stages so we process parents before children.
 */
function topoSort(stages: Stage[], edges: StageEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const s of stages) {
    inDegree.set(s.id, 0);
    adj.set(s.id, []);
  }
  for (const e of edges) {
    adj.get(e.sourceId)?.push(e.targetId);
    inDegree.set(e.targetId, (inDegree.get(e.targetId) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const child of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(child) ?? 1) - 1;
      inDegree.set(child, newDeg);
      if (newDeg === 0) queue.push(child);
    }
  }
  return sorted;
}

/**
 * Walk the funnel DAG for a single cohort, returning volume at each stage.
 * Supports rate overrides and extra volume injections at specific stages.
 */
function walkFunnel(
  stages: Stage[],
  edges: StageEdge[],
  cohort: Cohort,
  rateOverrides?: Record<string, number>,
  volumeInjections?: Record<string, number>,
): Map<string, number> {
  const order = topoSort(stages, edges);
  const volumes = new Map<string, number>();

  // Initialise all to 0, then seed entry volumes
  for (const id of order) volumes.set(id, 0);
  for (const [stageId, vol] of Object.entries(cohort.entries)) {
    volumes.set(stageId, (volumes.get(stageId) ?? 0) + vol);
  }

  // Add volume injections (from absolute-mode opportunities)
  if (volumeInjections) {
    for (const [stageId, vol] of Object.entries(volumeInjections)) {
      volumes.set(stageId, (volumes.get(stageId) ?? 0) + vol);
    }
  }

  const rates = rateOverrides
    ? { ...cohort.conversionRates, ...rateOverrides }
    : cohort.conversionRates;

  for (const stageId of order) {
    const vol = volumes.get(stageId) ?? 0;
    if (vol === 0) continue;

    const outEdges = edges.filter((e) => e.sourceId === stageId);
    for (const edge of outEdges) {
      const rate = Math.min(1, Math.max(0, rates[edge.id] ?? 0));
      volumes.set(edge.targetId, (volumes.get(edge.targetId) ?? 0) + vol * rate);
    }
  }

  return volumes;
}

/**
 * Compute per-stage volumes for a single cohort (for display on the canvas).
 */
export function computeStageVolumes(
  stages: Stage[],
  edges: StageEdge[],
  cohort: Cohort,
): Map<string, number> {
  return walkFunnel(stages, edges, cohort);
}

/**
 * Sum volumes at terminal (paid) stages.
 */
function terminalVolume(stages: Stage[], volumes: Map<string, number>): number {
  return stages
    .filter((s) => s.isTerminal)
    .reduce((sum, s) => sum + (volumes.get(s.id) ?? 0), 0);
}

/**
 * Build rate overrides and volume injections from opportunities for a given cohort.
 */
function applyOpportunities(
  cohort: Cohort,
  opps: Opportunity[],
): { rateOverrides: Record<string, number>; volumeInjections: Record<string, number> } {
  const rateOverrides: Record<string, number> = {};
  const volumeInjections: Record<string, number> = {};

  for (const opp of opps) {
    const applies =
      opp.cohortIds.length === 0 || opp.cohortIds.includes(cohort.id);
    if (!applies) continue;

    if (opp.mode === 'absolute') {
      // Add weighted new customers to the target stage
      const existing = volumeInjections[opp.targetStageId] ?? 0;
      volumeInjections[opp.targetStageId] = existing + opp.absoluteCount * opp.likelihood;
    } else {
      // Rate mode: set conversion to targetRate (weighted by likelihood)
      const baseRate = cohort.conversionRates[opp.edgeId] ?? 0;
      const improvement = (opp.targetRate - baseRate) * opp.likelihood;
      const current = rateOverrides[opp.edgeId] ?? baseRate;
      rateOverrides[opp.edgeId] = current + improvement;
    }
  }

  return { rateOverrides, volumeInjections };
}

/**
 * Compute projections for all cohorts.
 */
export function computeProjections(
  stages: Stage[],
  edges: StageEdge[],
  cohorts: Cohort[],
  opportunities: Opportunity[],
): ProjectionResult[] {
  const enabledOpps = opportunities.filter((o) => o.enabled);

  return cohorts.map((cohort) => {
    const entry = totalEntryVolume(cohort);

    // Baseline (no opportunities)
    const baseVols = walkFunnel(stages, edges, cohort);
    const baselinePaid = terminalVolume(stages, baseVols);
    const baselineConversion = entry > 0 ? baselinePaid / entry : 0;

    // Combined projection (all enabled opportunities)
    const { rateOverrides, volumeInjections } = applyOpportunities(cohort, enabledOpps);
    const projVols = walkFunnel(stages, edges, cohort, rateOverrides, volumeInjections);
    const projectedPaid = terminalVolume(stages, projVols);
    const projectedConversion = entry > 0 ? projectedPaid / entry : 0;

    // Per-opportunity marginal contribution
    const perOpportunity = enabledOpps.map((opp) => {
      const applies =
        opp.cohortIds.length === 0 || opp.cohortIds.includes(cohort.id);
      if (!applies) return { opportunityId: opp.id, contribution: 0 };

      const single = applyOpportunities(cohort, [opp]);
      const singleVols = walkFunnel(stages, edges, cohort, single.rateOverrides, single.volumeInjections);
      const singlePaid = terminalVolume(stages, singleVols);
      const singleConversion = entry > 0 ? singlePaid / entry : 0;
      return {
        opportunityId: opp.id,
        contribution: singleConversion - baselineConversion,
      };
    });

    return {
      cohortId: cohort.id,
      baselineConversion,
      projectedConversion,
      baselinePaid,
      projectedPaid,
      delta: projectedConversion - baselineConversion,
      perOpportunity,
    };
  });
}

/**
 * Compute a blended projection across all cohorts (volume-weighted average).
 */
export function computeBlended(results: ProjectionResult[], cohorts: Cohort[]) {
  const totalVolume = cohorts.reduce((s, c) => s + totalEntryVolume(c), 0);
  if (totalVolume === 0) {
    return { baselineConversion: 0, projectedConversion: 0, delta: 0, totalBasePaid: 0, totalProjPaid: 0 };
  }

  let totalBasePaid = 0;
  let totalProjPaid = 0;
  for (const r of results) {
    totalBasePaid += r.baselinePaid;
    totalProjPaid += r.projectedPaid;
  }

  return {
    baselineConversion: totalBasePaid / totalVolume,
    projectedConversion: totalProjPaid / totalVolume,
    delta: (totalProjPaid - totalBasePaid) / totalVolume,
    totalBasePaid,
    totalProjPaid,
  };
}
