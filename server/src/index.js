import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Category from './models/Category.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

// Central error handler: consistent JSON errors.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate value' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong on our side' : err.message });
});

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Education'];

async function seed() {
  if (!(await Category.exists({ isDefault: true }))) await Category.create({ name: 'Uncategorized', isDefault: true });
  if ((await Category.countDocuments()) === 1) await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));

  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  if (email && process.env.ADMIN_PASSWORD && !(await User.exists({ email }))) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      role: 'admin',
    });
    console.log(`Admin account created: ${email}`);
  }
}

const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(seed)
  .then(() => app.listen(port, () => console.log(`Retain API listening on port ${port}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
