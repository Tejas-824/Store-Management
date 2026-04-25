const { body, param } = require('express-validator');

const createRoleValidator = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').optional().isUUID(),
];

const updateRoleValidator = [
  param('id').isUUID().withMessage('Invalid role ID'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').optional().isUUID(),
];

module.exports = { createRoleValidator, updateRoleValidator };