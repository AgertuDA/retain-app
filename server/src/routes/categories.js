import { Router } from 'express';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { HttpError, asyncHandler, escapeRegex, isId } from '../utils.js';

const router = Router();
router.use(protect);

// Any signed-in user can read categories (needed for expense forms and filters).
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await Category.find().sort({ isDefault: -1, name: 1 }));
  })
);

const cleanName = (name) => {
  const n = (name || '').trim();
  if (!n) throw new HttpError(400, 'Category name is required');
  return n;
};
const sameName = (n) => new RegExp(`^${escapeRegex(n)}$`, 'i');

router.post(
  '/',
  adminOnly,
  asyncHandler(async (req, res) => {
    const name = cleanName(req.body.name);
    if (await Category.findOne({ name: sameName(name) })) throw new HttpError(409, 'Category already exists');
    res.status(201).json(await Category.create({ name }));
  })
);

router.put(
  '/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(400, 'Invalid category id');
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    if (category.isDefault) throw new HttpError(400, 'The default category cannot be renamed');
    const name = cleanName(req.body.name);
    if (await Category.findOne({ name: sameName(name), _id: { $ne: category._id } })) throw new HttpError(409, 'Category already exists');
    category.name = name;
    res.json(await category.save());
  })
);

// Deleting a category moves its expenses to the default "Uncategorized" category.
router.delete(
  '/:id',
  adminOnly,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(400, 'Invalid category id');
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, 'Category not found');
    if (category.isDefault) throw new HttpError(400, 'The default category cannot be deleted');
    const fallback = await Category.findOne({ isDefault: true });
    const moved = await Expense.updateMany({ category: category._id }, { category: fallback._id });
    await category.deleteOne();
    res.json({ message: 'Category deleted', reassignedExpenses: moved.modifiedCount, movedTo: fallback.name });
  })
);

export default router;
