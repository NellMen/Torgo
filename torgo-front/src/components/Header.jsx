import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function LogoMark() {
  return (
    <img src="../../public/assets/logotor.png" alt="Logo" style={{ width: '38px', height: '38px' }} />
  );
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const profileNav = pathname.startsWith('/profile') || pathname.startsWith('/users/') || pathname.startsWith('/messages');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favPressed, setFavPressed] = useState(false);
  const [query, setQuery] = useState('');

  const headerClass = ['header', searchOpen && 'search-open', menuOpen && 'menu-open']
    .filter(Boolean)
    .join(' ');

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/listings?q=${encodeURIComponent(q)}` : '/listings');
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const navClose = () => setMenuOpen(false);

  return (
    <header className={headerClass} id="header">
      <div className="wrap header-bar">
        <Link className="logo" to="/">
          <LogoMark />
          Торго
        </Link>

        <form className="search" onSubmit={onSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M15.8 15.8L20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти товар, бренд или лот"
            aria-label="Найти товар, бренд или лот"
          />
        </form>

        <div className="header-actions">
          <button className="loc only-desktop" type="button">
            Москва
          </button>
          {!isAuthenticated ? (
            <>
              <Link className="text-btn only-desktop" to="/login">
                Войти
              </Link>
              <Link className="btn btn-sm only-desktop" to="/register">
                Регистрация
              </Link>
            </>
          ) : (
            <>
              <Link className="text-btn only-desktop" to="/profile">
                {user?.name || 'Профиль'}
              </Link>
              <button className="text-btn only-desktop" type="button" onClick={() => logout()}>
                Выйти
              </button>
            </>
          )}
          <Link className="btn btn-sm only-tablet" to="/create-listing">
            Подать объявление
          </Link>
        </div>

        <div className="mobile-tools">
          <button
            className="icon-btn"
            type="button"
            aria-label="Найти товар, бренд или лот"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M15.8 15.8L20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Link
            className="icon-btn"
            to="/favorites"
            aria-label="Избранное"
            onClick={() => setFavPressed((v) => !v)}
            aria-pressed={favPressed}
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M12 19.4l-1.1-1C6.2 14.2 3.6 11.8 3.6 8.8 3.6 6.5 5.4 4.8 7.6 4.8c1.3 0 2.5.6 3.3 1.6.8-1 2-1.6 3.3-1.6 2.2 0 4 1.7 4 4 0 3-2.6 5.4-7.3 9.6L12 19.4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <button
            className="icon-btn"
            type="button"
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="wrap mobile-search" id="mobile-search">
        <form className="search" onSubmit={onSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M15.8 15.8L20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти товар, бренд или лот"
            aria-label="Найти товар, бренд или лот"
          />
        </form>
      </div>

      <nav className="wrap nav" id="nav" aria-label="Основное меню">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={navClose}>
          Главная
        </NavLink>
        <NavLink to="/listings" className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={navClose}>
          Объявления
        </NavLink>
        <NavLink to="/auctions" className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={navClose}>
          Аукционы
        </NavLink>
        {profileNav ? (
          <NavLink to="/messages" className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={navClose}>
            Сообщения
          </NavLink>
        ) : (
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'is-active' : undefined)} onClick={navClose}>
            О нас
          </NavLink>
        )}
        <NavLink to="/messages" onClick={navClose} className="nav-mobile-only">
          Сообщения
        </NavLink>
        <NavLink to="/create-listing" onClick={navClose} className="nav-mobile-only">
          Подать объявление
        </NavLink>
      </nav>
    </header>
  );
}
