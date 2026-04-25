const router = require('express').Router();
const {
  getStores, getStoreById, createStore, updateStore, deleteStore,
  getStoreUsers, addUserToStore, removeUserFromStore,
} = require('../controllers/store.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeRole, authorizeStoreAccess } = require('../middleware/permission');
const { createStoreValidator, updateStoreValidator, addStoreUserValidator } = require('../validators/store.validator');

router.use(authenticate);

// ── Super Admin ONLY — full store CRUD ────────────────────────────────────────
router.get('/',    authorizeRole('Super Admin'), getStores);
router.post('/',   authorizeRole('Super Admin'), createStoreValidator, createStore);
router.put('/:id', authorizeRole('Super Admin'), updateStoreValidator, updateStore);
router.delete('/:id', authorizeRole('Super Admin'), deleteStore);

// ── Super Admin OR Store Admin (own store only) ────────────────────────────────
router.get('/:id', authorizeStoreAccess, getStoreById);

// ── Store User Management ──────────────────────────────────────────────────────
router.get('/:id/users',
  authorizeStoreAccess,
  authorize('store_users:read'),
  getStoreUsers
);
router.post('/:id/users',
  authorizeStoreAccess,
  authorize('store_users:write'),
  addStoreUserValidator,
  addUserToStore
);
router.delete('/:id/users/:userId',
  authorizeStoreAccess,
  authorize('store_users:delete'),
  removeUserFromStore
);

module.exports = router;