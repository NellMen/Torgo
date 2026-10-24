import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import AdminDialog, { initials } from '../../components/AdminDialog.jsx';
import { Pager, slicePage } from '../../components/AdminPager.jsx';

const TYPES = { text: 'Текст', number: 'Число', select: 'Список' };

function optionsText(raw) {
  if (!raw) return '';
  try {
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
  } catch {
    return '';
  }
}

function flatten(nodes) {
  const out = [];
  for (const node of nodes || []) {
    out.push({ id: node.id, name: node.name });
    out.push(...flatten(node.children));
  }
  return out;
}

export default function AdminAttributes() {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ category_id: '', name: '', type: '' });
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/admin/attributes').then((data) => setItems(data.attributes || []));

  useEffect(() => {
    load();
    api.get('/admin/categories').then((data) => setCatalog(flatten(data.tree || [])));
  }, []);

  const categories = useMemo(() => {
    const names = new Set(items.map((item) => item.category_name).filter(Boolean));
    return [...names];
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.category_name !== category) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (!query) return true;
      return String(item.name).toLowerCase().includes(query);
    });
  }, [items, q, category, type]);

  const view = slicePage(filtered, page);
  const close = () => {
    setDialog(null);
    setError('');
  };

  const openAdd = () => {
    setForm({ category_id: '', name: '', type: '' });
    setError('');
    setDialog({ mode: 'add' });
  };

  const openEdit = (item) => {
    setForm({ category_id: String(item.category_id), name: item.name, type: item.type });
    setError('');
    setDialog({ mode: 'edit', item });
  };

  const openDelete = (item) => {
    setReason('');
    setError('');
    setDialog({ mode: 'delete', item });
  };

  const ready = form.category_id && form.name.trim() && form.type;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      if (dialog.mode === 'add') {
        await api.post(`/admin/categories/${form.category_id}/attributes`, {
          name: form.name.trim(),
          type: form.type,
        });
      } else {
        await api.put(`/admin/attributes/${dialog.item.id}`, {
          name: form.name.trim(),
          type: form.type,
          category_id: Number(form.category_id),
        });
      }
      await load();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/admin/attributes/${dialog.item.id}`);
      await load();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const subject = dialog?.item;

  return (
    <>
      <h1>Характеристики</h1>
      <div className="op-toolbar">
        <button type="button" className="op-add" onClick={openAdd}>
          Добавить характеристику
        </button>
      </div>
      <div className="op-tools">
        <label className="op-search">
          <input
            value={q}
            placeholder="Поиск по названию поля"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="op-filters">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все категории</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все типы полей</option>
            {Object.entries(TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="op-table">
        <div className="op-head op-attrs">
          <span>Характеристика</span>
          <span>Тип поля</span>
          <span>Применение</span>
          <span>Действия</span>
        </div>
        {view.rows.map((item) => (
          <article key={item.id} className="op-row">
            <div className="op-line op-attrs">
              <strong>{item.name}</strong>
              <span className="op-desk">{TYPES[item.type] || item.type}</span>
              <span className="op-desk op-muted">{item.category_name}</span>
              <span className="op-desk op-pair">
                <button type="button" className="op-btn" onClick={() => openEdit(item)}>
                  Изменить
                </button>
                <button type="button" className="op-btn" onClick={() => openDelete(item)}>
                  Удалить
                </button>
              </span>
            </div>
            <p className="op-phone">
              Тип поля: {TYPES[item.type] || item.type}
              <br />
              Применение: {item.category_name}
            </p>
            <div className="op-row-actions op-pair">
              <button type="button" className="op-btn" onClick={() => openEdit(item)}>
                Изменить
              </button>
              <button type="button" className="op-btn" onClick={() => openDelete(item)}>
                Удалить
              </button>
            </div>
          </article>
        ))}
        {view.total === 0 ? <p className="op-empty">Ничего не найдено</p> : null}
        <Pager page={view.page} pages={view.pages} total={view.total} onPage={setPage} />
      </div>

      <AdminDialog
        open={dialog?.mode === 'add' || dialog?.mode === 'edit'}
        onClose={close}
        title={dialog?.mode === 'edit' ? 'Изменить характеристику' : 'Добавить характеристику'}
        hint={
          dialog?.mode === 'edit'
            ? 'Изменения обновят запись в каталоге. Существующие данные сохранены.'
            : 'Настройте новое поле для объявлений выбранной категории.'
        }
        footer={
          <>
            <button type="button" className={`adm-save${ready ? ' is-on' : ''}`} disabled={!ready || busy} onClick={save}>
              Сохранить
            </button>
            <button type="button" className="adm-cancel" onClick={close}>
              Отмена
            </button>
          </>
        }
      >
        <div className="adm-fields">
          <label className={`adm-field${form.category_id ? '' : ' is-empty'}`}>
            <span>Категория</span>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Выберите категорию</option>
              {catalog.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className={`adm-field${form.name.trim() ? '' : ' is-empty'}`}>
            <span>Название</span>
            <input
              value={form.name}
              placeholder="Название для пользователя"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className={`adm-field${form.type ? '' : ' is-empty'}`}>
            <span>Тип</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="">Выберите тип значения</option>
              {Object.entries(TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="adm-error">{error}</p> : null}
      </AdminDialog>

      <AdminDialog
        open={dialog?.mode === 'delete'}
        onClose={close}
        tone="danger"
        title="Удалить характеристику"
        footer={
          <>
            <button type="button" className={`adm-danger${reason.trim() ? ' is-on' : ''}`} disabled={!reason.trim() || busy} onClick={remove}>
              Удалить
            </button>
            <button type="button" className="adm-cancel" onClick={close}>
              Отмена
            </button>
          </>
        }
      >
        {subject ? (
          <div className="adm-person">
            <b>{initials(subject.name)}</b>
            <div>
              <strong>{subject.name}</strong>
              <small>
                {subject.category_name}
                <br />
                {TYPES[subject.type] || subject.type}
                {optionsText(subject.options_json) ? ` · ${optionsText(subject.options_json)}` : ''} · порядок: {subject.sort_order || 0}
              </small>
            </div>
          </div>
        ) : null}
        <label className={`adm-reason${reason.trim() ? ' is-filled' : ''}`}>
          <span>Причина удаления</span>
          <textarea value={reason} placeholder="Напишите комментарий…" onChange={(e) => setReason(e.target.value)} />
        </label>
        {error ? <p className="adm-error">{error}</p> : null}
      </AdminDialog>
    </>
  );
}
