import type { ProjectionResult } from '../types';
import type { Cohort } from '../types';
import { totalEntryVolume } from '../types';

interface Props {
  results: ProjectionResult[];
  cohorts: Cohort[];
  blended: {
    baselineConversion: number;
    projectedConversion: number;
    delta: number;
    totalBasePaid: number;
    totalProjPaid: number;
  };
}

function fmt(n: number) {
  return (n * 100).toFixed(2) + '%';
}

function fmtNum(n: number) {
  return Math.round(n).toLocaleString();
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-slate-400">--</span>;
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {positive ? '+' : ''}
      {(delta * 100).toFixed(2)}pp
    </span>
  );
}

export default function ConversionSummaryTable({ results, cohorts, blended }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs text-slate-500 font-semibold">Cohort</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Volume</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Current Conv.</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Projected Conv.</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Lift</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Current Paid</th>
            <th className="text-right py-2 px-3 text-xs text-slate-500 font-semibold">Projected Paid</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const cohort = cohorts.find((c) => c.id === r.cohortId);
            if (!cohort) return null;
            return (
              <tr key={r.cohortId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cohort.color }}
                    />
                    <span className="font-medium text-slate-700">{cohort.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  {fmtNum(totalEntryVolume(cohort))}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {fmt(r.baselineConversion)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                  {fmt(r.projectedConversion)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <DeltaBadge delta={r.delta} />
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  {fmtNum(r.baselinePaid)}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                  {fmtNum(r.projectedPaid)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="py-2.5 px-3 font-semibold text-slate-800">Blended</td>
            <td className="py-2.5 px-3 text-right text-slate-600">
              {fmtNum(cohorts.reduce((s, c) => s + totalEntryVolume(c), 0))}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
              {fmt(blended.baselineConversion)}
            </td>
            <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
              {fmt(blended.projectedConversion)}
            </td>
            <td className="py-2.5 px-3 text-right">
              <DeltaBadge delta={blended.delta} />
            </td>
            <td className="py-2.5 px-3 text-right text-slate-600">
              {fmtNum(blended.totalBasePaid)}
            </td>
            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
              {fmtNum(blended.totalProjPaid)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
