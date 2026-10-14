import { useState, type FormEvent } from 'react';
import { errorMessage } from '../lib/api';
import { PAYMENT_LABELS, PAYMENT_METHODS, today } from '../lib/format';
import type { Category, Expense, ExpenseInput, PaymentMethod } from '../types';
import { ErrorBanner } from './Feedback';

interface Values {
  title: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

interface Props {
  categories: Category[];
  initial?: Expense;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseForm({ categories, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Values>(() => ({
    title: initial?.title ?? '',
    amount: initial ? String(initial.amount) : '',
    category: initial?.category._id ?? categories.find((c) => !c.isDefault)?._id ?? categories[0]?._id ?? '',
    date: initial ? initial.date.slice(0, 10) : today(),
    paymentMethod: initial?.paymentMethod ?? 'cash',
    notes: initial?.notes ?? '',
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(values.amount);
    if (!values.title.trim()) return setError('Enter a title for this expense.');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter an amount greater than 0.');
    if (!values.category) return setError('Choose a category.');

    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...values, title: values.title.trim(), amount });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorBanner message={error} />
      <label>
        Title
        <input value={values.title} maxLength={120} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Weekly groceries" autoFocus />
      </label>
      <div className="form-row">
        <label>
          Amount
          <input type="number" inputMode="decimal" min="0" step="0.01" value={values.amount} onChange={(e) => set('amount', e.target.value)} />
        </label>
        <label>
          Date
          <input type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Category
          <select value={values.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Payment method
          <select value={values.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Notes (optional)
        <textarea rows={3} maxLength={500} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
