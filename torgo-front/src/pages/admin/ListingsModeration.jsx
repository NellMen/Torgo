import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { Pager, slicePage } from '../../components/AdminPager.jsx';

const STATUS = {
  pending: 'На проверке',
  active: 'Опубликовано',
  rejected: 'Отклонено',
  sold: 'Продано',
  archived: 'Архив',
};

function money(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

function when(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return `Сегодня, ${time}`;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`;
}

export default function AdminListingsModeration() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/listings?status=all').then((data) => setItems(data.listings || []));
  }, []);

  const categories = useMemo(() => {
    const names = new Set(items.map((item) => item.category_name).filter(Boolean));
    return [...names];
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (category !== 'all' && item.category_name !== category) return false;
      if (!query) return true;
      return `${item.title} ${item.id}`.toLowerCase().includes(query);
    });
  }, [items, q, status, category]);

  const view = slicePage(filtered, page);
  const active = items.filter((item) => item.status === 'active').length;
  const pending = items.filter((item) => item.status === 'pending').length;

  return (
    <>
      <h1>Объявления</h1>
      <p className="op-lead">
        {active.toLocaleString('ru-RU')} активных · {pending.toLocaleString('ru-RU')} ждут решения
      </p>
      <div className="op-tools">
        <label className="op-search">
          <input
            value={q}
            placeholder="Поиск по названию или №"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="op-filters">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все статусы</option>
            {Object.entries(STATUS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все категории</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="op-table">
        <div className="op-head op-listings">
          <span>Объявление</span>
          <span>Статус</span>
          <span>Жалобы</span>
          <span>Дата</span>
          <span>Действие</span>
        </div>
        {view.rows.map((item) => (
          <article key={item.id} className="op-row">
            <div className="op-line op-listings">
              <div>
                <strong>{item.title}</strong>
                <small>
                  № {item.id}
                  {item.category_name ? ` · ${item.category_name}` : ''} · {money(item.price)}
                </small>
              </div>
              <b>{STATUS[item.status] || item.status}</b>
              <span className="op-desk">Нет жалоб</span>
              <span className="op-desk">{when(item.created_at)}</span>
              <span className="op-desk">
                <button type="button" className="op-btn" onClick={() => navigate(`/admin/listings/${item.id}`)}>
                  Модерировать
                </button>
              </span>
            </div>
            <p className="op-phone">
              Жалобы: Нет жалоб
              <br />
              Дата: {when(item.created_at)}
            </p>
            <div className="op-row-actions">
              <button type="button" className="op-btn" onClick={() => navigate(`/admin/listings/${item.id}`)}>
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
