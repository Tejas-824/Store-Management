const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().notEmpty().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password required')
    .isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Must include uppercase, lowercase, number and special character'),
];

const loginValidator = [
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
];

module.exports = { registerValidator, loginValidator, refreshValidator };