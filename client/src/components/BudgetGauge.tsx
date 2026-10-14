import { useState, type FormEvent } from 'react';
import { errorMessage } from '../lib/api';
import { formatMoney, monthLabel } from '../lib/format';
import type { DashboardData } from '../types';
import { ErrorBanner } from './Feedback';

const STATUS_TEXT: Record<DashboardData['status'], string> = {
  none: 'No budget set',
  within: 'Within budget',
  approaching: 'Approaching your limit',
  over: 'Over budget',
};

interface Props {
  data: DashboardData;
  onSave: (amount: number) => Promise<void>;
}

/** The dashboard's centrepiece: how much of the month's budget is used, plus the budget editor. */
export default function BudgetGauge({ data, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { budget, totalSpent, remaining, status } = data;
  const used = budget && budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const open = () => {
    setValue(budget != null ? String(budget) : '');
    setError('');
    setEditing(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(value);
    if (value === '' || !Number.isFinite(amount) || amount < 0) return setError('Enter a budget of 0 or more.');
    setSaving(true);
    try {
      await onSave(amount);
      setEditing(false);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="gauge" data-status={status} aria-label={`Budget for ${monthLabel(data.month)}`}>
      <div className="gauge-head">
        <div>
          <p className="gauge-label">Spent in {monthLabel(data.month)}</p>
          <p className="gauge-figure">{formatMoney(totalSpent)}</p>
        </div>
        <span className="gauge-status">{STATUS_TEXT[status]}</span>
      </div>

      <div
        className="gauge-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(used)}
        aria-label="Share of budget used"
      >
        <div className="gauge-fill" style={{ width: `${used}%` }} />
        {budget ? <span className="gauge-tick" aria-hidden="true" /> : null}
      </div>

      <div className="gauge-foot">
        <p>
          {budget == null ? (
            'Set a monthly budget to see how much is left.'
          ) : remaining != null && remaining >= 0 ? (
            <>
              <strong>{formatMoney(remaining)}</strong> left of {formatMoney(budget)}
            </>
          ) : (
            <>
              <strong>{formatMoney(Math.abs(remaining ?? 0))}</strong> over your {formatMoney(budget)} budget
            </>
          )}
        </p>
        {!editing && (
          <button className="btn btn-light" onClick={open}>
            {budget == null ? 'Set budget' : 'Change budget'}
          </button>
        )}
      </div>

      {editing && (
        <form className="gauge-edit" onSubmit={submit}>
          <ErrorBanner message={error} />
          <label>
            Budget for {monthLabel(data.month)}
            <input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </label>
          <button type="button" className="btn btn-light" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? 'Saving…' : 'Save budget'}
          </button>
        </form>
      )}
    </section>
  );
}
