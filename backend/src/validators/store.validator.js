const { body, param } = require('express-validator');

const createStoreValidator = [
  body('name').trim().notEmpty().withMessage('Store name required').isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('address').optional().trim().isLength({ max: 255 }),
  body('city').optional().trim().isLength({ max: 100 }),
  body('state').optional().trim().isLength({ max: 100 }),
  body('zip_code').optional().trim().isLength({ max: 20 }),
  body('country').optional().trim().isLength({ max: 100 }),
  body('phone').optional().trim(),
  body('email').optional().trim().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('website').optional().trim().isURL().withMessage('Invalid URL'),
  body('owner_id').optional().isUUID().withMessage('Invalid owner ID'),
];

const updateStoreValidator = [
  param('id').isUUID().withMessage('Invalid store ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zip_code').optional().trim(),
  body('country').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('website').optional().trim().isURL().withMessage('Invalid URL'),
  body('owner_id').optional().isUUID(),
  body('is_active').optional().isBoolean(),
];

const addStoreUserValidator = [
  param('id').isUUID().withMessage('Invalid store ID'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().notEmpty().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password required')
    .isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Must include uppercase, lowercase, number and special character'),
];

module.exports = { createStoreValidator, updateStoreValidator, addStoreUserValidator };