const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { success, created, paginated, error } = require('../utils/response');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const storeFields = `
  s.id, s.name, s.description, s.address, s.city, s.state, s.zip_code, s.country,
  s.phone, s.email, s.website, s.is_active, s.created_at, s.updated_at,
  jsonb_build_object('id', o.id, 'name', o.name, 'email', o.email) AS owner
`;

// ─── Store CRUD (Super Admin only) ────────────────────────────────────────────

const getStores = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { search, is_active, owner_id } = req.query;
    const conditions = [], params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(s.name ILIKE $${params.length} OR s.city ILIKE $${params.length})`);
    }
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      conditions.push(`s.is_active = $${params.length}`);
    }
    if (owner_id) {
      params.push(owner_id);
      conditions.push(`s.owner_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM stores s ${where}`, params);
    params.push(limit, offset);

    const storesRes = await query(
      `SELECT ${storeFields}
       FROM stores s
       LEFT JOIN users o ON o.id = s.owner_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return paginated(res, storesRes.rows, buildPaginationMeta(countRes.rows[0].count, page, limit));
  } catch (err) { next(err); }
};

const getStoreById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ${storeFields},
              jsonb_build_object('id', cb.id, 'name', cb.name) AS created_by_user
       FROM stores s
       LEFT JOIN users o  ON o.id  = s.owner_id
       LEFT JOIN users cb ON cb.id = s.created_by
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return error(res, 'Store not found', 404);
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const createStore = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { name, description, address, city, state, zip_code, country, phone, email, website, owner_id } = req.body;

    const result = await query(
      `INSERT INTO stores
         (name, description, address, city, state, zip_code, country, phone, email, website, owner_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, name, description, is_active, created_at`,
      [name, description, address, city, state, zip_code, country || 'India', phone, email, website, owner_id || null, req.user.id]
    );

    // If owner_id provided, assign them as Store Admin for this store
    if (owner_id) {
      await transaction(async (client) => {
        // Assign Store Admin role if they don't have it
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           SELECT $1, id FROM roles WHERE name = 'Store Admin'
           ON CONFLICT DO NOTHING`,
          [owner_id]
        );
        // Add to store_users as admin
        await client.query(
          `INSERT INTO store_users (store_id, user_id, is_admin)
           VALUES ($1, $2, true)
           ON CONFLICT (store_id, user_id) DO UPDATE SET is_admin = true`,
          [result.rows[0].id, owner_id]
        );
      });
    }

    return created(res, result.rows[0]);
  } catch (err) { next(err); }
};

const updateStore = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { id } = req.params;
    const fields = ['name','description','address','city','state','zip_code','country','phone','email','website','owner_id','is_active'];
    const updates = [], params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }

    if (!updates.length) return error(res, 'No fields to update', 400);

    params.push(id);
    const result = await query(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, is_active, updated_at`,
      params
    );

    if (!result.rows.length) return error(res, 'Store not found', 404);

    // If owner changed, update store_users admin assignment
    if (req.body.owner_id) {
      await transaction(async (client) => {
        // Remove old admin flag (keep them in store but not as admin)
        await client.query(
          `UPDATE store_users SET is_admin = false WHERE store_id = $1 AND is_admin = true`,
          [id]
        );
        // Assign Store Admin role to new owner
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           SELECT $1, id FROM roles WHERE name = 'Store Admin'
           ON CONFLICT DO NOTHING`,
          [req.body.owner_id]
        );
        // Set new owner as store admin
        await client.query(
          `INSERT INTO store_users (store_id, user_id, is_admin)
           VALUES ($1, $2, true)
           ON CONFLICT (store_id, user_id) DO UPDATE SET is_admin = true`,
          [id, req.body.owner_id]
        );
      });
    }

    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const deleteStore = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM stores WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return error(res, 'Store not found', 404);
    return success(res, null, 'Store deleted successfully');
  } catch (err) { next(err); }
};

// ─── Store User Management (Super Admin OR Store Admin of that store) ──────────

const getStoreUsers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const storeCheck = await query('SELECT id, name FROM stores WHERE id = $1', [id]);
    if (!storeCheck.rows.length) return error(res, 'Store not found', 404);

    const result = await query(
      `SELECT u.id, u.name, u.email, u.is_active, u.last_login_at, u.created_at,
              su.is_admin, su.created_at AS joined_at
       FROM store_users su
       JOIN users u ON u.id = su.user_id
       WHERE su.store_id = $1
       ORDER BY su.is_admin DESC, u.name ASC`,
      [id]
    );

    return success(res, { store: storeCheck.rows[0], users: result.rows });
  } catch (err) { next(err); }
};

const addUserToStore = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { id } = req.params; // store_id
    const { name, email, password } = req.body;

    const storeCheck = await query('SELECT id, name FROM stores WHERE id = $1', [id]);
    if (!storeCheck.rows.length) return error(res, 'Store not found', 404);

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return error(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await transaction(async (client) => {
      // Create user
      const r = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3) RETURNING id, name, email, is_active, created_at`,
        [name, email, passwordHash]
      );
      const newUser = r.rows[0];

      // Assign Store User role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = 'Store User'
         ON CONFLICT DO NOTHING`,
        [newUser.id]
      );

      // Add to store_users
      await client.query(
        `INSERT INTO store_users (store_id, user_id, is_admin)
         VALUES ($1, $2, false)
         ON CONFLICT (store_id, user_id) DO NOTHING`,
        [id, newUser.id]
      );

      return newUser;
    });

    return created(res, user, 'User added to store successfully');
  } catch (err) { next(err); }
};

const removeUserFromStore = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    if (userId === req.user.id) {
      return error(res, 'Cannot remove yourself from the store', 400);
    }

    // Prevent removing the store admin
    const isAdmin = await query(
      `SELECT is_admin FROM store_users WHERE store_id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (!isAdmin.rows.length) return error(res, 'User not found in this store', 404);
    if (isAdmin.rows[0].is_admin) return error(res, 'Cannot remove the store admin', 400);

    await query(
      `DELETE FROM store_users WHERE store_id = $1 AND user_id = $2`,
      [id, userId]
    );

    return success(res, null, 'User removed from store');
  } catch (err) { next(err); }
};

module.exports = {
  getStores, getStoreById, createStore, updateStore, deleteStore,
  getStoreUsers, addUserToStore, removeUserFromStore,
};