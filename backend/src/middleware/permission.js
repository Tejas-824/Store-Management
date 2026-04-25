const { error } = require('../utils/response');

// Check all permissions (AND)
const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);
  const userPerms = req.user.permissions || [];
  const ok = permissions.every(p => userPerms.includes(p));
  if (!ok) return error(res, 'Insufficient permissions', 403);
  next();
};

// Check any permission (OR)
const authorizeAny = (...permissions) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);
  const userPerms = req.user.permissions || [];
  const ok = permissions.some(p => userPerms.includes(p));
  if (!ok) return error(res, 'Insufficient permissions', 403);
  next();
};

// Check by role name
const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);
  const userRoles = req.user.roles || [];
  const ok = roles.some(r => userRoles.includes(r));
  if (!ok) return error(res, 'Access denied. Insufficient role.', 403);
  next();
};

// Allow Super Admin OR Store Admin accessing their OWN store only
const authorizeStoreAccess = (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);

  const { roles, store_id, is_store_admin } = req.user;
  const isSuperAdmin = (roles || []).includes('Super Admin');
  const isOwnStore   = is_store_admin && store_id === req.params.id;

  if (isSuperAdmin || isOwnStore) return next();
  return error(res, 'Access denied to this store', 403);
};

module.exports = { authorize, authorizeAny, authorizeRole, authorizeStoreAccess };