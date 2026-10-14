import { useState } from 'react';
import { errorMessage } from '../lib/api';
import { PAYMENT_LABELS, formatDate, formatMoney } from '../lib/format';
import type { Expense } from '../types';
import { ErrorBanner } from './Feedback';

interface Props {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export default function ExpenseDetail({ expense, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remove = async () => {
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="detail">
      <ErrorBanner message={error} />
      <p className="detail-amount">{formatMoney(expense.amount)}</p>
      <h3>{expense.title}</h3>
      <dl className="detail-list">
        <dt>Category</dt>
        <dd>{expense.category.name}</dd>
        <dt>Date</dt>
        <dd>{formatDate(expense.date)}</dd>
        <dt>Payment method</dt>
        <dd>{PAYMENT_LABELS[expense.paymentMethod]}</dd>
        <dt>Notes</dt>
        <dd>{expense.notes || 'No notes'}</dd>
      </dl>
      <div className="form-actions">
        {confirming ? (
          <>
            <span className="confirm-text">Delete this expense permanently?</span>
            <button className="btn" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete expense'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-danger-ghost" onClick={() => setConfirming(true)}>
              Delete
            </button>
            <button className="btn btn-primary" onClick={onEdit}>
              Edit expense
            </button>
          </>
        )}
      </div>
    </div>
  );
}
