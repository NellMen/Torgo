import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { Pager, slicePage } from '../../components/AdminPager.jsx';

function money(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

function stage(item) {
  if (item.status === 'pending') return 'waiting';
  if (item.status === 'rejected') return 'rejected';
  const ends = new Date(String(item.ends_at || '').replace(' ', 'T'));
  if (item.status === 'active' && ends.getTime() > Date.now() && !item.finalized_at) return 'live';
  return 'done';
}

const STAGE = {
  live: 'Торги',
  waiting: 'Ожидает',
  done: 'Завершён',
  rejected: 'Отклонён',
};

function moment(item) {
  if (stage(item) === 'waiting') return 'Ожидает старта';
  if (stage(item) !== 'live') return 'Завершён';
  const ends = new Date(String(item.ends_at).replace(' ', 'T'));
  const diff = Math.max(0, ends.getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `Осталось ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function AdminAuctionsModeration() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('ending');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/auctions?status=all').then((data) => setItems(data.auctions || []));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = items.filter((item) => {
      if (filter !== 'all' && stage(item) !== filter) return false;
      if (!query) return true;
      return `${item.title} ${item.id}`.toLowerCase().includes(query);
    });
    list.sort((a, b) => {
      const left = new Date(String(a.ends_at || a.created_at).replace(' ', 'T')).getTime();
      const right = new Date(String(b.ends_at || b.created_at).replace(' ', 'T')).getTime();
      return sort === 'new' ? right - left : left - right;
    });
    return list;
  }, [items, q, filter, sort]);

  const view = slicePage(filtered, page);
  const live = items.filter((item) => stage(item) === 'live').length;

  return (
    <>
      <h1>Аукционы</h1>
      <p className="op-lead">{live.toLocaleString('ru-RU')} активных торгов</p>
      <div className="op-tools">
        <label className="op-search">
          <input
            value={q}
            placeholder="Поиск по названию или лоту"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="op-filters">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все этапы</option>
            <option value="live">Торги</option>
            <option value="waiting">Ожидает</option>
            <option value="done">Завершён</option>
            <option value="rejected">Отклонён</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="ending">Сначала завершающиеся</option>
            <option value="new">Сначала новые</option>
          </select>
        </div>
      </div>
      <div className="op-table">
        <div className="op-head op-auctions">
          <span>Лот</span>
          <span>Статус</span>
          <span>Жалобы</span>
          <span>Завершение / старт</span>
          <span>Действие</span>
        </div>
        {view.rows.map((item) => (
          <article key={item.id} className="op-row">
            <div className="op-line op-auctions">
              <div>
                <strong>{item.title}</strong>
                <small>
                  Лот {item.id} · {Number(item.bid_count) || 0} ставок · {money(item.current_price || item.start_price)}
                </small>
              </div>
              <b>{STAGE[stage(item)]}</b>
              <span className="op-desk">Нет жалоб</span>
              <span className="op-desk">{moment(item)}</span>
              <span className="op-desk">
                <button type="button" className="op-btn" onClick={() => navigate(`/admin/auctions/${item.id}`)}>
                  Модерировать
                </button>
              </span>
            </div>
            <p className="op-phone">
              Жалобы: Нет жалоб
              <br />
              Завершение / старт: {moment(item)}
            </p>
            <div className="op-row-actions">
              <button type="button" className="op-btn" onClick={() => navigate(`/admin/auctions/${item.id}`)}>
                Модерировать
              </button>
            </div>
          </article>
        ))}
        {view.total === 0 ? <p className="op-empty">Ничего не найдено</p> : null}
        <Pager page={view.page} pages={view.pages} total={view.total} onPage={setPage} />
      </div>
    </>
  );
}
