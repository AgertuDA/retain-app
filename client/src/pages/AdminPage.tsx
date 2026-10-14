import { useCallback, useEffect, useState } from 'react';
import CategoryBars from '../components/CategoryBars';
import CategoryManager from '../components/CategoryManager';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback';
import { useCategories } from '../hooks/useCategories';
import { api, errorMessage } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { AdminInsights } from '../types';

export default function AdminPage() {
  const { categories, error: categoryError, reload: reloadCategories } = useCategories();
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [error, setError] = useState('');

  const loadInsights = useCallback(async () => {
    try {
      setInsights(await api.adminInsights());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const categoriesChanged = () => {
    void reloadCategories();
    void loadInsights();
  };

  return (
    <>
      <div className="page-head">
        <h1>Admin dashboard</h1>
      </div>
      <ErrorBanner message={error || categoryError} onRetry={loadInsights} />
      {!insights && !error && <Spinner label="Loading platform insights" />}

      {insights && (
        <>
          <div className="tiles tiles-4">
            <div className="tile">
              <p className="tile-label">Registered users</p>
              <p className="tile-figure">{insights.totalUsers}</p>
            </div>
            <div className="tile">
              <p className="tile-label">Expenses recorded</p>
              <p className="tile-figure">{insights.totalExpenses}</p>
            </div>
            <div className="tile">
              <p className="tile-label">Total value</p>
              <p className="tile-figure">{formatMoney(insights.totalValue)}</p>
            </div>
            <div className="tile">
              <p className="tile-label">Expenses this month</p>
              <p className="tile-figure">{insights.expensesThisMonth}</p>
            </div>
          </div>

          <div className="two-col">
            <section className="panel">
              <h2>Total spending per category</h2>
              <CategoryBars data={insights.spendingPerCategory} />
            </section>
            <CategoryManager categories={categories} onChanged={categoriesChanged} />
          </div>

          <div className="two-col">
            <section className="panel">
              <h2>Top 5 most-used categories</h2>
              <CategoryBars data={insights.topCategories} by="count" emptyTitle="No categories yet" />
            </section>
            <section className="panel">
              <h2>Bottom 5 least-used categories</h2>
              <CategoryBars data={insights.bottomCategories} by="count" emptyTitle="No categories yet" />
            </section>
          </div>

          <div className="two-col">
            <section className="panel">
              <h2>Recently added expenses</h2>
              {insights.recentExpenses.length === 0 ? (
                <EmptyState title="No expenses recorded yet" />
              ) : (
                <ul className="exp-list">
                  {insights.recentExpenses.map((e) => (
                    <li key={e._id} className="exp-row exp-static">
                      <span className="exp-main">
                        <span className="exp-title">{e.title}</span>
                        <span className="exp-meta">
                          {e.user?.name ?? 'Deleted user'}, {e.category?.name ?? 'Uncategorized'}, {formatDate(e.date)}
                        </span>
                      </span>
                      <span className="exp-amount">{formatMoney(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel">
              <h2>Recently registered users</h2>
              <ul className="exp-list">
                {insights.recentUsers.map((u) => (
                  <li key={u._id} className="exp-row exp-static">
                    <span className="exp-main">
                      <span className="exp-title">{u.name}</span>
                      <span className="exp-meta">{u.email}</span>
                    </span>
                    <span className="exp-meta">{formatDate(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
