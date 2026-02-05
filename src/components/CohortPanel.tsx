import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useReadOnly } from '../contexts/ReadOnlyContext';
import { totalEntryVolume } from '../types';

export default function CohortPanel() {
  const cohorts = useStore((s) => s.cohorts);
  const stages = useStore((s) => s.stages);
  const addCohort = useStore((s) => s.addCohort);
  const removeCohort = useStore((s) => s.removeCohort);
  const selectedCohortId = useStore((s) => s.selectedCohortId);
  const setSelectedCohortId = useStore((s) => s.setSelectedCohortId);
  const { isReadOnly } = useReadOnly();

  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCohort(newName.trim());
    setNewName('');
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Cohorts
      </h3>

      {/* Add form - hidden in read-only mode */}
      {!isReadOnly && (
        <div className="flex gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New cohort..."
            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1 rounded transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Cohort list */}
      <div className="space-y-2">
        {cohorts.map((c) => {
          const entryStageIds = Object.keys(c.entries);
          return (
            <div
              key={c.id}
              className={`border rounded-lg p-2.5 text-sm cursor-pointer transition-colors ${
                selectedCohortId === c.id
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() =>
                setSelectedCohortId(selectedCohortId === c.id ? null : c.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-medium text-slate-700">{c.name}</span>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCohort(c.id);
                    }}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    remove
                  </button>
                )}
              </div>

              <div className="mt-1 text-[11px] text-slate-500">
                {entryStageIds.length === 0 ? (
                  <span className="italic">No entry points - set on stage nodes</span>
                ) : (
                  <span>
                    {entryStageIds
                      .map((sid) => {
                        const name = stages.find((s) => s.id === sid)?.name ?? '?';
                        return `${name}: ${c.entries[sid].toLocaleString()}`;
                      })
                      .join(' | ')}
                    {' '}({totalEntryVolume(c).toLocaleString()} total)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {cohorts.length === 0 && (
          <p className="text-xs text-slate-400 italic">No cohorts yet</p>
        )}
      </div>
    </div>
  );
}
