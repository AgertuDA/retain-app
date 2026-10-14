import type {
  AdminInsights, AuthResponse, Category, DashboardData, Expense, ExpenseInput, ExpensePage, FilterFields, User,
} from '../types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'retain_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
}

async function request<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();

  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message ?? 'Request failed';
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body }),
  me: () => request<{ user: User }>('/auth/me'),

  categories: () => request<Category[]>('/categories'),
  createCategory: (name: string) => request<Category>('/categories', { method: 'POST', body: { name } }),
  updateCategory: (id: string, name: string) => request<Category>(`/categories/${id}`, { method: 'PUT', body: { name } }),
  deleteCategory: (id: string) =>
    request<{ message: string; reassignedExpenses: number; movedTo: string }>(`/categories/${id}`, { method: 'DELETE' }),

  expenses: (filters: FilterFields) => request<ExpensePage>('/expenses', { query: { ...filters } }),
  createExpense: (body: ExpenseInput) => request<Expense>('/expenses', { method: 'POST', body }),
  updateExpense: (id: string, body: ExpenseInput) => request<Expense>(`/expenses/${id}`, { method: 'PUT', body }),
  deleteExpense: (id: string) => request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),

  saveBudget: (month: string, amount: number) =>
    request<{ month: string; amount: number }>('/budgets', { method: 'PUT', body: { month, amount } }),
  dashboard: (month: string) => request<DashboardData>('/dashboard', { query: { month } }),
  adminInsights: () => request<AdminInsights>('/admin/insights'),
};

export const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
