import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from './ErrorBanner.jsx';
import PageState from './PageState.jsx';
import Spinner from './Spinner.jsx';

export default function ProtectedRoute({ children }) {
  const { user, isLoading, sessionError, refetchUser } = useAuth();
  const location = useLocation();

  if (isLoading || (!user && sessionError)) {
    return (
      <PageState title="Checking your session">
        {isLoading ? <Spinner size="lg" /> : <ErrorBanner error={sessionError} onRetry={refetchUser} />}
      </PageState>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
}

