const router = require('express').Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/permission');
const { createUserValidator, updateUserValidator, uuidParamValidator } = require('../validators/user.validator');

router.use(authenticate);
router.get('/', authorize('users:read'), getUsers);
router.get('/:id', authorize('users:read'), uuidParamValidator, getUserById);
router.post('/', authorize('users:write'), createUserValidator, createUser);
router.put('/:id', authorize('users:write'),  updateUserValidator, updateUser);
router.delete('/:id', authorize('users:delete'), uuidParamValidator, deleteUser);

module.exports = router;