import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FiltersSidebar from '../components/FiltersSidebar.jsx';
import Pagination from '../components/Pagination.jsx';
import ProductCard from '../components/ProductCard.jsx';
import api from '../api/client.js';
import {
  buildCatalogQuery,
  defaultFilters,
  mapCatalogItem,
  mapCategoryTree,
  pluralRu,
} from '../utils/catalog.js';

const PAGE_SIZE = 12;

export default function ListingsCatalog() {
  const [params, setParams] = useSearchParams();
  const qParam = params.get('q') || '';
  const catParam = params.get('categories');

  const [filters, setFilters] = useState(() => ({
    ...defaultFilters(),
    q: qParam,
    categories: catParam ? catParam.split(',').map(Number).filter(Boolean) : [],
  }));
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((data) => setCategoriesTree(mapCategoryTree(data.tree || data)));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = buildCatalogQuery(applied, page, PAGE_SIZE);
    api
      .get(`/listings?${query}`)
      .then((data) => {
        setItems((data.items || []).map(mapCatalogItem));
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [applied, page]);

  const summary = useMemo(() => {
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return `Показано ${from}–${to} из ${total.toLocaleString('ru-RU')}`;
  }, [page, total]);

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...filters });
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    if (filters.categories.length) next.set('categories', filters.categories.join(','));
    setParams(next);
  };

  const resetFilters = () => {
    const empty = defaultFilters();
    setFilters(empty);
    setApplied(empty);
    setPage(1);
    setParams(new URLSearchParams());
  };

  const changeSort = (sort) => {
    setFilters((current) => ({ ...current, sort }));
    setApplied((current) => ({ ...current, sort }));
    setPage(1);
  };

  return (
    <section className="catalog-page">
      <div className="wrap">
        <header className="catalog-intro">
          <nav className="ld-crumbs" aria-label="Хлебные крошки">
            <Link to="/">Главная</Link>
            <span className="ld-sep"> / </span>
            <span className="ld-here">Объявления</span>
          </nav>
          <h1>Каталог объявлений</h1>
          <p>
            {total.toLocaleString('ru-RU')} {pluralRu(total, 'объявление', 'объявления', 'объявлений')}
            {applied.q ? ` · поиск «${applied.q}»` : ''}
          </p>
        </header>
        <div className="catalog-layout">
          <div className="catalog-side-head">
            <h2>Фильтры</h2>
          </div>
          <div className="catalog-main-head">
            <p className="catalog-summary">{summary}</p>
            <SortSelect value={applied.sort} onChange={changeSort} />
          </div>
          <FiltersSidebar
            categoriesTree={categoriesTree}
            filters={filters}
            onChange={setFilters}
            onApply={applyFilters}
            onReset={resetFilters}
          />
          <div className="catalog-main">
            {loading ? <p className="page-sub">Загрузка…</p> : null}
            <div className="cards cards--catalog">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} type="listing" />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <select className="catalog-sort" aria-label="Сортировка" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="newest">Сначала новые</option>
      <option value="oldest">Сначала старые</option>
      <option value="price_asc">Цена ↑</option>
      <option value="price_desc">Цена ↓</option>
    </select>
  );
}
