import { useEffect, useState } from 'react';
import api from '../../api/client.js';

function num(value) {
  return Number(value || 0).toLocaleString('ru-RU');
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((data) => setStats(data.stats));
  }, []);

  if (!stats) return <p className="op-empty">Загрузка…</p>;

  const queue = Number(stats.listings_pending) + Number(stats.auctions_pending);

  return (
    <>
      <h1>Дашборд</h1>
      <div className="op-metrics">
        <article>
          <span>Пользователи</span>
          <strong>{num(stats.users)}</strong>
        </article>
        <article>
          <span>Активные объявления</span>
          <strong>{num(stats.listings_active)}</strong>
        </article>
      </div>
      <section className="op-queue">
        <div className="op-queue-head">
          <h2>Срочные задачи модерации</h2>
          <em>{queue} в очереди</em>
        </div>
        <div className="op-tasks">
          <article>
            <span>Объявления на проверке</span>
            <strong>{num(stats.listings_pending)}</strong>
            <small>Ждут решения модератора</small>
          </article>
          <article>
            <span>Аукционы на проверке</span>
            <strong>{num(stats.auctions_pending)}</strong>
            <small>Ждут решения модератора</small>
          </article>
        </div>
      </section>
    </>
  );
}
