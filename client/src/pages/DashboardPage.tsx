import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BudgetGauge from '../components/BudgetGauge';
import CategoryBars from '../components/CategoryBars';
import ExpenseList from '../components/ExpenseList';
import { EmptyState, ErrorBanner, Spinner } from '../components/Feedback';
import { api, errorMessage } from '../lib/api';
import { currentMonth, formatMoney, monthLabel } from '../lib/format';
import type { DashboardData } from '../types';

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      setData(await api.dashboard(m));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(month);
  }, [month, load]);

  const saveBudget = async (amount: number) => {
    await api.saveBudget(month, amount);
    await load(month);
  };

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="page-tools">
          <label className="inline-field">
            Month
            <input type="month" value={month} max="2100-12" onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </label>
          <Link className="btn btn-primary" to="/expenses" state={{ openNew: true }}>
            Add expense
          </Link>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={() => load(month)} />
      {loading && !data && <Spinner label="Loading your month" />}

      {data && (
        <div className={loading ? 'is-refreshing' : undefined}>
          <BudgetGauge data={data} onSave={saveBudget} />

          <div className="tiles">
            <div className="tile">
              <p className="tile-label">Highest expense</p>
              {data.highestExpense ? (
                <>
                  <p className="tile-figure">{formatMoney(data.highestExpense.amount)}</p>
                  <p className="tile-sub">{data.highestExpense.title}</p>
                </>
              ) : (
                <p className="tile-sub">Nothing recorded in {monthLabel(month)}.</p>
              )}
            </div>
            <div className="tile">
              <p className="tile-label">Expenses logged</p>
              <p className="tile-figure">{data.expenseCount}</p>
              <p className="tile-sub">in {monthLabel(month)}</p>
            </div>
          </div>

          <div className="two-col">
            <section className="panel">
              <h2>Spending by category</h2>
              <CategoryBars data={data.spendingByCategory} emptyTitle="No spending this month" />
            </section>
            <section className="panel">
              <h2>Recent expenses</h2>
              {data.recentExpenses.length === 0 ? (
                <EmptyState title="No expenses yet">
                  <Link to="/expenses" state={{ openNew: true }}>
                    Add your first expense
                  </Link>{' '}
                  to start tracking.
                </EmptyState>
              ) : (
                <ExpenseList items={data.recentExpenses} />
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
