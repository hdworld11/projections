import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { migrateLocalStorage, hasLocalStorageData } from '../lib/migration';
import type { Project } from '../types/database';
import AuthButton from '../components/AuthButton';

export default function ProjectList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Check for migration prompt
  useEffect(() => {
    if (searchParams.get('migrate') === 'true' && hasLocalStorageData()) {
      setShowMigrationPrompt(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const projectId = await migrateLocalStorage(user.id);
      if (projectId) {
        await fetchProjects();
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
    setMigrating(false);
    setShowMigrationPrompt(false);
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user || !isSupabaseConfigured) return;

    setCreating(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newProjectName.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
    } else if (data) {
      // Create empty project_data
      await supabase.from('project_data').insert({
        project_id: data.id,
        stages: [],
        edges: [],
        cohorts: [],
        opportunities: [],
      });
      navigate(`/project/${data.id}`);
    }
    setCreating(false);
    setNewProjectName('');
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Error deleting project:', error);
    } else {
      setProjects((p) => p.filter((proj) => proj.id !== id));
    }
  };

  // Local mode (no Supabase configured)
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Projections</h1>
          <span className="text-xs text-slate-400">Local Mode</span>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">
              Running in local mode. Configure Supabase for cloud storage and sharing.
            </p>
            <button
              onClick={() => navigate('/project/local')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Open Local Project
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Projections</h1>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Migration prompt */}
        {showMigrationPrompt && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="font-medium text-indigo-900 mb-2">Import existing project?</h3>
            <p className="text-sm text-indigo-700 mb-4">
              We found a project saved in your browser. Would you like to import it to your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {migrating ? 'Importing...' : 'Import Project'}
              </button>
              <button
                onClick={() => setShowMigrationPrompt(false)}
                className="px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-100 rounded-lg"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Your Projects</h2>
        </div>

        {/* Create new project */}
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              placeholder="New project name..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={createProject}
              disabled={!newProjectName.trim() || creating}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Project list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No projects yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-medium text-slate-800">{project.name}</h3>
                    <p className="text-sm text-slate-500">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    {project.is_public && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Shared
                      </span>
                    )}
                    <button
                      onClick={() => deleteProject(project.id, project.name)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
