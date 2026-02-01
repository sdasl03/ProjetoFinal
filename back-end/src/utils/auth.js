// utils/auth.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';

/**
 * Generate JWT access token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      type: user.type,
      iat: Math.floor(Date.now() / 1000),
    },
    config.auth.jwtSecret,
    {
      expiresIn: config.auth.jwtExpiresIn,
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = async (user, req) => {
  // Generate random token
  const token = crypto.randomBytes(64).toString('hex');

  // Hash the token for storage
  const hashedToken = crypto.createHash('sha256').createHmac('sha256', config.auth.jwtSecret)
    .update(token)
    .digest('hex');

  // Store in database
  const refreshToken = await RefreshToken.create({
    token: hashedToken,
    user_id: user._id,
    expiresAt: new Date(Date.now() + config.auth.refreshTokenExpiresDays * 24 * 60 * 60 * 1000), // Convert days to milliseconds
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
  });

  return {
    token,
    hashedToken,
    refreshToken,
  };
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token) => {
  // Hash the provided token
  const hashedToken = crypto.createHash('sha256').createHmac('sha256', config.auth.refreshTokenSecret)
    .update(token)
    .digest('hex');

  // Find in database
  const refreshToken = await RefreshToken.findOne({
    token: hashedToken,
    expiresAt: { $gt: new Date() },
  }).populate('user');

  return refreshToken;
};