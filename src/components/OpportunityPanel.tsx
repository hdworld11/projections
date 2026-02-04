import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Opportunity, OpportunityMode } from '../types';

function OpportunityForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial: {
    name: string;
    mode: OpportunityMode;
    edgeId: string;
    targetRate: number;
    targetStageId: string;
    absoluteCount: number;
    cohortIds: string[];
    likelihood: number;
  };
  onSave: (data: typeof initial) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const edges = useStore((s) => s.edges);
  const stages = useStore((s) => s.stages);
  const cohorts = useStore((s) => s.cohorts);

  const [form, setForm] = useState(initial);

  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? '?';
  const edgeLabel = (edgeId: string) => {
    const e = edges.find((ed) => ed.id === edgeId);
    if (!e) return '?';
    return `${stageName(e.sourceId)} \u2192 ${stageName(e.targetId)}`;
  };

  const valid =
    form.name.trim() &&
    ((form.mode === 'rate' && form.edgeId) ||
      (form.mode === 'absolute' && form.targetStageId));

  return (
    <div className="border border-indigo-200 rounded-lg p-3 space-y-2 bg-indigo-50/50">
      <input
        placeholder="Opportunity name..."
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
      />

      <div>
        <label className="text-[10px] text-slate-500">Impact type</label>
        <div className="flex gap-1 mt-0.5">
          <button
            onClick={() => setForm({ ...form, mode: 'rate' })}
            className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
              form.mode === 'rate'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            New conversion %
          </button>
          <button
            onClick={() => setForm({ ...form, mode: 'absolute' })}
            className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
              form.mode === 'absolute'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            New customers
          </button>
        </div>
      </div>

      {form.mode === 'rate' ? (
        <>
          <div>
            <label className="text-[10px] text-slate-500">Affects transition</label>
            <select
              value={form.edgeId}
              onChange={(e) => setForm({ ...form, edgeId: e.target.value })}
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="">-- select --</option>
              {edges.map((e) => (
                <option key={e.id} value={e.id}>
                  {edgeLabel(e.id)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">New conversion rate (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.targetRate}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setForm({ ...form, targetRate: v });
                else if (e.target.value === '') setForm({ ...form, targetRate: 0 });
              }}
              className="w-full border rounded px-2 py-1 text-xs"
            />
            {form.edgeId && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                Current:{' '}
                {cohorts
                  .map((c) => {
                    const rate = c.conversionRates[form.edgeId] ?? 0;
                    return `${c.name} ${(rate * 100).toFixed(1)}%`;
                  })
                  .join(', ')}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-[10px] text-slate-500">Adds customers to stage</label>
            <select
              value={form.targetStageId}
              onChange={(e) => setForm({ ...form, targetStageId: e.target.value })}
              className="w-full border rounded px-2 py-1 text-xs"
            >
              <option value="">-- select stage --</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Number of new customers</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.absoluteCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setForm({ ...form, absoluteCount: v });
                else if (e.target.value === '') setForm({ ...form, absoluteCount: 0 });
              }}
              className="w-full border rounded px-2 py-1 text-xs"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-[10px] text-slate-500">Applies to cohorts (none = all)</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {cohorts.map((c) => {
            const selected = form.cohortIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  setForm({
                    ...form,
                    cohortIds: selected
                      ? form.cohortIds.filter((id) => id !== c.id)
                      : [...form.cohortIds, c.id],
                  })
                }
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  selected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-slate-500">Likelihood of success (%)</label>
        <input
          type="text"
          inputMode="decimal"
          value={form.likelihood}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) setForm({ ...form, likelihood: v });
            else if (e.target.value === '') setForm({ ...form, likelihood: 0 });
          }}
          className="w-full border rounded px-2 py-1 text-xs"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm py-1.5 rounded transition-colors"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-3 text-sm py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function formFromOpp(opp: Opportunity) {
  return {
    name: opp.name,
    mode: opp.mode,
    edgeId: opp.edgeId,
    targetRate: +(opp.targetRate * 100).toFixed(2),
    targetStageId: opp.targetStageId,
    absoluteCount: opp.absoluteCount,
    cohortIds: [...opp.cohortIds],
    likelihood: +(opp.likelihood * 100).toFixed(2),
  };
}

export default function OpportunityPanel() {
  const opportunities = useStore((s) => s.opportunities);
  const stages = useStore((s) => s.stages);
  const cohorts = useStore((s) => s.cohorts);
  const edges = useStore((s) => s.edges);
  const addOpportunity = useStore((s) => s.addOpportunity);
  const updateOpportunity = useStore((s) => s.updateOpportunity);
  const removeOpportunity = useStore((s) => s.removeOpportunity);
  const toggleOpportunity = useStore((s) => s.toggleOpportunity);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? '?';
  const edgeLabel = (edgeId: string) => {
    const e = edges.find((ed) => ed.id === edgeId);
    if (!e) return '?';
    return `${stageName(e.sourceId)} \u2192 ${stageName(e.targetId)}`;
  };

  const handleAdd = (data: ReturnType<typeof formFromOpp>) => {
    addOpportunity({
      name: data.name.trim(),
      mode: data.mode,
      edgeId: data.edgeId,
      targetRate: data.targetRate / 100,
      targetStageId: data.targetStageId,
      absoluteCount: data.absoluteCount,
      cohortIds: data.cohortIds,
      likelihood: data.likelihood / 100,
      enabled: true,
    });
    setAdding(false);
  };

  const handleUpdate = (id: string, data: ReturnType<typeof formFromOpp>) => {
    updateOpportunity(id, {
      name: data.name.trim(),
      mode: data.mode,
      edgeId: data.edgeId,
      targetRate: data.targetRate / 100,
      targetStageId: data.targetStageId,
      absoluteCount: data.absoluteCount,
      cohortIds: data.cohortIds,
      likelihood: data.likelihood / 100,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Opportunities
        </h3>
        <button
          onClick={() => { setAdding(!adding); setEditingId(null); }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <OpportunityForm
          initial={{
            name: '',
            mode: 'rate',
            edgeId: '',
            targetRate: 50,
            targetStageId: '',
            absoluteCount: 100,
            cohortIds: [],
            likelihood: 80,
          }}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          submitLabel="Add Opportunity"
        />
      )}

      <div className="space-y-2">
        {opportunities.map((opp) =>
          editingId === opp.id ? (
            <OpportunityForm
              key={opp.id}
              initial={formFromOpp(opp)}
              onSave={(data) => handleUpdate(opp.id, data)}
              onCancel={() => setEditingId(null)}
              submitLabel="Save"
            />
          ) : (
            <div
              key={opp.id}
              className={`border rounded-lg p-2.5 text-sm transition-all ${
                opp.enabled
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={opp.enabled}
                    onChange={() => toggleOpportunity(opp.id)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <div className="font-medium text-slate-700 text-xs">
                      {opp.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {opp.mode === 'rate'
                        ? edgeLabel(opp.edgeId)
                        : `+customers \u2192 ${stageName(opp.targetStageId)}`}
                    </div>
                  </div>
                </label>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setEditingId(opp.id); setAdding(false); }}
                    className="text-indigo-500 hover:text-indigo-700 text-[10px]"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => removeOpportunity(opp.id)}
                    className="text-red-400 hover:text-red-600 text-[10px]"
                  >
                    remove
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-1.5 text-[10px] text-slate-500">
                {opp.mode === 'rate' ? (
                  <span>New rate: {(opp.targetRate * 100).toFixed(1)}%</span>
                ) : (
                  <span>+{opp.absoluteCount.toLocaleString()} customers</span>
                )}
                <span>{Math.round(opp.likelihood * 100)}% likely</span>
              </div>
              {opp.cohortIds.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {opp.cohortIds.map((cid) => {
                    const c = cohorts.find((co) => co.id === cid);
                    return c ? (
                      <span
                        key={cid}
                        className="text-[9px] px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ),
        )}

        {opportunities.length === 0 && !adding && (
          <p className="text-xs text-slate-400 italic">No opportunities yet</p>
        )}
      </div>
    </div>
  );
}
