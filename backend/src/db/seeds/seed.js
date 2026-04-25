require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { query, pool } = require('../../config/database');
const logger = require('../../config/logger');

const PERMISSIONS = [
  { name: 'users:read',         resource: 'users',       action: 'read',   description: 'View users' },
  { name: 'users:write',        resource: 'users',       action: 'write',  description: 'Create and update users' },
  { name: 'users:delete',       resource: 'users',       action: 'delete', description: 'Delete users' },
  { name: 'roles:read',         resource: 'roles',       action: 'read',   description: 'View roles' },
  { name: 'roles:write',        resource: 'roles',       action: 'write',  description: 'Create and update roles' },
  { name: 'roles:delete',       resource: 'roles',       action: 'delete', description: 'Delete roles' },
  { name: 'stores:read',        resource: 'stores',      action: 'read',   description: 'View stores' },
  { name: 'stores:write',       resource: 'stores',      action: 'write',  description: 'Create and update stores' },
  { name: 'stores:delete',      resource: 'stores',      action: 'delete', description: 'Delete stores' },
  { name: 'store_users:read',   resource: 'store_users', action: 'read',   description: 'View store users' },
  { name: 'store_users:write',  resource: 'store_users', action: 'write',  description: 'Create store users' },
  { name: 'store_users:delete', resource: 'store_users', action: 'delete', description: 'Remove store users' },
];

const ROLES = [
  {
    name: 'Super Admin',
    description: 'Full system access including store management',
    is_system: true,
    permissions: PERMISSIONS.map(p => p.name),
  },
  {
    name: 'Admin',
    description: 'Administrative access',
    is_system: true,
    permissions: ['users:read', 'users:write', 'roles:read', 'stores:read', 'stores:write', 'stores:delete'],
  },
  {
    name: 'Store Admin',
    description: 'Manages users within their assigned store only',
    is_system: false,
    permissions: ['store_users:read', 'store_users:write', 'store_users:delete'],
  },
  {
    name: 'Store User',
    description: 'Regular user within a store, no admin access',
    is_system: false,
    permissions: [],
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    is_system: false,
    permissions: ['users:read', 'stores:read', 'roles:read'],
  },
];

async function seed() {
  try {
    logger.info('🌱 Starting seed...');

    for (const perm of PERMISSIONS) {
      await query(
        `INSERT INTO permissions (name, resource, action, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [perm.name, perm.resource, perm.action, perm.description]
      );
    }
    logger.info(`✅ ${PERMISSIONS.length} permissions seeded`);

    for (const role of ROLES) {
      const r = await query(
        `INSERT INTO roles (name, description, is_system)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [role.name, role.description, role.is_system]
      );
      const roleId = r.rows[0].id;
      // Clear existing permissions and re-assign
      await query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      for (const permName of role.permissions) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, id FROM permissions WHERE name = $2
           ON CONFLICT DO NOTHING`,
          [roleId, permName]
        );
      }
    }
    logger.info(`✅ ${ROLES.length} roles seeded`);

    const passwordHash = await bcrypt.hash('Admin@123', parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const u = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Super Admin', 'admin@example.com', passwordHash]
    );
    await query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'Super Admin'
       ON CONFLICT DO NOTHING`,
      [u.rows[0].id]
    );

    logger.info('✅ Admin user: admin@example.com / Admin@123');
    logger.info('🎉 Seed complete!');
  } catch (err) {
    logger.error('Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch(() => process.exit(1));