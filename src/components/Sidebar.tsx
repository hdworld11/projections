import CohortPanel from './CohortPanel';
import OpportunityPanel from './OpportunityPanel';

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <CohortPanel />
        <div className="border-t border-slate-200" />
        <OpportunityPanel />
      </div>
    </aside>
  );
}
