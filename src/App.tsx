import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import FunnelEditor from './components/FunnelEditor';
import ImpactDashboard from './components/ImpactDashboard';

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Projections
        </h1>
        <nav className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('funnel')}
            className={`text-sm font-medium px-4 py-1.5 rounded-md transition-colors ${
              activeTab === 'funnel'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Funnel
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`text-sm font-medium px-4 py-1.5 rounded-md transition-colors ${
              activeTab === 'impact'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Impact
          </button>
        </nav>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {activeTab === 'funnel' ? <FunnelEditor /> : <ImpactDashboard />}
        </main>
      </div>
    </div>
  );
}
