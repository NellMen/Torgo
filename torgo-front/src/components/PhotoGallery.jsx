import { useEffect, useRef, useState } from 'react';

const THUMBS = 5;

export default function PhotoGallery({ images = [], alt = '' }) {
  const list = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const drag = useRef({ x: 0, moved: false });

  useEffect(() => {
    setIndex(0);
    setOpen(false);
    setZoomed(false);
  }, [list.join('|')]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, list.length]);

  if (!list.length) return null;

  const step = (dir) => {
    setZoomed(false);
    setIndex((current) => (current + dir + list.length) % list.length);
  };

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, moved: false };
  };

  const onPointerUp = (e) => {
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 40 && list.length > 1) {
      drag.current.moved = true;
      step(dx < 0 ? 1 : -1);
    }
  };

  const openAt = (next) => {
    setIndex(next);
    setZoomed(false);
    setOpen(true);
  };

  const shown = list.length > THUMBS ? list.slice(0, THUMBS) : list;
  const extra = list.length - shown.length;

  return (
    <div className="ld-gallery">
      <div className="ld-main">
        {list.length > 1 ? (
          <button type="button" className="ld-nav ld-nav--prev" aria-label="Предыдущее фото" onClick={() => step(-1)}>
            ‹
          </button>
        ) : null}
        <button
          type="button"
          className="ld-zoom"
          aria-label="Увеличить фото"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={() => {
            if (!drag.current.moved) openAt(index);
          }}
        >
          <img src={list[index]} alt={alt} draggable="false" />
        </button>
        {list.length > 1 ? (
          <button type="button" className="ld-nav ld-nav--next" aria-label="Следующее фото" onClick={() => step(1)}>
            ›
          </button>
        ) : null}
        <span className="ld-count">
          <GalleryIcon />
          {index + 1} / {list.length}
        </span>
      </div>

      {list.length > 1 ? (
        <div className="ld-thumbs" style={{ gridTemplateColumns: `repeat(${shown.length + (extra > 0 ? 1 : 0)}, 1fr)` }}>
          {shown.map((src, i) => (
            <button key={src + i} type="button" className={i === index ? 'is-active' : ''} onClick={() => setIndex(i)}>
              <img src={src} alt="" />
            </button>
          ))}
          {extra > 0 ? (
            <button type="button" className="ld-more" onClick={() => openAt(THUMBS)}>
              <span>
                +{extra}
                <small>фото</small>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div
          className="ld-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <button type="button" className="ld-lightbox-close" aria-label="Закрыть" onClick={() => setOpen(false)}>
            ×
          </button>
          {list.length > 1 ? (
            <button
              type="button"
              className="ld-nav ld-nav--prev"
              aria-label="Предыдущее фото"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
          ) : null}
          <img
            src={list[index]}
            alt={alt}
            className={zoomed ? 'is-zoomed' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((value) => !value);
            }}
          />
          {list.length > 1 ? (
            <button
              type="button"
              className="ld-nav ld-nav--next"
              aria-label="Следующее фото"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          ) : null}
          <span className="ld-count">
            {index + 1} / {list.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function GalleryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m7 15 3.2-3.2 2.3 2.2L16 10l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
