import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyProvider } from '../contexts/ReadOnlyContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Project } from '../types/database';
import Sidebar from '../components/Sidebar';
import FunnelEditor from '../components/FunnelEditor';
import ImpactDashboard from '../components/ImpactDashboard';
import ProjectSelector from '../components/ProjectSelector';
import ShareDialog from '../components/ShareDialog';
import AuthButton from '../components/AuthButton';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const loadFromSupabase = useStore((s) => s.loadFromSupabase);
  const saveToSupabase = useStore((s) => s.saveToSupabase);
  const setCurrentProjectId = useStore((s) => s.setCurrentProjectId);

  // Fetch project and data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      // Local mode
      if (id === 'local' || !isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      // Fetch project metadata
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError || !projectData) {
        console.error('Error fetching project:', projectError);
        navigate('/projects');
        return;
      }

      // Check ownership
      if (projectData.user_id !== user?.id) {
        navigate('/projects');
        return;
      }

      setProject(projectData);
      setCurrentProjectId(id);
      await loadFromSupabase(id);
      setLoading(false);
    };

    fetchProject();
  }, [id, user, navigate, loadFromSupabase, setCurrentProjectId]);

  // Auto-save with debounce
  const handleSave = useCallback(async () => {
    if (!id || id === 'local' || !isSupabaseConfigured) return;

    setSaveStatus('saving');
    try {
      await saveToSupabase(id);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [id, saveToSupabase]);

  // Subscribe to store changes for auto-save
  useEffect(() => {
    if (!id || id === 'local' || !isSupabaseConfigured) return;

    const unsubscribe = useStore.subscribe(() => {
      // Debounced save
      const timeoutId = setTimeout(handleSave, 1000);
      return () => clearTimeout(timeoutId);
    });

    return unsubscribe;
  }, [id, handleSave]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <ReadOnlyProvider isReadOnly={false}>
      <div className="h-screen flex flex-col bg-slate-50 text-slate-800">
        {/* Header */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/projects" className="text-lg font-bold text-slate-800 tracking-tight hover:text-indigo-600">
              Projections
            </Link>
            {isSupabaseConfigured && (
              <>
                <span className="text-slate-300">/</span>
                <ProjectSelector currentProject={project} />
              </>
            )}
            {/* Save status indicator */}
            {isSupabaseConfigured && id !== 'local' && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                saveStatus === 'saved' ? 'text-slate-400' :
                saveStatus === 'saving' ? 'text-amber-500 bg-amber-50' :
                'text-red-500 bg-red-50'
              }`}>
                {saveStatus === 'saved' ? 'Saved' :
                 saveStatus === 'saving' ? 'Saving...' : 'Error saving'}
              </span>
            )}
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

            {/* Share button */}
            {isSupabaseConfigured && project && (
              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}

            <AuthButton />
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {activeTab === 'funnel' ? <FunnelEditor /> : <ImpactDashboard />}
          </main>
        </div>

        {/* Share dialog */}
        {showShareDialog && project && (
          <ShareDialog
            project={project}
            onClose={() => setShowShareDialog(false)}
            onUpdate={setProject}
          />
        )}
      </div>
    </ReadOnlyProvider>
  );
}
