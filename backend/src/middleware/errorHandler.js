const logger = require('../config/logger');

module.exports = (err, req, res, _next) => {
  logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }
  // FK violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({ success: false, message });
};