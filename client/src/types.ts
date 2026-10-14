export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  isDefault: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'other';

export interface CategoryRef {
  _id: string;
  name: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
  category: CategoryRef;
  createdAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export interface ExpensePage {
  items: Expense[];
  total: number;
  page: number;
  pages: number;
}

export type SortField = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';

/** Everything the expense list can be filtered, searched, sorted and paged by. */
export interface FilterFields {
  search: string;
  category: string;
  paymentMethod: '' | PaymentMethod;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortField;
  order: SortOrder;
  page: number;
  limit: number;
}

export type BudgetStatus = 'none' | 'within' | 'approaching' | 'over';

export interface CategoryTotal {
  categoryId: string;
  name: string;
  total: number;
  count: number;
}

export interface DashboardData {
  month: string;
  totalSpent: number;
  expenseCount: number;
  budget: number | null;
  remaining: number | null;
  status: BudgetStatus;
  highestExpense: Expense | null;
  spendingByCategory: CategoryTotal[];
  recentExpenses: Expense[];
}

export interface AdminExpense extends Omit<Expense, 'category'> {
  category: CategoryRef | null;
  user: { _id: string; name: string; email: string } | null;
}

export interface AdminInsights {
  totalUsers: number;
  totalExpenses: number;
  totalValue: number;
  expensesThisMonth: number;
  spendingPerCategory: CategoryTotal[];
  topCategories: CategoryTotal[];
  bottomCategories: CategoryTotal[];
  recentExpenses: AdminExpense[];
  recentUsers: Array<Pick<User, 'name' | 'email' | 'role' | 'createdAt'> & { _id: string }>;
}
