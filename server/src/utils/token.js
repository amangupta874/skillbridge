import crypto from 'node:crypto';

export const generateToken = () => crypto.randomBytes(32).toString('hex');
// Only the hash of the token is stored in the sessions table, never the token itself.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
