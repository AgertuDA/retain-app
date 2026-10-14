interface Props {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, pages, total, onPage }: Props) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        Page {page} of {pages}, {total} {total === 1 ? 'expense' : 'expenses'}
      </span>
      <div>
        <button className="btn btn-small" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <button className="btn btn-small" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next
        </button>
      </div>
    </nav>
  );
}
