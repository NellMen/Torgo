import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import AdminDialog, { initials } from '../../components/AdminDialog.jsx';
import { Pager, slicePage } from '../../components/AdminPager.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function when(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Сегодня, ${time}`;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`;
}

export default function AdminUsers() {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/admin/users').then((data) => setUsers(data.users || []));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter((user) => {
      if (status === 'blocked' && !Number(user.is_blocked)) return false;
      if (status === 'ok' && Number(user.is_blocked)) return false;
      if (!query) return true;
      return `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query);
    });
  }, [users, q, status]);

  const view = slicePage(filtered, page);
  const fresh = users.filter((user) => when(user.created_at).startsWith('Сегодня')).length;

  return (
    <>
      <h1>Пользователи</h1>
      <p className="op-lead">
        {fresh.toLocaleString('ru-RU')} новых за сегодня · {users.length.toLocaleString('ru-RU')} пользователь
      </p>
      <div className="op-tools">
        <label className="op-search">
          <input
            value={q}
            placeholder="Поиск по имени или ID"
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
            <option value="ok">Нормальный</option>
            <option value="blocked">Ограничен</option>
          </select>
        </div>
      </div>
      <div className="op-table">
        <div className="op-head op-users">
          <span>Пользователь</span>
          <span>Статус</span>
          <span>Жалобы</span>
          <span>Дата</span>
          <span>Действие</span>
        </div>
        {view.rows.map((user) => (
          <article key={user.id} className="op-row">
            <div className="op-line op-users">
              <div>
                <strong>{user.name}</strong>
                <small>
                  ID {user.id}
                  {user.city ? ` · ${user.city}` : ''}
                  {user.role === 'admin' ? ' · администратор' : ''}
                </small>
              </div>
              <b>{Number(user.is_blocked) ? 'Ограничен' : 'Нормальный'}</b>
              <span className="op-desk">Нет жалоб</span>
              <span className="op-desk">{when(user.created_at)}</span>
              <span className="op-desk">
                {Number(user.is_blocked) || user.role === 'admin' ? null : (
                  <button
                    type="button"
                    className="op-btn"
                    onClick={() => {
                      setTarget(user);
                      setReason('');
                      setError('');
                    }}
                  >
                    Блокировать
                  </button>
                )}
              </span>
            </div>
            <p className="op-phone">
              Жалобы: Нет жалоб
              <br />
              Дата: {when(user.created_at)}
            </p>
            {Number(user.is_blocked) || user.role === 'admin' ? null : (
              <div className="op-row-actions">
                <button
                  type="button"
                  className="op-btn"
                  onClick={() => {
                    setTarget(user);
                    setReason('');
                    setError('');
                  }}
                >
                  Блокировать
                </button>
              </div>
            )}
          </article>
        ))}
        {view.total === 0 ? <p className="op-empty">Ничего не найдено</p> : null}
        <Pager page={view.page} pages={view.pages} total={view.total} onPage={setPage} />
      </div>

      <AdminDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        tone="block"
        wide
        title="Блокировать пользователя"
        extra={<p className="adm-sign">Действие от имени {admin?.name || 'администратора'} · Администратор Torgo</p>}
        footer={
          <>
            <button
              type="button"
              className={`adm-danger${reason.trim() ? ' is-on' : ''}`}
              disabled={!reason.trim() || busy}
              onClick={async () => {
                if (!reason.trim()) return;
                setBusy(true);
                setError('');
                try {
                  await api.post(`/admin/users/${target.id}/block`, { blocked: true, reason: reason.trim() });
                  await load();
                  setTarget(null);
                } catch (err) {
                  setError(err.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Заблокировать
            </button>
            <button type="button" className="adm-cancel" onClick={() => setTarget(null)}>
              Отмена
            </button>
          </>
        }
      >
        {target ? (
          <div className="adm-person">
            <b>{initials(target.name)}</b>
            <div>
              <strong>{target.name}</strong>
              <small>{target.email}</small>
            </div>
          </div>
        ) : null}
        <label className={`adm-reason${reason.trim() ? ' is-filled' : ''}`}>
          <span>Причина блокировки</span>
          <textarea value={reason} placeholder="Напишите комментарий…" onChange={(e) => setReason(e.target.value)} />
          <em>Укажите конкретное нарушение. Пользователь увидит эту причину в уведомлении.</em>
        </label>
        <p className="adm-note">
          Пользователь потеряет возможность публиковать объявления и участвовать в торгах. Решение попадёт в журнал модерации.
        </p>
        {error ? <p className="adm-error">{error}</p> : null}
      </AdminDialog>
    </>
  );
}
