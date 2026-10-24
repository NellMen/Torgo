import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import api from '../api/client.js';
import { mapCatalogItem, mediaUrl } from '../utils/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

function initials(name) {
  return String(name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function since(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return `На Торго с ${date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
}

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = ['auctions', 'sold', 'reviews'].includes(params.get('section') || '') ? params.get('section') : 'active';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/users/${id}/public?section=${section}`).then(setData).catch((err) => setError(err.message));
  }, [id, section]);

  if (error) {
    return <section className="pf-page"><div className="wrap"><p className="form-banner form-banner--error">{error}</p></div></section>;
  }
  if (!data) {
    return <section className="pf-page"><div className="wrap"><p className="page-sub">Загрузка…</p></div></section>;
  }

  const user = data.user;
  const counts = data.counts || {};
  const cards = section === 'reviews' ? [] : (data.items || []).map((row) => ({
    ...mapCatalogItem({ ...row, price: row.current_price || row.price }),
    type: row.type,
  }));
  const rating = Number(user.rating_avg || 0);
  const tabs = [
    { id: 'active', label: 'Активные объявления' },
    { id: 'auctions', label: 'Аукционы' },
    { id: 'sold', label: 'Проданные' },
    { id: 'reviews', label: 'Отзывы' },
  ];
  const titles = {
    active: 'Активные объявления',
    auctions: 'Аукционы',
    sold: 'Проданные',
  };

  const write = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const listingId = Number(data.contact_listing_id || 0);
    if (!listingId) {
      navigate('/messages');
      return;
    }
    const created = await api.post('/conversations', { listing_id: listingId });
    navigate(`/messages?chat=${created.conversation_id || created.id}`);
  };

  return (
    <section className="pf-page">
      <div className="wrap">
        <nav className="ld-crumbs">
          <Link to="/">Главная</Link>
          <span> / </span>
          <button type="button" className="text-btn" onClick={() => setParams({})}>Продавцы</button>
          <span> / </span>
          <span className="ld-here">{user.name}</span>
        </nav>

        <div className="pub-card">
          <span className="pf-avatar">
            {user.avatar ? <img src={mediaUrl(user.avatar)} alt="" /> : initials(user.name)}
          </span>
          <div>
            <h1>{user.name}</h1>
            {user.role === 'admin' ? <p className="pf-role">Администратор</p> : null}
            <p className="pf-meta">
              <span className="pf-stars">{'★'.repeat(Math.round(rating) || 0)}</span>
              <b>{rating ? rating.toFixed(1) : '—'}</b>
              <span>{counts.reviews || 0} отзывов</span>
            </p>
            <p className="pf-meta"><span>{user.city}</span><span>{since(user.created_at)}</span></p>
          </div>
          <div className="pf-card-actions">
            <button type="button" className="btn btn-sm" onClick={write}>Написать продавцу</button>
          </div>
        </div>

        <div className="pf-tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? 'is-active' : ''}
              onClick={() => setParams(item.id === 'active' ? {} : { section: item.id })}
            >
              {item.label} {Number(counts[item.id] || 0)}
            </button>
          ))}
        </div>

        {section === 'reviews' ? (
          <div className="pf-reviews">
            <h2>Отзывы покупателей</h2>
            {(data.items || []).length ? (data.items || []).map((review) => (
              <article key={review.id}>
                <span className="pf-avatar pf-avatar--sm">{initials(review.reviewer_name)}</span>
                <div>
                  <strong>{review.reviewer_name}</strong>
                  <p>{review.comment}</p>
                  <small>{review.listing_title}</small>
                </div>
              </article>
            )) : <p className="pf-empty">Пока нет отзывов</p>}
          </div>
        ) : (
          <>
            <h2>{titles[section]}</h2>
            <Cards items={cards} locked={section === 'sold'} />
          </>
        )}
      </div>
    </section>
  );
}

function Cards({ items, locked = false }) {
  if (!items.length) return <p className="page-sub">Пока пусто</p>;
  return (
    <div className="cards cards--catalog">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} type={item.type === 'auction' ? 'auction' : 'listing'} showTimer={item.type === 'auction' && !locked} locked={locked} />
      ))}
    </div>
  );
}
