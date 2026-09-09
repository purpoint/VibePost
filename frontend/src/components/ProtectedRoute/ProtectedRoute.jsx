import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../Loader/Loader.jsx';

/**
 * Gates a route behind authentication.
 *
 * Waits for the session restore to finish so a logged-in user reloading the
 * page is never bounced to the login screen, and remembers where they were
 * heading so login can send them back.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth();
  const location = useLocation();

  if (initialising) return <Loader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
