const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { success, created, paginated, error } = require('../utils/response');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { search, is_active } = req.query;

    const conditions = [], params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      conditions.push(`u.is_active = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM users u ${where}`, params);

    params.push(limit, offset);
    const usersRes = await query(
      `SELECT u.id, u.name, u.email, u.is_active, u.last_login_at, u.created_at,
              array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return paginated(res, usersRes.rows, buildPaginationMeta(countRes.rows[0].count, page, limit));
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.is_active, u.avatar_url, u.last_login_at, u.created_at, u.updated_at,
              json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name))
                FILTER (WHERE r.id IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       WHERE u.id = $1 GROUP BY u.id`,
      [req.params.id]
    );
    if (!result.rows.length) return error(res, 'User not found', 404);
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { name, email, password, roleIds = [] } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return error(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await transaction(async (client) => {
      const r = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3) RETURNING id, name, email, is_active, created_at`,
        [name, email, passwordHash]
      );
      const newUser = r.rows[0];

      if (roleIds.length) {
        for (const roleId of roleIds) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newUser.id, roleId]
          );
        }
      } else {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) 
           SELECT $1, id FROM roles WHERE name = 'Viewer' ON CONFLICT DO NOTHING`,
      [newUser.id]
    );
  }
  return newUser;
});

return created(res, user);
} catch (err) { next(err); }
};
const updateUser = async (req, res, next) => {
try {
const errs = validationResult(req);
if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());
const { id } = req.params;
const { name, email, is_active, roleIds } = req.body;

const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
if (!existing.rows.length) return error(res, 'User not found', 404);

const updates = [], params = [];
if (name !== undefined) { params.push(name); updates.push(`name = $${params.length}`); }
if (email !== undefined) { params.push(email); updates.push(`email = $${params.length}`); }
if (is_active !== undefined) { params.push(is_active); updates.push(`is_active = $${params.length}`); }

let user;
if (updates.length) {
  params.push(id);
  user = (await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}
     RETURNING id, name, email, is_active, updated_at`,
    params
  )).rows[0];
}

if (roleIds !== undefined) {
  await transaction(async (client) => {
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    for (const roleId of roleIds) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, roleId]
      );
    }
  });
}

return success(res, user || { id });
} catch (err) { next(err); }
};
const deleteUser = async (req, res, next) => {
try {
const { id } = req.params;
if (id === req.user.id) return error(res, 'Cannot delete yourself', 400);
const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
if (!result.rows.length) return error(res, 'User not found', 404);
return success(res, null, 'User deleted successfully');
} catch (err) { next(err); }
};
module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };