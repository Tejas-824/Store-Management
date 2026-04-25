const { body, param } = require('express-validator');

const createUserValidator = [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password')
    .notEmpty().isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Must include uppercase, lowercase, number and special character'),
  body('roleIds').optional().isArray(),
  body('roleIds.*').optional().isUUID(),
];

const updateUserValidator = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('is_active').optional().isBoolean(),
  body('roleIds').optional().isArray(),
  body('roleIds.*').optional().isUUID(),
];

const uuidParamValidator = [
  param('id').isUUID().withMessage('Invalid ID'),
];

module.exports = { createUserValidator, updateUserValidator, uuidParamValidator };