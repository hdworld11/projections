import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { ReadOnlyProvider } from '../contexts/ReadOnlyContext';
import type { Stage, StageEdge, Cohort, Opportunity } from '../types';
import Sidebar from '../components/Sidebar';
import FunnelEditor from '../components/FunnelEditor';
import ImpactDashboard from '../components/ImpactDashboard';

interface SharedProjectData {
  project_id: string;
  name: string;
  stages: Stage[];
  edges: StageEdge[];
  cohorts: Cohort[];
  opportunities: Opportunity[];
}

export default function SharedProject() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'funnel' | 'impact'>('funnel');

  const loadSharedData = useStore((s) => s.loadSharedData);

  useEffect(() => {
    const fetchSharedProject = async () => {
      if (!token || !isSupabaseConfigured) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      // Call RPC function to get shared project data
      const { data, error: fetchError } = await supabase
        .rpc('get_shared_project', { token })
        .single();

      if (fetchError || !data) {
        setError('Project not found or no longer shared');
        setLoading(false);
        return;
      }

      setProject(data as SharedProjectData);

      // Load data into store (read-only)
      loadSharedData({
        stages: data.stages || [],
        edges: data.edges || [],
        cohorts: data.cohorts || [],
        opportunities: data.opportunities || [],
      });

      setLoading(false);
    };

    fetchSharedProject();
  }, [token, loadSharedData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading shared project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {error || 'Project not found'}
          </h2>
          <p className="text-slate-600 mb-4">
            This project may have been unshared or deleted.
          </p>
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReadOnlyProvider isReadOnly={true}>
      <div className="h-screen flex flex-col bg-slate-50 text-slate-800">
        {/* Header */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-bold text-slate-800 tracking-tight hover:text-indigo-600">
              Projections
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{project.name}</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
              View only
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab navigation */}
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

            <Link
              to="/"
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700"
            >
              Create your own
            </Link>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {activeTab === 'funnel' ? <FunnelEditor /> : <ImpactDashboard />}
          </main>
        </div>
      </div>
    </ReadOnlyProvider>
  );
}
