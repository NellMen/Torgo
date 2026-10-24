import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

function timeLabel(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function isToday(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
}

export default function ChatPanel({
  title = 'Диалог',
  initials = '?',
  conversationId,
  currentUserId,
  listingId,
  listingTitle,
  listingType,
  thumb,
  onSent,
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    const data = await api.get(`/conversations/${conversationId}/messages`);
    setMessages(data.messages || []);
    await api.post(`/conversations/${conversationId}/read`);
  }, [conversationId]);

  useEffect(() => {
    setError('');
    load().catch((err) => setError(err.message));
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/conversations/${conversationId}/messages`, { message: text });
      setDraft('');
      await load();
      onSent?.();
    } catch (err) {
      setError(err.message || 'Не удалось отправить');
    } finally {
      setSending(false);
    }
  };

  const href = listingType === 'auction' ? `/auctions/${listingId}` : `/listings/${listingId}`;
  const showToday = messages.some((item) => isToday(item.created_at));

  return (
    <section className="chat-panel" aria-label={title}>
      <header className="chat-panel-head">
        <span className="msg-avatar">{initials}</span>
        <h2>{title}</h2>
      </header>
      {listingId ? (
        <Link className="msg-lot" to={href}>
          {thumb ? <img src={thumb} alt="" /> : null}
          <span>Открыть →</span>
        </Link>
      ) : null}
      <div className="chat-panel-messages" ref={listRef}>
        {showToday ? <p className="msg-day">Сегодня</p> : null}
        {messages.length ? (
          messages.map((item) => {
            const mine = Number(item.sender_id) === Number(currentUserId);
            return (
              <div key={item.id} className={mine ? 'chat-bubble chat-bubble--me' : 'chat-bubble'}>
                <p>{item.body}</p>
                <time>{timeLabel(item.created_at)}</time>
              </div>
            );
          })
        ) : (
          <p className="msg-empty">Нет сообщений</p>
        )}
      </div>
      {error ? <p className="msg-error">{error}</p> : null}
      <form className="chat-panel-compose" onSubmit={send}>
        <input
          type="text"
          placeholder="Напишите сообщение..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn" disabled={sending || !draft.trim()}>
          <PlaneIcon />
          Отправить
        </button>
      </form>
    </section>
  );
}

function PlaneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
