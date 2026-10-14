import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Feedback';

/** Signed-in users only. With adminOnly, regular users are sent back to the dashboard. */
export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Sign in and sign up pages are not shown to people who are already signed in. */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session" />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
