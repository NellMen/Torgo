import { useEffect, useMemo, useState } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}д ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getVariant(ms) {
  if (ms <= 0) return 'ended';
  if (ms <= 1000 * 60 * 5) return 'critical';
  if (ms <= 1000 * 60 * 60) return 'soon';
  return 'normal';
}

export default function AuctionTimer({ endsAt, className = '' }) {
  const end = useMemo(() => (typeof endsAt === 'number' ? endsAt : new Date(endsAt).getTime()), [endsAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = end - now;
  const variant = getVariant(remaining);
  const label = variant === 'ended' ? 'Завершён' : formatRemaining(remaining);

  return (
    <span className={['auction-timer', `auction-timer--${variant}`, className].filter(Boolean).join(' ')}>
      {label}
    </span>
  );
}
