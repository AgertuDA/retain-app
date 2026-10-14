import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils.js';

const router = Router();

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });

// Anyone who signs up becomes a regular user. Admins are provisioned via ADMIN_* env vars.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name?.trim()) throw new HttpError(400, 'Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new HttpError(400, 'A valid email is required');
    if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'user' });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) throw new HttpError(401, 'Incorrect email or password');
    res.json({ token: sign(user), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
