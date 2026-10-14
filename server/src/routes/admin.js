import { Router } from 'express';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Category from '../models/Category.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler, currentMonth, monthRange } from '../utils.js';

const router = Router();
router.use(protect, adminOnly);

// Platform-wide insights for the admin dashboard.
router.get(
  '/insights',
  asyncHandler(async (_req, res) => {
    const [start, end] = monthRange(currentMonth());

    const [userCount, totals, monthCount, perCategory, categories, recentExpenses, recentUsers] = await Promise.all([
      User.countDocuments(),
      Expense.aggregate([{ $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } }]),
      Expense.countDocuments({ date: { $gte: start, $lt: end } }),
      Expense.aggregate([{ $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Category.find(),
      Expense.find().sort({ createdAt: -1 }).limit(5).populate('category', 'name').populate('user', 'name email'),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    ]);

    const stats = new Map(perCategory.map((c) => [String(c._id), c]));
    // Include categories with no expenses so "least used" is meaningful.
    const usage = categories.map((c) => ({
      categoryId: c._id,
      name: c.name,
      total: stats.get(String(c._id))?.total ?? 0,
      count: stats.get(String(c._id))?.count ?? 0,
    }));
    const byUse = [...usage].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    res.json({
      totalUsers: userCount,
      totalExpenses: totals[0]?.count ?? 0,
      totalValue: totals[0]?.value ?? 0,
      expensesThisMonth: monthCount,
      spendingPerCategory: [...usage].sort((a, b) => b.total - a.total),
      topCategories: byUse.slice(0, 5),
      bottomCategories: [...byUse].reverse().slice(0, 5),
      recentExpenses,
      recentUsers,
    });
  })
);

export default router;
