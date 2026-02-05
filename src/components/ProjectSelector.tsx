import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types/database';

interface ProjectSelectorProps {
  currentProject: Project | null;
}

export default function ProjectSelector({ currentProject }: ProjectSelectorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOpen || !user || !isSupabaseConfigured) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [isOpen, user]);

  const handleSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
    setIsOpen(false);
  };

  if (!currentProject) {
    return <span className="text-slate-500">No project</span>;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
      >
        <span className="font-medium">{currentProject.name}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {loading ? (
              <div className="px-3 py-2 text-sm text-slate-500">Loading...</div>
            ) : (
              <>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      project.id === currentProject.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-slate-400">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                <hr className="my-2 border-slate-100" />
                <button
                  onClick={() => {
                    navigate('/projects');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
                >
                  View all projects
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
