import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils.js';

/** Requires a valid Bearer token and attaches the user to req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired or invalid. Please sign in again.');
  }
  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  req.user = user;
  next();
});

/** Must run after protect. */
export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
};
