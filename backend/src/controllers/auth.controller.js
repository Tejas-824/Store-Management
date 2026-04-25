const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } = require('../utils/jwt');
const { success, created, error } = require('../utils/response');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const REFRESH_MS    = 7 * 24 * 60 * 60 * 1000;

// Shared query to get full user with store context
const USER_WITH_STORE_QUERY = `
  SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
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
  WHERE u.email = $1
  GROUP BY u.id
`;

const register = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { name, email, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return error(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await transaction(async (client) => {
      const r = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3) RETURNING id, name, email, is_active, created_at`,
        [name, email, passwordHash]
      );
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = 'Viewer' ON CONFLICT DO NOTHING`,
        [r.rows[0].id]
      );
      return r.rows[0];
    });

    return created(res, user, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { email, password } = req.body;
    const result = await query(USER_WITH_STORE_QUERY, [email]);

    const user = result.rows[0];
    // Always run bcrypt to prevent timing attacks
    const dummyHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/urfP0ONLK5TpSZ6Oi';
    const match = await bcrypt.compare(password, user?.password_hash || dummyHash);

    if (!user || !match)  return error(res, 'Invalid email or password', 401);
    if (!user.is_active)  return error(res, 'Account is deactivated. Contact administrator.', 403);

    const accessToken  = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    const tokenHash    = hashToken(refreshToken);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, new Date(Date.now() + REFRESH_MS), req.ip, req.headers['user-agent']?.slice(0, 255)]
    );
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { password_hash, ...safeUser } = user;
    return success(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { refreshToken } = req.body;
    let decoded;
    try { decoded = verifyRefreshToken(refreshToken); }
    catch { return error(res, 'Invalid or expired refresh token', 401); }

    const tokenHash = hashToken(refreshToken);
    const found = await query(
      `SELECT id FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!found.rows.length) return error(res, 'Refresh token revoked or expired', 401);

    // Rotate tokens
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);

    const newAccess  = generateAccessToken({ userId: decoded.userId });
    const newRefresh = generateRefreshToken({ userId: decoded.userId });
    const newHash    = hashToken(newRefresh);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [decoded.userId, newHash, new Date(Date.now() + REFRESH_MS), req.ip, req.headers['user-agent']?.slice(0, 255)]
    );

    return success(res, { accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
        [hashToken(refreshToken)]
      );
    }
    return success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

const getMe = (req, res) => success(res, req.user);

module.exports = { register, login, refresh, logout, getMe };