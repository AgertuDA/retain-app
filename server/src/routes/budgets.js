import { Router } from 'express';
import Budget from '../models/Budget.js';
import { protect } from '../middleware/auth.js';
import { HttpError, asyncHandler, currentMonth, monthRange } from '../utils.js';

const router = Router();
router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    monthRange(month);
    const budget = await Budget.findOne({ user: req.user._id, month });
    res.json({ month, amount: budget ? budget.amount : null });
  })
);

// Create or update the budget for a month.
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.body.month || currentMonth();
    monthRange(month);
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, 'Budget must be 0 or more');
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month },
      { amount },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ month, amount: budget.amount });
  })
);

export default router;
