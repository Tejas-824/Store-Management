const router = require('express').Router();
const { getRoles, getPermissions, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/role.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/permission');
const { createRoleValidator, updateRoleValidator } = require('../validators/role.validator');

router.use(authenticate);
router.get('/permissions', authorize('roles:read'), getPermissions);
router.get('/', authorize('roles:read'), getRoles);
router.get('/:id', authorize('roles:read'), getRoleById);
router.post('/', authorize('roles:write'), createRoleValidator, createRole);
router.put('/:id', authorize('roles:write'), updateRoleValidator, updateRole);
router.delete('/:id', authorize('roles:delete'), deleteRole);

module.exports = router;