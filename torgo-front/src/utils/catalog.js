export function mediaUrl(path) {
  if (!path) return '/assets/seamaster.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/assets/')) return path;
  if (path.startsWith('uploads/')) return `/api/${path}`;
  if (path.startsWith('/api/')) return path;
  return `/api/uploads/${path.replace(/^\/+/, '')}`;
}

export function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseEndsAt(value) {
  if (!value) return undefined;
  if (typeof value === 'number') return value;
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const ts = Date.parse(normalized);
  return Number.isNaN(ts) ? undefined : ts;
}

export function mapCatalogItem(row) {
  const endsAt = row.auction?.ends_at ? parseEndsAt(row.auction.ends_at) : parseEndsAt(row.ends_at);
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    city: row.city,
    image: mediaUrl(row.thumb || row.images?.[0]?.path),
    endsAt,
    auction: row.auction || null,
    type: row.type,
    sellerName: row.seller_name,
    sellerRating: row.seller_rating,
  };
}

export function pluralRu(n, one, few, many) {
  const abs = Math.abs(Number(n) || 0);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function defaultFilters() {
  return {
    categories: [],
    city: '',
    priceMin: '',
    priceMax: '',
    condition: '',
    q: '',
    exclude: '',
    sort: 'newest',
  };
}

export function buildCatalogQuery(filters, page, perPage = 12) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.city?.trim()) params.set('city', filters.city.trim());
  if (filters.priceMin !== '' && filters.priceMin != null) params.set('price_min', String(filters.priceMin));
  if (filters.priceMax !== '' && filters.priceMax != null) params.set('price_max', String(filters.priceMax));
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.exclude?.trim()) params.set('exclude', filters.exclude.trim());
  if (filters.categories?.length) params.set('categories', filters.categories.join(','));
  return params.toString();
}

export function mapCategoryTree(nodes) {
  return (nodes || []).map((node) => ({
    id: node.id,
    label: node.name,
    slug: node.slug,
    children: mapCategoryTree(node.children),
  }));
}

