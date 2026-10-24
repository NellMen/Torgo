import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { mediaUrl } from '../../utils/catalog.js';

const CONDITIONS = { new: 'Новое', used: 'Б/у' };

function money(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

function when(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countdown(ends) {
  const diff = new Date(String(ends).replace(' ', 'T')).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${String(days).padStart(2, '0')} д · ${String(hours).padStart(2, '0')} ч · ${String(mins).padStart(2, '0')} м`;
}

export default function AdminReview({ kind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const auction = kind === 'auction';
  const [item, setItem] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const path = auction ? `/admin/auctions/${id}` : `/admin/listings/${id}`;
    return api.get(path).then((data) => {
      const row = auction ? data.auction : data.listing;
      setItem(row);
      setPhoto(0);
    });
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id, kind]);

  if (!item) return <p className="op-empty">{error || 'Загрузка…'}</p>;

  const images = item.images || [];
  const current = images[photo] || images[0];
  const status = item.status;
  const pending = status === 'pending';
  const live = status === 'active';
  const closed = status === 'rejected' || status === 'archived';
  const back = () => navigate(auction ? '/admin/auctions' : '/admin/listings');
  const category = [item.parent_name, item.category_name].filter(Boolean).join(' / ');
  const price = auction ? item.auction?.start_price || item.price : item.price;
  const canReject = note.trim().length > 0;

  const act = async (action) => {
    if (action === 'reject' && !canReject) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/${auction ? 'auctions' : 'listings'}/${id}/${action}`, { note: note.trim() });
      setNote('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const timer = auction && item.auction?.ends_at ? countdown(item.auction.ends_at) : null;

  return (
    <section className="mr">
      <h1>{auction ? 'Модерация аукциона' : 'Модерация объявления'}</h1>
      <p className="mr-sub">
        {auction ? 'Аукцион' : 'Объявление'} № {item.id} · {pending ? 'Проверка перед публикацией' : live ? 'Опубликовано' : 'Решение сохранено'}
      </p>

      <div className={`mr-banner${closed ? ' is-off' : ''}`}>
        <strong>
          {pending && 'Модерация активна · ожидает решения'}
          {live && 'Объявление опубликовано'}
          {status === 'rejected' && 'Модерация отклонена · возвращено продавцу'}
          {status === 'archived' && 'Объявление заблокировано'}
          {status === 'sold' && 'Сделка завершена'}
        </strong>
        <span>
          {closed && item.moderation_note
            ? 'Продавец получил комментарий и может исправить заявку.'
            : `Заявка поступила ${when(item.created_at)}. Проверьте фото и данные товара.`}
        </span>
      </div>

      <div className="mr-top">
        <div className="mr-gallery">
          {current ? <img src={mediaUrl(current.path)} alt="" /> : <div className="mr-empty-photo">Нет фото</div>}
          <div className="mr-thumbs">
            {images.slice(0, 5).map((image, index) => (
              <button key={image.id || index} type="button" className={index === photo ? 'is-on' : ''} onClick={() => setPhoto(index)}>
                <img src={mediaUrl(image.path)} alt="" />
              </button>
            ))}
            <p>
              {images.length ? `${photo + 1} / ${images.length}` : '0 / 0'} · Главное фото
              <br />
              {images.length === 1 ? 'Продавец загрузил одну фотографию' : `Фотографий: ${images.length}`}
            </p>
          </div>
        </div>
        <aside className="mr-card">
          <em className={closed ? 'is-off' : ''}>
            {pending ? 'На проверке' : live ? 'Опубликовано' : status === 'rejected' ? 'Возвращено' : 'Заблокировано'}
          </em>
          <h2>{item.title}</h2>
          <strong>{money(price)}</strong>
          <small>{auction ? 'Стартовая цена' : 'Цена объявления'}</small>
          <p>
            Город: {item.city || '—'}
            <br />
            Категория: {category || '—'}
            <br />
            Продавец: {item.seller_name}
            <br />★ {Number(item.seller_rating || 0).toLocaleString('ru-RU')} · {item.seller_reviews || 0} отзывов
            <br />
            Дата заявки: {when(item.created_at)}
          </p>
        </aside>
      </div>

      <div className="mr-split">
        <article>
          <h3>Описание продавца</h3>
          <p>{item.description || 'Описание не указано.'}</p>
        </article>
        <article>
          <h3>Характеристики</h3>
          <ul>
            {item.item_condition ? (
              <li>
                <span>Состояние</span>
                {CONDITIONS[item.item_condition] || item.item_condition}
              </li>
            ) : null}
            {(item.attributes || []).map((row) => (
              <li key={row.attribute_id}>
                <span>{row.name}</span>
                {row.value}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {auction ? (
        <div className="mr-split">
          <article>
            <h3>Условия торгов</h3>
            <p>
              Стартовая цена: {money(item.auction?.start_price)}
              <br />
              Шаг ставки: {money(item.auction?.min_step)}
              <br />
              Текущая ставка: {Number(item.bids_count) ? money(item.auction?.current_price) : 'нет ставок'}
              <br />
              Окончание: {when(item.auction?.ends_at)}
            </p>
            <div className="mr-timer">
              <strong>{status === 'rejected' || !timer ? '— : — : —' : timer}</strong>
              <span>{status === 'rejected' ? 'Таймер не запущен: лот возвращён продавцу.' : 'До планового окончания'}</span>
            </div>
          </article>
          <article>
            <h3>История ставок · {item.bids_count || 0}</h3>
            {(item.bids || []).length === 0 ? (
              <p>Ставок пока нет. До публикации лота ставки недоступны.</p>
            ) : (
              <ul className="mr-bids">
                {item.bids.map((bid) => (
                  <li key={bid.id}>
                    <span>{bid.user_name}</span>
                    <span>{money(bid.amount)}</span>
                    <span>{when(bid.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      ) : null}

      <article className="mr-decision">
        <h3>{closed ? 'Сохранённое решение' : 'Решение по заявке'}</h3>
        {closed ? (
          <p className="mr-saved">{item.moderation_note || 'Комментарий не оставлен.'}</p>
        ) : (
          <label>
            Комментарий модератора
            <textarea value={note} placeholder="Напишите комментарий…" onChange={(e) => setNote(e.target.value)} />
            <small>
              {live
                ? 'Комментарий необязателен. Заблокировать снимет объявление с публикации.'
                : 'При отказе комментарий обязателен. Принять публикует заявку, комментарий можно не писать.'}
            </small>
          </label>
        )}
        {error ? <p className="adm-error">{error}</p> : null}
        <div className="mr-actions">
          {pending ? (
            <>
              <button type="button" className="mr-ok" disabled={busy} onClick={() => act('approve')}>
                Принять
              </button>
              <button type="button" className={`mr-no${canReject ? ' is-on' : ''}`} disabled={!canReject || busy} onClick={() => act('reject')}>
                Отказать
              </button>
            </>
          ) : null}
          {live ? (
            <button type="button" className="mr-no is-on" disabled={busy} onClick={() => act('block')}>
              Заблокировать
            </button>
          ) : null}
          <button type="button" className="mr-back" onClick={back}>
            Назад
          </button>
        </div>
      </article>
      <p className="mr-foot">Torgo · Операторская · Все решения сохраняются в журнале модерации</p>
    </section>
  );
}
