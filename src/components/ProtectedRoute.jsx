import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';
import { getSession, isAdmin } from '../utils/auth';
import { ROLES, ROUTES } from '../utils/constants';

function ProtectedRoute({
  children = null,
  adminOnly = false,
  requiredRole = null,
}) {
  const session = getSession();

  if (!session) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const requiresAdmin =
    adminOnly || requiredRole === ROLES.admin;

  if (requiresAdmin && !isAdmin(session)) {
    return <Navigate to={ROUTES.blogs} replace />;
  }

  return children ?? <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  adminOnly: PropTypes.bool,
  requiredRole: PropTypes.oneOf([ROLES.admin]),
};

export default ProtectedRoute;