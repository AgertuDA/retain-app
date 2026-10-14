import { PAYMENT_LABELS, formatDate, formatMoney } from '../lib/format';
import type { Expense } from '../types';

export default function ExpenseList({ items, onSelect }: { items: Expense[]; onSelect?: (expense: Expense) => void }) {
  return (
    <ul className="exp-list">
      {items.map((e) => (
        <li key={e._id}>
          <button className="exp-row" onClick={() => onSelect?.(e)} disabled={!onSelect}>
            <span className="exp-main">
              <span className="exp-title">{e.title}</span>
              <span className="exp-meta">
                {e.category.name}, {formatDate(e.date)}, {PAYMENT_LABELS[e.paymentMethod]}
              </span>
            </span>
            <span className="exp-amount">{formatMoney(e.amount)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
