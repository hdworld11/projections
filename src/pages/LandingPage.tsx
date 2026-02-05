import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthButton from '../components/AuthButton';

export default function LandingPage() {
  const { user, loading, isConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in, redirect to projects
    if (!loading && user) {
      navigate('/projects');
    }
    // If Supabase isn't configured, redirect to projects (local mode)
    if (!loading && !isConfigured) {
      navigate('/projects');
    }
  }, [user, loading, navigate, isConfigured]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800">Projections</h1>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Model your funnel.
            <br />
            <span className="text-indigo-600">Project your growth.</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Build visual funnel models, define cohorts, and simulate the impact of
            conversion rate improvements to prioritize your growth initiatives.
          </p>
          <AuthButton />
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Visual Funnel Builder</h3>
            <p className="text-sm text-slate-600">
              Drag and drop to create funnel stages and define conversion paths between them.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Cohort Analysis</h3>
            <p className="text-sm text-slate-600">
              Define multiple cohorts with different conversion rates to model your user segments.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Impact Projections</h3>
            <p className="text-sm text-slate-600">
              Simulate growth opportunities and see projected impact on your key metrics.
            </p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-slate-500">
        <p>Built for growth teams who want to make data-driven decisions.</p>
      </footer>
    </div>
  );
}
