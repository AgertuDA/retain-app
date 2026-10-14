import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FilterFields } from '../types';

export const initialFilters: FilterFields = {
  search: '',
  category: '',
  paymentMethod: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  order: 'desc',
  page: 1,
  limit: 10,
};

/** Holds all expense searching, filtering, sorting and pagination state. */
const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFilters,
  reducers: {
    // Changing any filter returns the list to page 1.
    setFilters(state, action: PayloadAction<Partial<Omit<FilterFields, 'page' | 'limit'>>>) {
      Object.assign(state, action.payload);
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    resetFilters() {
      return initialFilters;
    },
  },
});

export const { setFilters, setPage, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;

export const countActiveFilters = (f: FilterFields): number =>
  [f.search, f.category, f.paymentMethod, f.dateFrom, f.dateTo, f.minAmount, f.maxAmount].filter(Boolean).length;
