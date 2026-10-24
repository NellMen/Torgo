import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import api from '../api/client.js';
import { mapCatalogItem, mapCategoryTree } from '../utils/catalog.js';

const categoryIcons = ['electronics', 'auto', 'realty', 'fashion', 'home', 'hobby', 'services'];

function CatIcon({ type }) {
  if (type === 'electronics')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="2.6" width="8" height="18.8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="17.6" r="0.9" fill="currentColor" />
      </svg>
    );
  if (type === 'auto')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 14.2V11l2.1-4.2A2 2 0 0 1 7.9 5.6h8.2a2 2 0 0 1 1.8 1.2L20 11v3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M3.2 14.2h17.6v2.2a1.4 1.4 0 0 1-1.4 1.4h-.6a1.8 1.8 0 0 1-3.6 0H8.8a1.8 1.8 0 0 1-3.6 0h-.6a1.4 1.4 0 0 1-1.4-1.4v-2.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M7.2 10.6h9.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function Home() {
  const [auctions, setAuctions] = useState([]);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get('/home')
      .then((data) => {
        setAuctions((data.featured_auctions || []).slice(0, 4).map(mapCatalogItem));
        setListings((data.featured_listings || []).slice(0, 4).map(mapCatalogItem));
        setCategories(mapCategoryTree(data.categories || data.tree || []));
      })
      .catch(() => {
        setAuctions([]);
        setListings([]);
      });
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-shapes" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="blob b4" />
          <span className="blob b5" />
          <span className="blob b6" />
          <span className="blob b7" />
          <span className="blob b8" />
          <span className="ring" />
        </div>
        <div className="wrap hero-inner">
          <h1>
            Вещи с историей.
            <br />
            Торги с доверием.
          </h1>
          <p>Проверенные продавцы, прозрачные аукционы и надёжная оплата для каждой сделки.</p>
          <div className="hero-actions">
            <Link className="btn btn-lg" to="/auctions">
              Смотреть аукционы
            </Link>
            <Link className="btn btn-lg btn-ghost" to="/create-listing">
              Подать объявление
            </Link>
          </div>
        </div>
      </section>

      <section className="cats-band">
        <div className="wrap">
          <div className="cats">
            {categories.slice(0, 7).map((cat, index) => (
              <Link
                key={cat.id}
                className={`cat ${index === 0 ? 'cat-hot' : ''}`}
                to={`/listings?categories=${cat.id}`}
              >
                <CatIcon type={categoryIcons[index] || 'home'} />
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="feed" id="auctions">
        <div className="wrap">
          <div className="section-head">
            <h2>Аукционы сейчас</h2>
            <Link className="section-link" to="/auctions">
              Смотреть все аукционы →
            </Link>
          </div>
          <div className="cards cards-home">
            {auctions.slice(0, 4).map((item) => (
              <ProductCard key={item.id} item={item} type="auction" showTimer />
            ))}
          </div>
        </div>
      </section>

      <section className="feed feed-last" id="listings">
        <div className="wrap">
          <div className="section-head">
            <h2>Объявления с фиксированной ценой</h2>
            <Link className="section-link" to="/listings">
              Смотреть все объявления →
            </Link>
          </div>
          <div className="cards cards-home">
            {listings.map((item) => (
              <ProductCard key={item.id} item={item} type="listing" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
