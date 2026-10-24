export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ←
      </button>
      {start > 1 && (
        <>
          <button type="button" className="pagination-btn" onClick={() => onPageChange(1)}>
            1
          </button>
          {start > 2 && <span className="pagination-ellipsis">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={['pagination-btn', p === page && 'is-active'].filter(Boolean).join(' ')}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
          <button type="button" className="pagination-btn" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        →
      </button>
    </nav>
  );
}
