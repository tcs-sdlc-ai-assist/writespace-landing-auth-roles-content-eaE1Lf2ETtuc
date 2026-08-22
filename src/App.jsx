import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ReadBlog from './pages/ReadBlog';
import RegisterPage from './pages/RegisterPage';
import UserManagement from './pages/UserManagement';
import WriteBlog from './pages/WriteBlog';
import {
  SESSION_CHANGE_EVENT,
  getSession,
} from './utils/auth';
import { ROUTES, STORAGE_KEYS } from './utils/constants';

function AuthenticatedLayout({ session }) {
  const currentSession = session ?? getSession();

  if (!currentSession) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar session={currentSession} />
      <Outlet />
    </div>
  );
}

AuthenticatedLayout.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }),
};

function ApplicationRoutes() {
  const location = useLocation();
  const [session, setCurrentSession] = useState(() => getSession());

  useEffect(() => {
    function refreshSession() {
      setCurrentSession(getSession());
    }

    function handleStorage(event) {
      if (event.key === null || event.key === STORAGE_KEYS.session) {
        refreshSession();
      }
    }

    window.addEventListener(SESSION_CHANGE_EVENT, refreshSession);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, refreshSession);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    setCurrentSession(getSession());
  }, [location.pathname]);

  const currentSession = session ?? getSession();

  return (
    <Routes>
      <Route
        path={ROUTES.landing}
        element={<LandingPage session={currentSession} />}
      />
      <Route
        path={ROUTES.login}
        element={<LoginPage session={currentSession} />}
      />
      <Route
        path={ROUTES.register}
        element={<RegisterPage session={currentSession} />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          element={<AuthenticatedLayout session={currentSession} />}
        >
          <Route
            path={ROUTES.blogs}
            element={<Home session={currentSession} />}
          />
          <Route
            path={ROUTES.blog}
            element={<ReadBlog session={currentSession} />}
          />
          <Route
            path={ROUTES.write}
            element={<WriteBlog session={currentSession} />}
          />
          <Route
            path={ROUTES.edit}
            element={<WriteBlog session={currentSession} />}
          />

          <Route element={<ProtectedRoute adminOnly />}>
            <Route
              path={ROUTES.admin}
              element={<AdminDashboard session={currentSession} />}
            />
            <Route
              path={ROUTES.users}
              element={<UserManagement session={currentSession} />}
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={ROUTES.landing} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ApplicationRoutes />
    </BrowserRouter>
  );
}

export default App;