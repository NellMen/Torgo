import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel.jsx';
import api from '../api/client.js';
import { mediaUrl } from '../utils/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function whenLabel(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [threadOpen, setThreadOpen] = useState(Boolean(params.get('chat')));
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadList = () => {
    api
      .get('/conversations')
      .then((data) => {
        const list = data.conversations || [];
        setConversations(list);
        setActiveId((current) => {
          if (current && list.some((item) => Number(item.id) === Number(current))) return current;
          const requested = Number(params.get('chat'));
          const picked = list.find((item) => Number(item.id) === requested) || list[0];
          return picked ? picked.id : null;
        });
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadList();
  }, [isAuthenticated, params]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item) =>
      `${item.buyer_name} ${item.seller_name} ${item.last_message || ''}`.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;

  const peerOf = (item) => (Number(item?.buyer_id) === Number(user?.id) ? item?.seller_name : item?.buyer_name);
  const active = conversations.find((item) => Number(item.id) === Number(activeId));
  const unreadDialogs = conversations.filter((item) => Number(item.unread_count) > 0).length;

  const openThread = (id) => {
    setActiveId(id);
    setThreadOpen(true);
  };

  return (
    <section className={`messages-page ${threadOpen ? 'is-thread' : ''}`}>
      <div className="wrap">
        <div className="msg-head">
          <div>
            <h1>Сообщения</h1>
            <p>
              {unreadDialogs
                ? `${unreadDialogs} ${plural(unreadDialogs, 'непрочитанный диалог', 'непрочитанных диалога', 'непрочитанных диалогов')}`
                : 'Нет непрочитанных диалогов'}
            </p>
          </div>
          <button type="button" className="msg-back" onClick={() => setThreadOpen(false)}>
            ← К списку диалогов
            {unreadDialogs ? <b>{unreadDialogs} новых</b> : null}
          </button>
        </div>
        {error ? <p className="form-banner form-banner--error">{error}</p> : null}
        <div className="messages-layout">
          <aside className="messages-list">
            <label className="msg-search">
              <input placeholder="Поиск по сообщениям" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {visible.length ? (
              <ul>
                {visible.map((item) => {
                  const name = peerOf(item);
                  const unread = Number(item.unread_count) || 0;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={Number(item.id) === Number(activeId) ? 'is-active' : ''}
                        onClick={() => openThread(item.id)}
                      >
                        <span className="msg-avatar">{initials(name)}</span>
                        <span className="msg-preview">
                          <strong>{name}</strong>
                          <em>{item.last_message || 'Нет сообщений'}</em>
                        </span>
                        <time>{whenLabel(item.last_message_at || item.updated_at)}</time>
                        {unread > 0 ? <b>{unread}</b> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="msg-empty">Нет сообщений</p>
            )}
          </aside>
          <div className="messages-chat">
            {active ? (
              <ChatPanel
                conversationId={active.id}
                title={peerOf(active)}
                initials={initials(peerOf(active))}
                listingId={active.listing_id}
                listingTitle={active.listing_title}
                listingType={active.listing_type}
                thumb={mediaUrl(active.thumb)}
                currentUserId={user?.id}
                onSent={loadList}
              />
            ) : (
              <p className="msg-empty msg-empty--pane">Выберите диалог</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
