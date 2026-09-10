import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ToastViewport from './components/Toast/ToastViewport.jsx';
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
      {/* The feed is public: anyone can read it, while posting, liking and
          commenting send a logged-out visitor to the login screen. */}
      <Route path="/feed" element={<Feed />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
            <ToastViewport />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
