import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mapCategoryTree, mediaUrl } from '../utils/catalog.js';

const MAX_PHOTOS = 20;
const MIN_PHOTOS = 3;

function initials(name) {
  return String(name || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function findPath(nodes, id, trail = []) {
  for (const node of nodes || []) {
    const next = [...trail, node];
    if (Number(node.id) === Number(id)) return next;
    const hit = findPath(node.children, id, next);
    if (hit) return hit;
  }
  return null;
}

function CatTree({ nodes, selected, onPick, open, toggle, depth = 0 }) {
  return nodes.map((node) => {
    const leaf = !node.children?.length;
    const opened = open.has(node.id);
    return (
      <div key={node.id}>
        <button
          type="button"
          className={Number(selected) === Number(node.id) ? 'is-on' : ''}
          style={{ paddingLeft: 14 + depth * 18 }}
          onClick={() => (leaf ? onPick(node.id) : toggle(node.id))}
        >
          {!leaf ? <i>{opened ? '⌄' : '›'}</i> : <i />}
          <span>{node.label}</span>
          {Number(selected) === Number(node.id) ? <em>Выбрано</em> : null}
        </button>
        {!leaf && opened ? (
          <CatTree nodes={node.children} selected={selected} onPick={onPick} open={open} toggle={toggle} depth={depth + 1} />
        ) : null}
      </div>
    );
  });
}

export default function CreateListing() {
  const { user, isAuthenticated, loading } = useAuth();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const savedAttrs = useRef(null);
  const [kept, setKept] = useState([]);
  const [tree, setTree] = useState([]);
  const [open, setOpen] = useState(() => new Set());
  const [attributes, setAttributes] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    type: 'fixed',
    category_id: '',
    item_condition: '',
    min_step: '',
    ends_at: '',
  });
  const [attrValues, setAttrValues] = useState({});
  const [photoMenu, setPhotoMenu] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/categories').then((data) => setTree(mapCategoryTree(data.tree || data)));
  }, []);

  useEffect(() => {
    if (!form.category_id) {
      setAttributes([]);
      setAttrValues({});
      return;
    }
    api.get(`/categories/${form.category_id}/attributes`).then((data) => {
      setAttributes(data.attributes || []);
      if (savedAttrs.current) {
        setAttrValues(savedAttrs.current);
        savedAttrs.current = null;
      } else {
        setAttrValues({});
      }
    });
  }, [form.category_id]);

  useEffect(() => {
    if (!editId) return;
    const apply = (row) => {
      savedAttrs.current = Object.fromEntries((row.attributes || []).map((attr) => [attr.attribute_id, attr.value]));
      setKept((row.images || []).map((img) => ({ id: img.id, url: mediaUrl(img.path) })));
      const ends = row.auction?.ends_at ? String(row.auction.ends_at).replace(' ', 'T').slice(0, 16) : '';
      setForm({
        title: row.title || '',
        description: row.description || '',
        price: String(row.type === 'auction' ? (row.auction?.start_price || row.price || '') : (row.price || '')),
        city: row.city || '',
        type: row.type || 'fixed',
        category_id: String(row.category_id || ''),
        item_condition: row.item_condition || '',
        min_step: String(row.auction?.min_step || ''),
        ends_at: ends,
      });
    };
    api.get(`/listings/${editId}`).then((data) => apply(data.listing)).catch(() => {
      api.get(`/auctions/${editId}`).then((data) => apply(data.auction));
    });
  }, [editId]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const path = useMemo(() => findPath(tree, form.category_id) || [], [tree, form.category_id]);
  const hideCondition = [3, 7].includes(Number(path[0]?.id));
  const attrsReady = attributes.every((attr) => String(attrValues[attr.id] || '').trim() !== '');
  const detailsReady = form.title.trim() && form.description.trim() && form.price && form.city.trim() && (hideCondition || form.item_condition) && attrsReady
    && (form.type === 'fixed' || (form.min_step && form.ends_at));
  const photoCount = kept.length + files.length;
  const photosReady = photoCount >= MIN_PHOTOS;

  if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;

  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addFiles = (list) => {
    const room = Math.max(0, MAX_PHOTOS - kept.length);
    const next = [...files, ...Array.from(list || [])].slice(0, room);
    setFiles(next);
    setPhotoMenu(null);
  };

  const makeCover = (index) => {
    setFiles((list) => {
      const next = [...list];
      const [file] = next.splice(index, 1);
      next.unshift(file);
      return next;
    });
    setPhotoMenu(null);
  };

  const removePhoto = (index) => {
    setFiles((list) => list.filter((_, i) => i !== index));
    setPhotoMenu(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) {
      setError('Выберите конечную категорию');
      return;
    }
    if (!detailsReady) {
      setError('Заполните все поля, включая характеристики');
      return;
    }
    if (photoCount < MIN_PHOTOS) {
      setError(`Добавьте минимум ${MIN_PHOTOS} фотографии — сейчас загружено ${photoCount}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('city', form.city.trim());
      fd.append('type', form.type);
      fd.append('category_id', form.category_id);
      if (!hideCondition) fd.append('item_condition', form.item_condition);
      fd.append('price', form.price);
      if (form.type === 'auction') {
        fd.append('start_price', form.price);
        fd.append('min_step', form.min_step);
        fd.append('ends_at', form.ends_at.replace('T', ' ') + ':00');
      }
      fd.append('attributes', JSON.stringify(attrValues));
      files.forEach((file) => fd.append('images[]', file, file.name));
      if (editId) {
        fd.append('keep_photos', '1');
        kept.forEach((img) => fd.append('keep_ids[]', String(img.id)));
        await api.post(`/listings/${editId}/resubmit`, fd);
        setDone('Изменения отправлены на проверку.');
        return;
      }
      await api.post('/listings', fd);
      setDone(form.type === 'auction'
        ? 'Аукцион отправлен на модерацию. Он появится в разделе аукционов админ-панели.'
        : 'Объявление отправлено на модерацию. Оно появится в разделе фиксированной цены админ-панели.');
    } catch (err) {
      setError(err.message || 'Не удалось создать объявление');
    } finally {
      setSubmitting(false);
    }
  };

  const priceLabel = form.price ? `${Number(form.price).toLocaleString('ru-RU')} ₽` : '—';

  return (
    <section className="cl-page">
      <div className="wrap cl-layout">
        <form className="cl-form" onSubmit={onSubmit}>
          {error ? <p className="form-banner form-banner--error">{error}</p> : null}
          {done ? <p className="form-banner">{done}</p> : null}

          <section className="cl-step">
            <StepHead n="1" title="Тип продажи" ready />
            <div className="cl-types">
              <button type="button" className={form.type === 'fixed' ? 'is-on' : ''} disabled={Boolean(editId)} onClick={() => setForm({ ...form, type: 'fixed' })}>
                <strong>Фиксированная цена</strong>
                <span>Покупатель связывается с вами по указанной цене.</span>
              </button>
              <button type="button" className={form.type === 'auction' ? 'is-on' : ''} disabled={Boolean(editId)} onClick={() => setForm({ ...form, type: 'auction' })}>
                <strong>Аукцион</strong>
                <span>Задайте стартовую цену, шаг и дату завершения.</span>
              </button>
            </div>
          </section>

          <section className="cl-step">
            <StepHead n="2" title="Категория" ready={Boolean(form.category_id)} />
            <p className="cl-hint">Выбрать можно только конечную категорию дерева.</p>
            <div className="cl-tree">
              <CatTree nodes={tree} selected={form.category_id} onPick={(id) => setForm({ ...form, category_id: String(id) })} open={open} toggle={toggle} />
            </div>
            {path.length ? <p className="cl-picked">✓ {path.map((node) => node.label).join(' / ')}</p> : null}
          </section>

          <section className="cl-step">
            <StepHead n="3" title="Описание и цена" ready={Boolean(detailsReady)} />
            <label>Заголовок
              <input maxLength={70} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <small>{form.title.length} из 70 символов</small>
            </label>
            <label>Описание
              <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="cl-split">
              <label>{form.type === 'auction' ? 'Стартовая цена' : 'Цена'}
                <input required type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label>Город
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
            </div>
            {form.type === 'auction' ? (
              <div className="cl-split">
                <label>Минимальный шаг
                  <input required type="number" min="1" value={form.min_step} onChange={(e) => setForm({ ...form, min_step: e.target.value })} />
                </label>
                <label>Окончание
                  <input required type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </label>
              </div>
            ) : null}
            <div className="cl-attrs">
              <div className="cl-attrs-head"><strong>Характеристики</strong><em>Для категории</em></div>
              {hideCondition ? null : (
                <label>Состояние
                  <select required value={form.item_condition} onChange={(e) => setForm({ ...form, item_condition: e.target.value })}>
                    <option value="">Выберите</option>
                    <option value="new">Новое</option>
                    <option value="used">Б/у</option>
                  </select>
                </label>
              )}
              <div className="cl-attr-grid">
                {attributes.map((attr) => (
                  <label key={attr.id}>{attr.name}
                    {attr.type === 'select' ? (
                      <select required value={attrValues[attr.id] || ''} onChange={(e) => setAttrValues({ ...attrValues, [attr.id]: e.target.value })}>
                        <option value="">Выберите</option>
                        {(attr.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input required type={attr.type === 'number' ? 'number' : 'text'} value={attrValues[attr.id] || ''} onChange={(e) => setAttrValues({ ...attrValues, [attr.id]: e.target.value })} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className={`cl-step ${photosReady ? '' : 'is-warn'}`}>
            <StepHead n="4" title="Фотографии" ready={photosReady} />
            <div
              className="cl-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <span>↥</span>
              <strong>Перетащите фотографии сюда</strong>
              <small>или выберите файлы — JPG, PNG, до {MAX_PHOTOS}</small>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>Выбрать файлы</button>
              <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => addFiles(e.target.files)} />
            </div>
            <div className="cl-photos">
              {kept.map((img, index) => (
                <div key={img.id} className="cl-photo">
                  <img src={img.url} alt="" />
                  <button type="button" className="cl-photo-hit" onClick={() => setKept((list) => list.filter((_, i) => i !== index))}>Удалить</button>
                </div>
              ))}
              {previews.map((src, index) => (
                <div key={src} className="cl-photo">
                  <button type="button" className="cl-photo-hit" onClick={() => setPhotoMenu(photoMenu === index ? null : index)}>
                    <img src={src} alt="" />
                    {index === 0 ? <em>Обложка</em> : null}
                  </button>
                  {photoMenu === index ? (
                    <div className="cl-photo-menu">
                      <button type="button" onClick={() => makeCover(index)} disabled={index === 0}>
                        Сделать обложкой
                      </button>
                      <button type="button" onClick={() => removePhoto(index)}>
                        Удалить
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {photoCount < MAX_PHOTOS ? (
                <button type="button" className="cl-photo cl-photo--add" onClick={() => inputRef.current?.click()}>+</button>
              ) : null}
            </div>
            {photoCount < MIN_PHOTOS ? <p className="cl-photo-error">Добавьте минимум {MIN_PHOTOS} фотографии — сейчас загружено {photoCount}.</p> : null}
          </section>

          <button type="submit" className="btn btn-lg" disabled={submitting}>{submitting ? 'Отправка…' : 'Отправить на модерацию'}</button>
        </form>

        <aside className="cl-preview">
          <div className="cl-preview-head">
            <h2>Предпросмотр</h2>
            <em>Черновик</em>
          </div>
          <article>
            {previews[0] || kept[0]?.url ? <img src={previews[0] || kept[0].url} alt="" /> : <div className="cl-preview-empty" />}
            <div>
              <strong>{priceLabel}</strong>
              <p>{form.title || 'Название объявления'}</p>
              <small>{form.city || 'Город'}</small>
            </div>
          </article>
          <div className="cl-seller">
            <span>{initials(user?.name)}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>★ {Number(user?.rating_avg || 0).toFixed(1)}</small>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StepHead({ n, title, ready }) {
  return (
    <div className="cl-step-head">
      <span><b>{n}</b>{title}</span>
      {ready ? <em>Готово</em> : null}
    </div>
  );
}
