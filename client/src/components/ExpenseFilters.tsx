import { useEffect, useState } from 'react';
import { PAYMENT_LABELS, PAYMENT_METHODS } from '../lib/format';
import { countActiveFilters, resetFilters, setFilters } from '../store/filtersSlice';
import { useAppDispatch, useAppSelector } from '../store';
import type { Category, PaymentMethod, SortField, SortOrder } from '../types';

const SORTS: Array<{ label: string; sortBy: SortField; order: SortOrder }> = [
  { label: 'Newest first', sortBy: 'date', order: 'desc' },
  { label: 'Oldest first', sortBy: 'date', order: 'asc' },
  { label: 'Highest amount', sortBy: 'amount', order: 'desc' },
  { label: 'Lowest amount', sortBy: 'amount', order: 'asc' },
];

/** Reads and writes every filter through Redux. */
export default function ExpenseFilters({ categories }: { categories: Category[] }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.filters);
  const [searchText, setSearchText] = useState(filters.search);
  const active = countActiveFilters(filters);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    if (searchText === filters.search) return;
    const id = setTimeout(() => dispatch(setFilters({ search: searchText })), 300);
    return () => clearTimeout(id);
  }, [searchText, filters.search, dispatch]);

  // Keep the box in sync when filters are reset elsewhere.
  useEffect(() => setSearchText(filters.search), [filters.search]);

  const sortValue = SORTS.findIndex((s) => s.sortBy === filters.sortBy && s.order === filters.order);

  return (
    <section className="filters" aria-label="Search and filter expenses">
      <label className="filter-search">
        <span className="sr-only">Search expenses</span>
        <input type="search" placeholder="Search title or notes" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </label>
      <div className="filter-grid">
        <label>
          Category
          <select value={filters.category} onChange={(e) => dispatch(setFilters({ category: e.target.value }))}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Payment method
          <select value={filters.paymentMethod} onChange={(e) => dispatch(setFilters({ paymentMethod: e.target.value as '' | PaymentMethod }))}>
            <option value="">Any method</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(e) => dispatch(setFilters({ dateFrom: e.target.value }))} />
        </label>
        <label>
          To
          <input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(e) => dispatch(setFilters({ dateTo: e.target.value }))} />
        </label>
        <label>
          Min amount
          <input type="number" min="0" inputMode="decimal" value={filters.minAmount} onChange={(e) => dispatch(setFilters({ minAmount: e.target.value }))} />
        </label>
        <label>
          Max amount
          <input type="number" min="0" inputMode="decimal" value={filters.maxAmount} onChange={(e) => dispatch(setFilters({ maxAmount: e.target.value }))} />
        </label>
        <label>
          Sort by
          <select
            value={sortValue}
            onChange={(e) => {
              const { sortBy, order } = SORTS[Number(e.target.value)];
              dispatch(setFilters({ sortBy, order }));
            }}
          >
            {SORTS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-reset">
          <button className="btn" onClick={() => dispatch(resetFilters())} disabled={active === 0 && sortValue === 0}>
            Clear filters{active > 0 ? ` (${active})` : ''}
          </button>
        </div>
      </div>
    </section>
  );
}
