import config from './src/config/env.js';
console.log('Config loaded:', config);

// Test JWT
import jwt from 'jsonwebtoken';

const testPayload = { userId: 'test' };
const token = jwt.sign(testPayload, config.auth.jwtSecret, { expiresIn: '1h' });
console.log('Test token generated:', token);

const decoded = jwt.verify(token, config.auth.jwtSecret);
console.log('Test token verified:', decoded);