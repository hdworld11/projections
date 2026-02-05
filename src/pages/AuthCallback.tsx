import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/projects');
      return;
    }

    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/');
        return;
      }

      // Check for existing localStorage data for migration prompt
      const existingData = localStorage.getItem('projections-store');
      if (existingData) {
        navigate('/projects?migrate=true');
      } else {
        navigate('/projects');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Completing sign in...</span>
      </div>
    </div>
  );
}
