import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ExpenseDetail from '../components/ExpenseDetail';
import ExpenseFilters from '../components/ExpenseFilters';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import { EmptyState, ErrorBanner, Notice, Spinner } from '../components/Feedback';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useCategories } from '../hooks/useCategories';
import { api, errorMessage } from '../lib/api';
import { useAppDispatch, useAppSelector } from '../store';
import { countActiveFilters, resetFilters, setPage } from '../store/filtersSlice';
import type { Expense, ExpenseInput, ExpensePage } from '../types';

type Dialog = { kind: 'none' } | { kind: 'new' } | { kind: 'view'; expense: Expense } | { kind: 'edit'; expense: Expense };

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const { categories, error: categoryError } = useCategories();
  const location = useLocation();

  const [data, setData] = useState<ExpensePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(() =>
    (location.state as { openNew?: boolean } | null)?.openNew ? { kind: 'new' } : { kind: 'none' }
  );

  // Refetch whenever any Redux filter changes (or after a create, edit or delete).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .expenses(filters)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError('');
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  // If the last item on a page was deleted, step back a page.
  useEffect(() => {
    if (data && filters.page > data.pages) dispatch(setPage(data.pages));
  }, [data, filters.page, dispatch]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const close = useCallback(() => setDialog({ kind: 'none' }), []);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 4000);
  };

  const create = async (input: ExpenseInput) => {
    await api.createExpense(input);
    close();
    refresh();
    flash('Expense added.');
  };

  const update = async (id: string, input: ExpenseInput) => {
    await api.updateExpense(id, input);
    close();
    refresh();
    flash('Expense updated.');
  };

  const remove = async (id: string) => {
    await api.deleteExpense(id);
    close();
    refresh();
    flash('Expense deleted.');
  };

  const filtered = countActiveFilters(filters) > 0;

  return (
    <>
      <div className="page-head">
        <h1>Expenses</h1>
        <div className="page-tools">
          <button className="btn btn-primary" onClick={() => setDialog({ kind: 'new' })} disabled={categories.length === 0}>
            Add expense
          </button>
        </div>
      </div>

      <Notice message={notice} />
      <ErrorBanner message={categoryError} />
      <ExpenseFilters categories={categories} />
      <ErrorBanner message={error} onRetry={refresh} />

      <section className="panel" aria-busy={loading}>
        {loading && !data && <Spinner label="Loading expenses" />}
        {data && data.items.length === 0 && !loading && (
          <EmptyState title={filtered ? 'No expenses match these filters' : 'No expenses yet'}>
            {filtered ? (
              <button className="btn" onClick={() => dispatch(resetFilters())}>
                Clear filters
              </button>
            ) : (
              'Choose Add expense to record your first one.'
            )}
          </EmptyState>
        )}
        {data && data.items.length > 0 && (
          <div className={loading ? 'is-refreshing' : undefined}>
            <ExpenseList items={data.items} onSelect={(expense) => setDialog({ kind: 'view', expense })} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={(p) => dispatch(setPage(p))} />
          </div>
        )}
      </section>

      {dialog.kind === 'new' && (
        <Modal title="Add expense" onClose={close}>
          <ExpenseForm categories={categories} onSubmit={create} onCancel={close} />
        </Modal>
      )}
      {dialog.kind === 'view' && (
        <Modal title="Expense details" onClose={close}>
          <ExpenseDetail expense={dialog.expense} onEdit={() => setDialog({ kind: 'edit', expense: dialog.expense })} onDelete={() => remove(dialog.expense._id)} />
        </Modal>
      )}
      {dialog.kind === 'edit' && (
        <Modal title="Edit expense" onClose={close}>
          <ExpenseForm categories={categories} initial={dialog.expense} onSubmit={(input) => update(dialog.expense._id, input)} onCancel={close} />
        </Modal>
      )}
    </>
  );
}
