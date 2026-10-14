import { Router } from 'express';
import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, budgetStatus, currentMonth, monthRange } from '../utils.js';

const router = Router();
router.use(protect);

// Per-user summary for one month.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    const [start, end] = monthRange(month);
    const match = { user: req.user._id, date: { $gte: start, $lt: end } };

    const [budgetDoc, totals, byCategory, highest, recent] = await Promise.all([
      Budget.findOne({ user: req.user._id, month }),
      Expense.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $project: { _id: 0, categoryId: '$_id', name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Unknown'] }, total: 1, count: 1 } },
        { $sort: { total: -1 } },
      ]),
      Expense.findOne(match).sort({ amount: -1 }).populate('category', 'name'),
      Expense.find(match).sort({ date: -1, _id: -1 }).limit(5).populate('category', 'name'),
    ]);

    const spent = totals[0]?.total ?? 0;
    const budget = budgetDoc ? budgetDoc.amount : null;
    res.json({
      month,
      totalSpent: spent,
      expenseCount: totals[0]?.count ?? 0,
      budget,
      remaining: budget == null ? null : budget - spent,
      status: budgetStatus(spent, budget),
      highestExpense: highest,
      spendingByCategory: byCategory,
      recentExpenses: recent,
    });
  })
);

export default router;
