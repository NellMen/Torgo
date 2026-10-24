export const PAGE_SIZE = 10;

export function slicePage(items, page) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * PAGE_SIZE;
  return {
    page: current,
    pages,
    rows: items.slice(start, start + PAGE_SIZE),
    total: items.length,
  };
}

export function Pager({ page, pages, total, onPage }) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const numbers = [];
  const span = 5;
  let first = Math.max(1, page - 2);
  let last = Math.min(pages, first + span - 1);
  first = Math.max(1, last - span + 1);
  for (let n = first; n <= last; n += 1) numbers.push(n);

  return (
    <div className="op-pager">
      <span>
        {from}–{to} из {total}
      </span>
      <div className="op-pages">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Назад
        </button>
        {numbers.map((n) => (
          <button key={n} type="button" className={n === page ? 'is-on' : ''} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Далее
        </button>
      </div>
    </div>
  );
}
