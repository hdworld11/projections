import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStore } from '../store/useStore';

type VolumeInfo = { volume: number; pctOfEntry: number };
type StageNodeData = {
  label: string;
  isTerminal: boolean;
  stageId: string;
  volumes: Record<string, VolumeInfo>; // cohortId -> { volume, pctOfEntry }
};

function StageNode({ data }: NodeProps) {
  const { label, isTerminal, stageId, volumes } = data as unknown as StageNodeData;
  const updateStage = useStore((s) => s.updateStage);
  const removeStage = useStore((s) => s.removeStage);
  const cohorts = useStore((s) => s.cohorts);
  const selectedCohortId = useStore((s) => s.selectedCohortId);
  const setCohortEntry = useStore((s) => s.setCohortEntry);
  const removeCohortEntry = useStore((s) => s.removeCohortEntry);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label as string);

  const sid = stageId as string;

  const displayCohorts = selectedCohortId
    ? cohorts.filter((c) => c.id === selectedCohortId)
    : cohorts;

  const enteredCohorts = cohorts.filter((c) => sid in c.entries);
  const availableCohorts = cohorts.filter((c) => !(sid in c.entries));

  const save = () => {
    if (name.trim()) updateStage(sid, { name: name.trim() });
    setEditing(false);
  };

  const volData = (volumes ?? {}) as Record<string, VolumeInfo>;
  const hasVolumes = displayCohorts.some((c) => volData[c.id]?.volume > 0);

  return (
    <div
      className={`rounded-lg shadow-md border-2 min-w-[180px] ${
        isTerminal
          ? 'bg-emerald-50 border-emerald-400'
          : 'bg-white border-slate-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />

      {/* Header */}
      <div className="px-4 pt-3 pb-1 text-center">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="border rounded px-2 py-1 text-sm w-full text-center"
          />
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span
              onDoubleClick={() => setEditing(true)}
              className="font-semibold text-sm text-slate-800 cursor-text"
            >
              {label as string}
            </span>
            {isTerminal && (
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                PAID
              </span>
            )}
          </div>
        )}

        {/* Computed volumes per cohort */}
        {hasVolumes && (
          <div className="mt-2 space-y-0.5">
            {displayCohorts.map((c) => {
              const v = volData[c.id];
              if (!v || v.volume === 0) return null;
              return (
                <div key={c.id} className="flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-slate-500">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-700 font-medium">
                      {Math.round(v.volume).toLocaleString()}
                    </span>
                    <span className="text-slate-400 font-mono">
                      ({(v.pctOfEntry * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center gap-1 mt-2">
          <button
            onClick={() => updateStage(sid, { isTerminal: !isTerminal })}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
            title={isTerminal ? 'Unmark as paid' : 'Mark as paid'}
          >
            {isTerminal ? 'Unmark Paid' : 'Mark Paid'}
          </button>
          <button
            onClick={() => removeStage(sid)}
            className="text-[10px] px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Entry points section */}
      {(enteredCohorts.length > 0 || availableCohorts.length > 0) && (
        <div className="border-t border-slate-200 mt-1 px-3 py-2 bg-slate-50/50 rounded-b-lg">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            Entry Volume
          </div>
          {enteredCohorts.map((c) => (
            <div key={c.id} className="flex items-center gap-1 mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
                title={c.name}
              />
              <span className="text-[10px] text-slate-500 truncate flex-1 text-left" title={c.name}>
                {c.name}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={c.entries[sid]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setCohortEntry(c.id, sid, Math.max(0, v));
                  else if (e.target.value === '') setCohortEntry(c.id, sid, 0);
                }}
                className="w-16 text-right border rounded px-1 py-0.5 text-[10px] outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <button
                onClick={() => removeCohortEntry(c.id, sid)}
                className="text-red-400 hover:text-red-600 text-[10px] leading-none"
                title="Remove entry"
              >
                x
              </button>
            </div>
          ))}
          {availableCohorts.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setCohortEntry(e.target.value, sid, 0);
              }}
              className="w-full border border-dashed border-slate-300 rounded px-1 py-0.5 text-[10px] text-slate-400 bg-white mt-0.5"
            >
              <option value="">+ Add cohort entry...</option>
              {availableCohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
    </div>
  );
}

export default memo(StageNode);
