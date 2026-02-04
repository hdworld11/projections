import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import type { ProjectionResult } from '../types';
import type { Opportunity } from '../types';

interface Props {
  blendedBaseline: number;
  results: ProjectionResult[];
  opportunities: Opportunity[];
  cohortCount: number;
  totalEntryVolume: number;
}

type WaterfallItem = {
  name: string;
  base: number;
  lift: number;
  total: number;
  liftLabel: string;
  totalLabel: string;
  isBaseline?: boolean;
  isTotal?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarLabel(props: any) {
  const { x, y, width, value } = props as {
    x: number;
    y: number;
    width: number;
    value: string;
  };
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#334155"
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
      fontFamily="ui-monospace, monospace"
    >
      {value}
    </text>
  );
}

export default function WaterfallChart({
  blendedBaseline,
  results,
  opportunities,
  cohortCount,
  totalEntryVolume,
}: Props) {
  const enabledOpps = opportunities.filter((o) => o.enabled);

  if (enabledOpps.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-sm text-slate-400">
        Enable opportunities to see their projected impact
      </div>
    );
  }

  const oppContributions = enabledOpps.map((opp) => {
    let totalContribution = 0;
    for (const r of results) {
      const entry = r.perOpportunity.find((p) => p.opportunityId === opp.id);
      totalContribution += entry?.contribution ?? 0;
    }
    const avg = cohortCount > 0 ? totalContribution / cohortCount : 0;
    return { name: opp.name, contribution: avg };
  });

  const fmtPct = (v: number) => `${v.toFixed(2)}%`;
  const fmtCount = (v: number) =>
    Math.round(v).toLocaleString();

  const baselinePaid = blendedBaseline * totalEntryVolume;

  const data: WaterfallItem[] = [];
  data.push({
    name: 'Current',
    base: 0,
    lift: blendedBaseline * 100,
    total: blendedBaseline * 100,
    liftLabel: `${fmtPct(blendedBaseline * 100)}  (${fmtCount(baselinePaid)})`,
    totalLabel: '',
    isBaseline: true,
  });

  let running = blendedBaseline * 100;
  for (const oc of oppContributions) {
    const liftPp = oc.contribution * 100;
    const newTotal = running + liftPp;
    const additionalCustomers = (liftPp / 100) * totalEntryVolume;
    data.push({
      name: oc.name,
      base: running,
      lift: liftPp,
      total: newTotal,
      liftLabel:
        liftPp !== 0
          ? `+${fmtPct(liftPp)}  (+${fmtCount(additionalCustomers)})`
          : '',
      totalLabel: '',
    });
    running = newTotal;
  }

  const projectedPaid = (running / 100) * totalEntryVolume;
  data.push({
    name: 'Projected',
    base: 0,
    lift: running,
    total: running,
    liftLabel: `${fmtPct(running)}  (${fmtCount(projectedPaid)})`,
    totalLabel: '',
    isTotal: true,
  });

  const yMax = Math.ceil(Math.max(...data.map((d) => d.total)) * 1.15);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart
        data={data}
        margin={{ top: 40, right: 40, left: 20, bottom: 20 }}
        barCategoryGap="20%"
      >
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fontWeight: 500, fill: '#475569' }}
          interval={0}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          height={50}
          angle={data.length > 5 ? -20 : 0}
          textAnchor={data.length > 5 ? 'end' : 'middle'}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
          domain={[0, yMax]}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine
          y={blendedBaseline * 100}
          stroke="#cbd5e1"
          strokeDasharray="6 4"
          strokeWidth={1.5}
          label={{
            value: `Baseline ${fmtPct(blendedBaseline * 100)}`,
            position: 'right',
            fill: '#94a3b8',
            fontSize: 11,
          }}
        />
        <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
        <Bar
          dataKey="lift"
          stackId="a"
          radius={[6, 6, 0, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="liftLabel"
            content={CustomBarLabel}
          />
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.isBaseline
                  ? '#64748b'
                  : entry.isTotal
                    ? '#4f46e5'
                    : '#059669'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
