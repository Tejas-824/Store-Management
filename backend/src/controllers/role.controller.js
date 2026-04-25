const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { success, created, error } = require('../utils/response');

const getRoles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at,
              json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action))
                FILTER (WHERE p.id IS NOT NULL) AS permissions,
              COUNT(DISTINCT ur.user_id) AS user_count
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p       ON p.id = rp.permission_id
       LEFT JOIN user_roles ur       ON ur.role_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at`
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const getPermissions = async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM permissions ORDER BY resource, action');
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const getRoleById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at,
              json_agg(DISTINCT jsonb_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action))
                FILTER (WHERE p.id IS NOT NULL) AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p       ON p.id = rp.permission_id
       WHERE r.id = $1 GROUP BY r.id`,
      [req.params.id]
    );
    if (!result.rows.length) return error(res, 'Role not found', 404);
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const createRole = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { name, description, permissionIds = [] } = req.body;

    const role = await transaction(async (client) => {
      const r = await client.query(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2) RETURNING id, name, description, is_system, created_at`,
        [name, description]
      );
      const newRole = r.rows[0];
      for (const pid of permissionIds) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newRole.id, pid]
        );
      }
      return newRole;
    });

    return created(res, role);
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 422, errs.array());

    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    const existing = await query('SELECT id, is_system FROM roles WHERE id = $1', [id]);
    if (!existing.rows.length) return error(res, 'Role not found', 404);
    if (existing.rows[0].is_system && name) return error(res, 'Cannot rename system roles', 403);

    const updates = [], params = [];
    if (name !== undefined) { params.push(name); updates.push(`name = $${params.length}`); }
    if (description !== undefined) { params.push(description); updates.push(`description = $${params.length}`); }

    let role;
    if (updates.length) {
      params.push(id);
      role = (await query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = $${params.length}
         RETURNING id, name, description, is_system, updated_at`,
        params
      )).rows[0];
    }

    if (permissionIds !== undefined) {
      await transaction(async (client) => {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        for (const pid of permissionIds) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, pid]
          );
        }
      });
    }

    return success(res, role || { id });
  } catch (err) { next(err); }
};

const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT is_system FROM roles WHERE id = $1', [id]);
    if (!existing.rows.length) return error(res, 'Role not found', 404);
    if (existing.rows[0].is_system) return error(res, 'Cannot delete system roles', 403);

    await query('DELETE FROM roles WHERE id = $1', [id]);
    return success(res, null, 'Role deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { getRoles, getPermissions, getRoleById, createRole, updateRole, deleteRole };