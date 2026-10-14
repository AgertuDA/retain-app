import { Router } from 'express';
import Expense, { PAYMENT_METHODS } from '../models/Expense.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';
import { HttpError, asyncHandler, escapeRegex, isId } from '../utils.js';

const router = Router();
router.use(protect);

async function validate(body) {
  const title = (body.title || '').trim();
  const amount = Number(body.amount);
  const date = new Date(body.date);
  if (!title) throw new HttpError(400, 'Title is required');
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Amount must be greater than 0');
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'A valid date is required');
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) throw new HttpError(400, 'Invalid payment method');
  if (!isId(body.category) || !(await Category.exists({ _id: body.category }))) throw new HttpError(400, 'Invalid category');
  return { title, amount, date, paymentMethod: body.paymentMethod, category: body.category, notes: body.notes || '' };
}

// List the signed-in user's expenses with filtering, searching, sorting and pagination.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, paymentMethod, dateFrom, dateTo, minAmount, maxAmount } = req.query;
    const sortBy = req.query.sortBy === 'amount' ? 'amount' : 'date';
    const order = req.query.order === 'asc' ? 1 : -1;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = { user: req.user._id };
    if (search) {
      const rx = new RegExp(escapeRegex(String(search)), 'i');
      filter.$or = [{ title: rx }, { notes: rx }];
    }
    if (category && isId(category)) filter.category = category;
    if (paymentMethod && PAYMENT_METHODS.includes(paymentMethod)) filter.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const [items, total] = await Promise.all([
      Expense.find(filter)
        .populate('category', 'name')
        .sort({ [sortBy]: order, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

// Every lookup is scoped to req.user so users only reach their own data.
const findOwned = async (req) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Invalid expense id');
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) throw new HttpError(404, 'Expense not found');
  return expense;
};

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await findOwned(req);
    res.json(await expense.populate('category', 'name'));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await validate(req.body);
    const expense = await Expense.create({ ...data, user: req.user._id });
    res.status(201).json(await expense.populate('category', 'name'));
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await findOwned(req);
    expense.set(await validate(req.body));
    await expense.save();
    res.json(await expense.populate('category', 'name'));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const expense = await findOwned(req);
    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  })
);

export default router;
