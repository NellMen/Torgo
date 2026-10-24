import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BidModal from '../components/BidModal.jsx';
import PhotoGallery from '../components/PhotoGallery.jsx';
import api from '../api/client.js';
import { formatPrice, mediaUrl, parseEndsAt } from '../utils/catalog.js';
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

function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function ago(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 10) return 'только что';
  if (sec < 60) return `${sec} ${plural(sec, 'секунду', 'секунды', 'секунд')} назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} ${plural(min, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
}

function startedLabel(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `стартовал сегодня в ${time}`;
  return `стартовал ${date.toLocaleDateString('ru-RU')} в ${time}`;
}

function Countdown({ endsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const total = Math.max(0, Math.floor(((endsAt || 0) - now) / 1000));
  const parts = [
    ['Дни', Math.floor(total / 86400)],
    ['Часы', Math.floor((total % 86400) / 3600)],
    ['Мин', Math.floor((total % 3600) / 60)],
    ['Сек', total % 60],
  ];
  return (
    <div className="ad-timer">
      <p>До завершения</p>
      <div>
        {parts.map(([label, value]) => (
          <span key={label}>
            <b>{String(value).padStart(2, '0')}</b>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [auction, setAuction] = useState(null);
  const [crumbs, setCrumbs] = useState([]);
  const [bidOpen, setBidOpen] = useState(false);
  const [fav, setFav] = useState(false);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [closing, setClosing] = useState(false);

  const load = () => {
    api
      .get(`/auctions/${id}`)
      .then((data) => {
        setAuction(data.auction);
        setFav(Boolean(data.auction?.is_favorite));
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setBidOpen(false);
    load();
  }, [id]);

  useEffect(() => {
    if (!auction) return;
    api
      .get('/categories')
      .then((data) => setCrumbs(findCategoryPath(data.tree, auction.category_id) || []))
      .catch(() => setCrumbs([]));
  }, [auction]);

  const images = useMemo(() => {
    const list = (auction?.images || []).map((img) => mediaUrl(img.path));
    return list.length ? list : [mediaUrl(auction?.thumb)];
  }, [auction]);

  const specs = useMemo(() => {
    if (!auction) return [];
    const rows = (auction.attributes || []).map((attr) => ({ label: attr.name, value: attr.value }));
    if (auction.item_condition && !rows.some((row) => /состояни/i.test(row.label))) {
      rows.push({ label: 'Состояние', value: CONDITIONS[auction.item_condition] || auction.item_condition });
    }
    return rows;
  }, [auction]);

  if (error) {
    return (
      <section className="detail-page">
        <div className="wrap">
          <p className="form-banner form-banner--error">{error}</p>
        </div>
      </section>
    );
  }

  if (!auction) {
    return (
      <section className="detail-page">
        <div className="wrap">
          <p className="page-sub">Загрузка…</p>
        </div>
      </section>
    );
  }

  if (auction.status === 'sold' || auction.status === 'archived') {
    return (
      <section className="wrap sold-note">
        <h1>{auction.title}</h1>
        <p>{formatPrice(auction.price)}</p>
        <p>{auction.city}</p>
        <strong>Это объявление уже продано.</strong>
      </section>
    );
  }

  const own = Number(user?.id) === Number(auction.seller_id) && auction.status === 'active';
  const closeLot = async (reason) => {
    await api.post(`/listings/${auction.id}/close`, { reason });
    navigate('/profile');
  };

  const current = Number(auction.auction?.current_price || auction.price || 0);
  const step = Number(auction.auction?.min_step || 0);
  const minBid = current + step;
  const endsAt = parseEndsAt(auction.auction?.ends_at);
  const ended = auction.auction?.finalized_at || (endsAt && endsAt <= Date.now());
  const bids = (auction.bids || []).slice(0, 10);
  const bidCount = Number(auction.bids_count || bids.length);
  const meta = [
    crumbs.map((node) => node.name).join(' / '),
    auction.city,
    startedLabel(auction.created_at),
    CONDITIONS[auction.item_condition] ? `${CONDITIONS[auction.item_condition].toLowerCase()} состояние` : '',
    auction.seller_name ? `продавец «${auction.seller_name}»` : '',
  ]
    .filter(Boolean)
    .join(' — ');

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

  const startChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setChatError('');
    try {
      if (Number(user?.id) === Number(auction?.seller_id)) {
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

  const openBid = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBidOpen(true);
  };

  const onBid = async (amount) => {
    await api.post(`/auctions/${id}/bid`, { amount });
    setBidOpen(false);
    load();
  };

  return (
    <section className="detail-page ad">
      <div className="wrap">
        <nav className="ld-crumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          {crumbs.map((node) => (
            <span key={node.id}>
              <span className="ld-sep"> / </span>
              <Link to={`/auctions?categories=${node.id}`}>{node.name}</Link>
            </span>
          ))}
          <span className="ld-sep"> / </span>
          <span className="ld-here">{auction.title}</span>
        </nav>

        <div className="ad-grid">
          <div>
            <PhotoGallery images={images} alt={auction.title} />
            <div className="ad-about">
              <h1>{auction.title}</h1>
              <p>{meta}</p>
              {auction.description ? <p className="ad-desc">{auction.description}</p> : null}
            </div>
          </div>

          <aside className="ad-panel">
            <p className="ad-count">
              {bidCount} {plural(bidCount, 'ставка', 'ставки', 'ставок')}
            </p>
            <p className="ad-kicker">Текущая ставка</p>
            <p className="ad-price">{formatPrice(current)}</p>
            <p className="ad-step">Минимальный шаг: {formatPrice(step)}</p>
            <Countdown endsAt={endsAt} />
            <button type="button" className={`btn btn-lg btn-ghost ad-fav ${fav ? 'is-on' : ''}`} onClick={toggleFavorite}>
              {fav ? 'В избранном' : 'В избранное'}
            </button>
            <button type="button" className="btn btn-lg ad-bid" onClick={openBid} disabled={Boolean(ended)}>
              Сделать ставку — {formatPrice(minBid)}
            </button>
            <button type="button" className="btn btn-lg btn-ghost ld-write" onClick={startChat}>
              Написать продавцу
            </button>
            {chatError ? <p className="ld-phone-note">{chatError}</p> : null}
            <div className="ld-seller">
              <span className="ld-avatar">{initials(auction.seller_name)}</span>
              <span className="ld-seller-main">
                <strong><Link to={`/users/${auction.seller_id}`}>{auction.seller_name}</Link></strong>
                <span className="ld-rate">
                  <b>{Number(auction.seller_rating || 0).toFixed(1)}</b>
                  <span>{Number(auction.seller_reviews || 0)} отзывов</span>
                </span>
              </span>
              <span className="ld-chevron" aria-hidden="true">
                ›
              </span>
            </div>
            {own ? (
              <div className="owner-actions">
                {closing ? (
                  <>
                    <p>Вы продали его или решили не продавать?</p>
                    <button type="button" className="btn btn-lg" onClick={() => closeLot('sold')}>Продал</button>
                    <button type="button" className="btn btn-lg btn-ghost" onClick={() => closeLot('withdraw')}>Решил не продавать</button>
                    <button type="button" className="text-btn" onClick={() => setClosing(false)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-lg" onClick={() => navigate(`/create-listing?edit=${auction.id}`)}>Редактировать</button>
                    <button type="button" className="btn btn-lg btn-ghost" onClick={() => setClosing(true)}>Удалить</button>
                  </>
                )}
              </div>
            ) : null}
            <h2>Последние ставки</h2>
            {bids.length ? (
              <ul className="ad-bids">
                {bids.map((bid) => (
                  <li key={bid.id}>
                    <span className="ld-avatar">{initials(bid.user_name)}</span>
                    <span>
                      <strong>{bid.user_name}</strong>
                      <small>{ago(bid.created_at)}</small>
                    </span>
                    <b>{formatPrice(bid.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-empty">Ставок пока нет</p>
            )}
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

      </div>

      <BidModal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        lotId={auction.id}
        title={auction.title}
        minAmount={minBid}
        step={step}
        onSubmit={onBid}
      />
    </section>
  );
}
