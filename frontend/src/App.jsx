import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ToastViewport from './components/Toast/ToastViewport.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import Loader from './components/Loader/Loader.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Feed from './pages/Feed.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Keeps an already-authenticated user away from the login and signup screens.
 */
function GuestOnlyRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) return <Loader label="Checking your session" />;
  if (isAuthenticated) return <Navigate to="/feed" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <Login />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnlyRoute>
            <Signup />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastViewport />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
