import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { computeProjections, computeBlended } from '../lib/projections';
import { totalEntryVolume } from '../types';
import ConversionSummaryTable from './ConversionSummaryTable';
import WaterfallChart from './WaterfallChart';

export default function ImpactDashboard() {
  const stages = useStore((s) => s.stages);
  const edges = useStore((s) => s.edges);
  const cohorts = useStore((s) => s.cohorts);
  const opportunities = useStore((s) => s.opportunities);

  const results = useMemo(
    () => computeProjections(stages, edges, cohorts, opportunities),
    [stages, edges, cohorts, opportunities],
  );

  const blended = useMemo(
    () => computeBlended(results, cohorts),
    [results, cohorts],
  );

  const totalVolume = useMemo(
    () => cohorts.reduce((s, c) => s + totalEntryVolume(c), 0),
    [cohorts],
  );

  if (cohorts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">No cohorts defined</p>
          <p className="text-sm mt-1">Add cohorts in the sidebar to see projections</p>
        </div>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">No funnel stages</p>
          <p className="text-sm mt-1">Build your funnel in the Funnel tab first</p>
        </div>
      </div>
    );
  }

  const enabledOpps = opportunities.filter((o) => o.enabled);
  const additionalPaid = Math.round(blended.totalProjPaid - blended.totalBasePaid);

  return (
    <div className="p-6 space-y-8 overflow-auto h-full">
      {/* Header metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Current Conversion
          </div>
          <div className="text-3xl font-bold text-slate-800 mt-1 font-mono">
            {(blended.baselineConversion * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {Math.round(blended.totalBasePaid).toLocaleString()} paid customers
          </div>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
            Projected Conversion
          </div>
          <div className="text-3xl font-bold text-indigo-700 mt-1 font-mono">
            {(blended.projectedConversion * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {Math.round(blended.totalProjPaid).toLocaleString()} paid customers
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
            Projected Lift
          </div>
          <div
            className={`text-3xl font-bold mt-1 font-mono ${
              blended.delta > 0
                ? 'text-emerald-700'
                : blended.delta < 0
                  ? 'text-red-600'
                  : 'text-slate-500'
            }`}
          >
            {blended.delta > 0 ? '+' : ''}
            {(blended.delta * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {additionalPaid >= 0 ? '+' : ''}
            {additionalPaid.toLocaleString()} customers from {enabledOpps.length} opportunit
            {enabledOpps.length === 1 ? 'y' : 'ies'}
          </div>
        </div>
      </div>

      {/* Waterfall chart */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            Conversion Impact by Opportunity
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Blended across all cohorts -- showing conversion rate and customer count per opportunity
          </p>
        </div>
        <div className="p-4">
          <WaterfallChart
            blendedBaseline={blended.baselineConversion}
            results={results}
            opportunities={opportunities}
            cohortCount={cohorts.length}
            totalEntryVolume={totalVolume}
          />
        </div>
      </div>

      {/* Conversion table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            Conversion by Cohort
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Current vs projected conversion rates and paid customer counts
          </p>
        </div>
        <ConversionSummaryTable results={results} cohorts={cohorts} blended={blended} />
      </div>
    </div>
  );
}
