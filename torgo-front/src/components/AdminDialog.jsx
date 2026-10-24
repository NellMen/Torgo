import { useEffect } from 'react';

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || '—').slice(0, 2).toUpperCase();
}

function BanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4.52 4.52L17.48 17.48M4.52 4.52C2.86 6.18 1.83 8.47 1.83 11C1.83 16.06 5.94 20.17 11 20.17C16.06 20.17 20.17 16.06 20.17 11C20.17 5.94 16.06 1.83 11 1.83C8.47 1.83 6.18 2.86 4.52 4.52Z"
        stroke="#B4433D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AdminDialog({ open, onClose, title, hint, children, footer, extra, tone = 'form', wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`adm-modal is-${tone}${wide ? ' is-wide' : ''}`} role="presentation" onClick={onClose}>
      <div className="adm-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="adm-head">
          <div>
            {tone !== 'form' ? (
              <span className="adm-ban">
                <BanIcon />
              </span>
            ) : null}
            <h2>{title}</h2>
          </div>
          <button type="button" className={tone === 'form' ? 'adm-x' : 'adm-x is-box'} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        {hint ? <p className="adm-hint">{hint}</p> : null}
        {children}
        <footer className="adm-actions">{footer}</footer>
        {extra}
      </div>
    </div>
  );
}
