import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PhotoGallery from '../components/PhotoGallery.jsx';
import ProductCard from '../components/ProductCard.jsx';
import api from '../api/client.js';
import { formatPrice, mapCatalogItem, mediaUrl } from '../utils/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

const CONDITIONS = {
  new: 'Новое',
  used: 'Б/у',
};

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function findCategoryPath(nodes, id, trail = []) {
  for (const node of nodes || []) {
    const next = [...trail, node];
    if (Number(node.id) === Number(id)) return next;
    const hit = findCategoryPath(node.children, id, next);
    if (hit) return hit;
  }
  return null;
}

function publishedLabel(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Опубликовано сегодня в ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Опубликовано вчера в ${time}`;
  return `Опубликовано ${date.toLocaleDateString('ru-RU')} в ${time}`;
}

function Stars({ value }) {
  const score = Math.round(Number(value) || 0);
  return (
    <span className="ld-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < score ? 'is-on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [crumbs, setCrumbs] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [fav, setFav] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatError, setChatError] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setPhoneOpen(false);
    setChatError('');
    api
      .get(`/listings/${id}`)
      .then((data) => {
        const listing = data.listing || data;
        setItem(listing);
        setFav(Boolean(listing.is_favorite));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!item) return;
    api.get('/categories').then((data) => {
      const path = findCategoryPath(data.tree, item.category_id) || [];
      setCrumbs(path);
    }).catch(() => setCrumbs([]));

    const params = new URLSearchParams({ per_page: '8', categories: String(item.category_id) });
    api.get(`/listings?${params}`).then(async (data) => {
      let rows = (data.items || []).filter((row) => Number(row.id) !== Number(item.id));
      if (rows.length < 4) {
        const more = await api.get('/listings?per_page=8');
        const seen = new Set(rows.map((row) => Number(row.id)));
        seen.add(Number(item.id));
        for (const row of more.items || []) {
          if (!seen.has(Number(row.id))) rows.push(row);
        }
      }
      setSimilar(rows.slice(0, 4).map(mapCatalogItem));
    }).catch(() => setSimilar([]));
  }, [item]);

  const images = useMemo(() => {
    const list = (item?.images || []).map((img) => mediaUrl(img.path));
    if (list.length) return list;
    return [mediaUrl(item?.thumb)];
  }, [item]);

  const specs = useMemo(() => {
    if (!item) return [];
    const rows = (item.attributes || []).map((attr) => ({
      label: attr.name,
      value: attr.value,
    }));
    if (item.item_condition && !rows.some((row) => /состояни/i.test(row.label))) {
      rows.push({ label: 'Состояние', value: CONDITIONS[item.item_condition] || item.item_condition });
    }
    return rows;
  }, [item]);

  const startChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setChatError('');
    try {
      if (Number(user?.id) === Number(item?.seller_id)) {
        const list = await api.get('/conversations');
        const mine = (list.conversations || []).find((row) => Number(row.listing_id) === Number(id));
        navigate(mine ? `/messages?chat=${mine.id}` : '/messages');
        return;
      }
      const data = await api.post('/conversations', { listing_id: Number(id) });
      navigate(`/messages?chat=${data.conversation_id || data.id}`);
    } catch (err) {
      setChatError(err.message);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (fav) {
      await api.delete(`/favorites/${id}`);
      setFav(false);
    } else {
      await api.post(`/favorites/${id}`);
      setFav(true);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item?.title, url });
        return;
      }
    } catch {
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (error) {
    return (
      <section className="detail-page">
        <div className="wrap">
          <p className="form-banner form-banner--error">{error}</p>
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="detail-page">
        <div className="wrap">
          <p className="page-sub">Загрузка…</p>
        </div>
      </section>
    );
  }

  if (item.status === 'sold' || item.status === 'archived') {
    return (
      <section className="wrap sold-note">
        <h1>{item.title}</h1>
        <p>{formatPrice(item.price)}</p>
        <p>{item.city}</p>
        <strong>Это объявление уже продано.</strong>
      </section>
    );
  }

  const own = Number(user?.id) === Number(item.seller_id) && item.status === 'active';
  const closeListing = async (reason) => {
    await api.post(`/listings/${item.id}/close`, { reason });
    navigate('/profile');
  };

  const rating = Number(item.seller_rating || 0).toFixed(1);
  const reviews = Number(item.seller_reviews || 0);

  return (
    <section className="detail-page ld">
      <div className="wrap">
        <nav className="ld-crumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          {crumbs.map((node) => (
            <span key={node.id}>
              <span className="ld-sep"> / </span>
              <Link to={`/listings?categories=${node.id}`}>{node.name}</Link>
            </span>
          ))}
          <span className="ld-sep"> / </span>
          <span className="ld-here">{item.title}</span>
        </nav>

        <div className="ld-title-row">
          <h1>{item.title}</h1>
          <div className="ld-tools">
            <button type="button" className="ld-tool" onClick={share}>
              <ShareIcon />
              {copied ? 'Скопировано' : 'Поделиться'}
            </button>
            <button type="button" className={`ld-tool ld-heart ${fav ? 'is-on' : ''}`} onClick={toggleFavorite} aria-label="В избранное">
              <HeartIcon filled={fav} />
            </button>
          </div>
        </div>

        <div className="ld-grid">
          <PhotoGallery images={images} alt={item.title} />

          <aside className="ld-buy">
            <p className="ld-price">{formatPrice(item.price)}</p>
            <button type="button" className="btn btn-lg ld-phone" onClick={() => setPhoneOpen(true)}>
              <PhoneIcon />
              Показать телефон
            </button>
            {phoneOpen ? <p className="ld-phone-note">Продавец не указал телефон</p> : null}
            <button type="button" className="btn btn-lg btn-ghost ld-write" onClick={startChat}>
              <ChatIcon />
              Написать продавцу
            </button>
            {chatError ? <p className="ld-phone-note">{chatError}</p> : null}

            <div className="ld-seller">
              <span className="ld-avatar">{initials(item.seller_name)}</span>
              <span className="ld-seller-main">
                <strong><Link to={`/users/${item.seller_id}`}>{item.seller_name}</Link></strong>
                <span className="ld-rate">
                  <Stars value={item.seller_rating} />
                  <b>{rating}</b>
                  <span>{reviews} отзывов</span>
                </span>
              </span>
              <span className="ld-chevron" aria-hidden="true">›</span>
            </div>

            <p className="ld-check">
              <CheckIcon />
              Документы и юридическая чистота автомобиля проверены
            </p>
            <p className="ld-published">{publishedLabel(item.created_at)}</p>
            {own ? (
              <div className="owner-actions">
                {closing ? (
                  <>
                    <p>Вы продали его или решили не продавать?</p>
                    <button type="button" className="btn btn-lg" onClick={() => closeListing('sold')}>Продал</button>
                    <button type="button" className="btn btn-lg btn-ghost" onClick={() => closeListing('withdraw')}>Решил не продавать</button>
                    <button type="button" className="text-btn" onClick={() => setClosing(false)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-lg" onClick={() => navigate(`/create-listing?edit=${item.id}`)}>Редактировать</button>
                    <button type="button" className="btn btn-lg btn-ghost" onClick={() => setClosing(true)}>Удалить</button>
                  </>
                )}
              </div>
            ) : null}
          </aside>
        </div>

        {specs.length ? (
          <section className="ld-block">
            <h2>Характеристики</h2>
            <div className="ld-specs">
              {specs.map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.description ? (
          <section className="ld-block">
            <h2>Описание</h2>
            <div className="ld-desc">{item.description}</div>
          </section>
        ) : null}

        {similar.length ? (
          <section className="ld-similar">
            <div className="section-head">
              <h2>Похожие товары</h2>
              <Link className="section-link" to={`/listings?categories=${item.category_id}`}>
                Смотреть все →
              </Link>
            </div>
            <div className="cards">
              {similar.map((card) => (
                <ProductCard key={card.id} item={card} />
              ))}
            </div>
          </section>
        ) : null}

      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3.5h2.2l1.2 3.1-1.6 1.1a12.5 12.5 0 0 0 6.5 6.5l1.1-1.6 3.1 1.2V16a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 6 6.7 2 2 0 0 1 8 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 16.5 3.5 19V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 16H6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8 11 7-3.2M8 13l7 3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8 12.2 2.4 2.4L16.2 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
