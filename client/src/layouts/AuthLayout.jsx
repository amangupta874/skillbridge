import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import PageState from '../components/PageState.jsx';
import Spinner from '../components/Spinner.jsx';

export default function AuthLayout() {
  const { user, isLoading, sessionError, refetchUser } = useAuth();
  const location = useLocation();

  if (isLoading || (!user && sessionError)) {
    return (
      <PageState title="Checking your session">
        {isLoading ? <Spinner size="lg" /> : <ErrorBanner error={sessionError} onRetry={refetchUser} />}
      </PageState>
    );
  }

  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="text-3xl font-extrabold text-indigo-700 tracking-tight">
          SkillBridge
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-xl border border-slate-200 sm:px-10">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
