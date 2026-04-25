const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    issuer: 'store-mgmt',
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    issuer: 'store-mgmt',
  });

const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
const hashToken          = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken };