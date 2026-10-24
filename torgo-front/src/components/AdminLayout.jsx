import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/admin', end: true, label: 'Дашборд' },
  { to: '/admin/users', label: 'Пользователи' },
  { to: '/admin/listings', label: 'Объявления' },
  { to: '/admin/auctions', label: 'Аукционы' },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/attributes', label: 'Характеристики' },
];

const CRUMBS = {
  '/admin': 'Дашборд',
  '/admin/users': 'Пользователи',
  '/admin/listings': 'Объявления',
  '/admin/auctions': 'Аукционы',
  '/admin/categories': 'Категории',
  '/admin/attributes': 'Характеристики',
};

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || 'A').slice(0, 2).toUpperCase();
}

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const crumb = pathname.startsWith('/admin/listings/')
    ? 'Объявления / Модерация'
    : pathname.startsWith('/admin/auctions/')
      ? 'Аукционы / Модерация'
      : CRUMBS[pathname] || 'Дашборд';

  return (
    <div className="op">
      <aside className="op-side">
        <div className="op-brand">
          <span className="op-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="19" height="19">
              <g fill="#fff" transform="rotate(-38 15 16)">
                <rect x="4.2" y="8.4" width="7.2" height="13.2" rx="1.5" />
                <rect x="10.2" y="13.2" width="15.2" height="3.5" rx="1.1" />
              </g>
            </svg>
          </span>
          <strong>Торго</strong>
        </div>
        <p className="op-kicker">ОПЕРАТОРСКАЯ</p>
        <nav className="op-nav" aria-label="Разделы админ-панели">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {pathname !== '/admin' ? <p className="op-status">Все системы работают</p> : <span className="op-spacer" />}
        <Link className="op-exit" to="/">
          Выйти ↗
        </Link>
      </aside>
      <div className="op-main">
        <header className="op-top">
          <p>
            Админ-панель <span>/</span> {crumb}
          </p>
          <div className="op-user">
            <div className="op-user-meta">
              <strong>{user?.name || 'Администратор'}</strong>
              <span>Администратор</span>
            </div>
            <b>{initials(user?.name)}</b>
          </div>
        </header>
        <div className="op-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
