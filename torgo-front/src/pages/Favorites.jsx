import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mapCatalogItem } from '../utils/catalog.js';

export default function Favorites() {
  const { isAuthenticated, loading } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/favorites').then((data) => setItems((data.items || []).map((row) => mapCatalogItem({ ...row, price: row.current_price || row.price }))));
  }, [isAuthenticated]);

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="catalog-page">
      <div className="wrap">
        <div className="page-head">
          <h1>Избранное</h1>
        </div>
        <div className="cards cards--catalog">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} type={item.type === 'auction' ? 'auction' : 'listing'} showTimer={item.type === 'auction'} />
          ))}
        </div>
        {!items.length ? <p className="page-sub">Пока пусто</p> : null}
      </div>
    </section>
  );
}
