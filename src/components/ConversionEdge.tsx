import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useStore } from '../store/useStore';
import { useReadOnly } from '../contexts/ReadOnlyContext';

function RateInput({
  cohortId,
  edgeId,
  rate,
  color,
  name,
  isReadOnly,
}: {
  cohortId: string;
  edgeId: string;
  rate: number;
  color: string;
  name: string;
  isReadOnly: boolean;
}) {
  const setConversionRate = useStore((s) => s.setConversionRate);
  const [localValue, setLocalValue] = useState<string>((rate * 100).toString());
  const [focused, setFocused] = useState(false);

  const display = focused ? localValue : (rate * 100).toString();

  const commit = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const clamped = Math.min(100, Math.max(0, num));
      setConversionRate(cohortId, edgeId, clamped / 100);
      setLocalValue(clamped.toString());
    } else {
      setLocalValue((rate * 100).toString());
    }
  };

  if (isReadOnly) {
    return (
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          title={name}
        />
        <span className="text-[10px] font-mono text-slate-700">
          {(rate * 100).toFixed(1)}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={name}
      />
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={(e) => {
          setFocused(true);
          setLocalValue((rate * 100).toString());
          e.target.select();
        }}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={(e) => {
          setFocused(false);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-12 text-right border rounded px-1 py-0.5 text-[10px] outline-none focus:ring-1 focus:ring-indigo-300"
      />
      <span className="text-slate-400 text-[10px]">%</span>
    </div>
  );
}

export default function ConversionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const edgeId = (data as Record<string, unknown>)?.edgeId as string | undefined;
  const cohorts = useStore((s) => s.cohorts);
  const selectedCohortId = useStore((s) => s.selectedCohortId);
  const removeEdge = useStore((s) => s.removeEdge);
  const { isReadOnly } = useReadOnly();

  const displayCohorts = selectedCohortId
    ? cohorts.filter((c) => c.id === selectedCohortId)
    : cohorts;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: '#94a3b8', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white rounded-md shadow-sm border border-slate-200 px-2 py-1 text-xs"
        >
          {edgeId && displayCohorts.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-2">
              {displayCohorts.map((c) => (
                <RateInput
                  key={c.id}
                  cohortId={c.id}
                  edgeId={edgeId}
                  rate={c.conversionRates[edgeId] ?? 0}
                  color={c.color}
                  name={c.name}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          ) : (
            <span className="text-slate-400 italic">
              {cohorts.length === 0 ? 'Add a cohort' : 'No rate'}
            </span>
          )}
          {edgeId && !isReadOnly && (
            <button
              onClick={() => removeEdge(edgeId)}
              className="block mt-1 text-[10px] text-red-500 hover:text-red-700 mx-auto"
            >
              remove
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
