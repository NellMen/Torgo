import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mapCatalogItem, mediaUrl } from '../utils/catalog.js';

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function since(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const month = date.toLocaleDateString('ru-RU', { month: 'long' });
  return `На Торго с ${month} ${date.getFullYear()}`;
}

function Stars({ value }) {
  const score = Math.round(Number(value) || 0);
  return (
    <span className="pf-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < score ? 'is-on' : ''}>★</span>
      ))}
    </span>
  );
}

function Avatar({ name, avatar, className = 'pf-avatar' }) {
  if (avatar) {
    return (
      <span className={className}>
        <img src={mediaUrl(avatar)} alt="" />
      </span>
    );
  }
  return <span className={className}>{initials(name)}</span>;
}

export default function Profile() {
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const isAdmin = user?.role === 'admin';
  const tabs = [
    { id: 'active', label: 'Активные объявления' },
    { id: 'auctions', label: 'Аукционы' },
    { id: 'review', label: 'На проверке' },
    { id: 'sold', label: 'Проданные' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'favorites', label: 'Избранное' },
  ];
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('active');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    setItems([]);
    if (tab === 'favorites') {
      api.get('/favorites').then((data) => setItems(data.items || []));
      return;
    }
    api.get(`/users/me/profile/${tab}`).then((data) => {
      setItems(data.items || []);
      setCounts(data.counts || {});
    });
  }, [isAuthenticated, tab]);

  if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;

  const rating = Number(user?.rating_avg || 0);
  const countFor = (id) => Number(counts[id] || 0);
  const cards = tab === 'reviews' ? [] : items.map((row) => ({
    ...mapCatalogItem({ ...row, price: row.current_price || row.price }),
    type: row.type,
  }));
  const titles = {
    active: 'Активные объявления',
    auctions: 'Аукционы',
    review: 'На проверке',
    sold: 'Проданные',
    favorites: 'Избранное',
  };

  return (
    <section className="pf-page">
      <div className="wrap">
        <div className="pf-head">
          <div>
            <p className="pf-kicker">Личный кабинет</p>
            <h1>{isAdmin ? 'Мой профиль' : 'Профиль'}</h1>
          </div>
          {!isAdmin ? (
            <Link className="btn btn-sm" to="/create-listing">+ Разместить объявление</Link>
          ) : null}
        </div>

        <div className="pf-card">
          <Avatar name={user?.name} avatar={user?.avatar} />
          <div>
            <strong>{user?.name}</strong>
            {isAdmin ? <p className="pf-role">Администратор</p> : null}
            <p>{user?.email}</p>
            <p className="pf-meta">
              {rating > 0 ? <Stars value={rating} /> : <span>★ — нет оценок</span>}
              <span>{rating > 0 ? rating.toFixed(1) : ''}</span>
              <span>{user?.phone}</span>
              <span>{user?.city}</span>
              <span>{since(user?.created_at)}</span>
            </p>
          </div>
          <div className="pf-card-actions">
            <button type="button" className={isAdmin ? 'btn btn-sm btn-ghost' : 'btn btn-sm'} onClick={() => setEditOpen(true)}>Редактировать</button>
            {isAdmin ? <Link to="/admin">В админ-панель →</Link> : null}
          </div>
        </div>

        <div className="pf-stats">
          <div><b>{countFor('sold') || countFor('deals')}</b><span>Продажи</span></div>
          <div><b>{countFor('purchases')}</b><span>Покупки</span></div>
        </div>

        <div className="pf-tabs">
          {tabs.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>
              {item.label} {countFor(item.id)}
            </button>
          ))}
        </div>

        {tab === 'reviews' ? (
          <Reviews items={items} name={user?.name} isAdmin={isAdmin} />
        ) : (
          <>
            <h2>{titles[tab]}</h2>
            {cards.length ? (
              <div className="cards cards--catalog">
                {cards.map((item, index) => {
                  const source = items[index] || {};
                  const rejected = source.status === 'rejected';
                  return (
                    <div key={item.id}>
                      <ProductCard
                        item={item}
                        type={item.type === 'auction' ? 'auction' : 'listing'}
                        showTimer={item.type === 'auction' && tab !== 'sold'}
                        locked={tab === 'sold'}
                        badge={tab === 'review' ? (rejected ? 'Отклонено' : 'На рассмотрении') : ''}
                      />
                      {tab === 'review' && rejected && source.moderation_note ? (
                        <p className="pf-note">{source.moderation_note}</p>
                      ) : null}
                      {tab === 'review' ? (
                        <Link className="text-btn" to={`/create-listing?edit=${item.id}`}>Редактировать</Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty text="В этой вкладке пока ничего нет" />
            )}
          </>
        )}
      </div>
      <ProfileEditor
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await refresh();
          setEditOpen(false);
        }}
      />
    </section>
  );
}

function ProfileEditor({ open, user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '', email: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      city: user.city || '',
      email: user.email || '',
    });
    setFile(null);
    setPreview(user.avatar ? mediaUrl(user.avatar) : '');
    setError('');
  }, [open, user]);

  const pickAvatar = (list) => {
    const next = list?.[0];
    if (!next) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('phone', form.phone.trim());
      fd.append('city', form.city.trim());
      fd.append('email', form.email.trim());
      if (file) fd.append('avatar', file, file.name);
      await api.post('/auth/profile', fd);
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Редактировать профиль"
      footer={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" form="profile-edit" className="btn" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
        </>
      )}
    >
      <form id="profile-edit" className="pf-edit" onSubmit={save}>
        <div className="pf-edit-avatar">
          <span className="pf-avatar">
            {preview ? <img src={preview} alt="" /> : initials(form.name || user?.name)}
          </span>
          <label className="btn btn-sm btn-ghost">
            Сменить аватар
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => pickAvatar(e.target.files)} />
          </label>
        </div>
        {error ? <p className="form-banner form-banner--error">{error}</p> : null}
        <label>Имя
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>Телефон
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>Город
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </label>
        <label>Email
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
      </form>
    </Modal>
  );
}

function Reviews({ items, name, isAdmin }) {
  return (
    <div className="pf-reviews">
      <h2>{isAdmin ? 'Отзывы обо мне' : 'Отзывы покупателей'}</h2>
      <p>{isAdmin ? `Публичные отзывы об ${name || 'администраторе'} как участнике сделок` : 'Отзывы участников завершённых сделок'}</p>
      {items.length ? (
        items.map((review) => (
          <article key={review.id}>
            <span className="pf-avatar pf-avatar--sm">{initials(review.reviewer_name)}</span>
            <div>
              <strong>{review.reviewer_name}</strong>
              <p className="pf-meta">
                <Stars value={review.rating} />
                <span>{new Date(String(review.created_at).replace(' ', 'T')).toLocaleDateString('ru-RU')}</span>
              </p>
              <p>{review.comment}</p>
              <small>{review.listing_title}</small>
            </div>
          </article>
        ))
      ) : (
        <Empty title="Пока нет отзывов" text="После завершения сделки покупатели и продавцы смогут поделиться впечатлениями. Их отзывы появятся здесь." />
      )}
    </div>
  );
}

function Empty({ title, text }) {
  return (
    <div className="pf-empty">
      {title ? <strong>{title}</strong> : null}
      <p>{text}</p>
    </div>
  );
}
