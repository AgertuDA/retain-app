import { formatMoney } from '../lib/format';
import type { CategoryTotal } from '../types';
import { EmptyState } from './Feedback';

interface Props {
  data: CategoryTotal[];
  emptyTitle?: string;
  /** Rank by number of expenses instead of money. */
  by?: 'total' | 'count';
}

export default function CategoryBars({ data, emptyTitle = 'No spending yet', by = 'total' }: Props) {
  if (data.length === 0) return <EmptyState title={emptyTitle} />;
  const max = Math.max(...data.map((d) => d[by]), 1);
  return (
    <ul className="bars">
      {data.map((d) => (
        <li key={d.categoryId}>
          <div className="bars-line">
            <span>{d.name}</span>
            <span>{by === 'count' ? `${d.count} ${d.count === 1 ? 'expense' : 'expenses'}` : formatMoney(d.total)}</span>
          </div>
          <div className="bars-track">
            <div className="bars-fill" style={{ width: `${(d[by] / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
