const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/database');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return error(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const result = await query(
      `SELECT u.id, u.name, u.email, u.is_active,
              array_agg(DISTINCT r.name)  FILTER (WHERE r.name IS NOT NULL) AS roles,
              array_agg(DISTINCT p.name)  FILTER (WHERE p.name IS NOT NULL) AS permissions,
              (SELECT su.store_id FROM store_users su WHERE su.user_id = u.id LIMIT 1) AS store_id,
              COALESCE(
                (SELECT su.is_admin FROM store_users su WHERE su.user_id = u.id LIMIT 1),
                false
              ) AS is_store_admin
       FROM users u
       LEFT JOIN user_roles ur       ON ur.user_id = u.id
       LEFT JOIN roles r             ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p       ON p.id = rp.permission_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.userId]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return error(res, 'User not found or inactive', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')  return error(res, 'Access token expired', 401);
    if (err.name === 'JsonWebTokenError') return error(res, 'Invalid access token', 401);
    next(err);
  }
};

module.exports = { authenticate };