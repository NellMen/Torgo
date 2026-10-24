import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import AdminDialog, { initials } from '../../components/AdminDialog.jsx';
import { Pager, slicePage } from '../../components/AdminPager.jsx';

function flatten(nodes, parentId = '', parent = '', depth = 0) {
  const out = [];
  for (const node of nodes || []) {
    out.push({
      id: node.id,
      label: node.name,
      slug: node.slug,
      sort: node.sort_order || 0,
      parentId,
      parent,
      depth,
    });
    out.push(...flatten(node.children, String(node.id), node.name, depth + 1));
  }
  return out;
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-а-яё]/gi, '') || `cat-${Date.now()}`
  );
}

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [active, setActive] = useState(0);
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/admin/categories').then((data) => {
      setRows(flatten(data.tree || []));
      setCounts(data.counts || {});
      setActive(Number(data.active_listings || 0));
    });

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (level === 'root' && row.depth !== 0) return false;
      if (level === 'child' && row.depth === 0) return false;
      if (!query) return true;
      return row.label.toLowerCase().includes(query);
    });
  }, [rows, q, level]);

  const view = slicePage(filtered, page);
  const close = () => {
    setDialog(null);
    setError('');
  };

  const openAdd = () => {
    setForm({ name: '', parent_id: '' });
    setError('');
    setDialog({ mode: 'add' });
  };

  const openEdit = (row) => {
    setForm({ name: row.label, parent_id: row.parentId });
    setError('');
    setDialog({ mode: 'edit', row });
  };

  const openDelete = (row) => {
    setReason('');
    setError('');
    setDialog({ mode: 'delete', row });
  };

  const ready = form.name.trim().length >= 2;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const parentId = form.parent_id ? Number(form.parent_id) : null;
      if (dialog.mode === 'add') {
        await api.post('/admin/categories', {
          name: form.name.trim(),
          slug: slugify(form.name),
          parent_id: parentId,
        });
      } else {
        await api.put(`/admin/categories/${dialog.row.id}`, {
          name: form.name.trim(),
          parent_id: parentId,
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
      await api.delete(`/admin/categories/${dialog.row.id}`);
      await load();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const subject = dialog?.row;
  const parents = rows.filter((row) => row.id !== subject?.id);

  return (
    <>
      <h1>Категории</h1>
      <div className="op-toolbar">
        <p className="op-lead">{active.toLocaleString('ru-RU')} активных объявлений</p>
        <button type="button" className="op-add" onClick={openAdd}>
          Добавить категорию
        </button>
      </div>
      <div className="op-tools">
        <label className="op-search">
          <input
            value={q}
            placeholder="Поиск по названию категории"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="op-filters">
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Все уровни</option>
            <option value="root">Корневые</option>
            <option value="child">Дочерние</option>
          </select>
        </div>
      </div>
      <div className="op-table">
        <div className="op-head op-cats">
          <span>Категория</span>
          <span>Объявления</span>
          <span>Действие</span>
        </div>
        {view.rows.map((row) => (
          <article key={row.id} className="op-row">
            <div className="op-line op-cats">
              <div>
                <strong>{row.label}</strong>
                <small>{row.depth === 0 ? 'Корневая категория' : `Внутри · ${row.parent}`}</small>
              </div>
              <span className="op-desk">{Number(counts[row.id] || 0).toLocaleString('ru-RU')}</span>
              <span className="op-desk op-pair">
                <button type="button" className="op-btn" onClick={() => openEdit(row)}>
                  Изменить
                </button>
                <button type="button" className="op-btn" onClick={() => openDelete(row)}>
                  Удалить
                </button>
              </span>
            </div>
            <p className="op-phone">Объявления: {Number(counts[row.id] || 0).toLocaleString('ru-RU')}</p>
            <div className="op-row-actions op-pair">
              <button type="button" className="op-btn" onClick={() => openEdit(row)}>
                Изменить
              </button>
              <button type="button" className="op-btn" onClick={() => openDelete(row)}>
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
        title={dialog?.mode === 'edit' ? 'Изменить категорию' : 'Добавить категорию'}
        hint={
          dialog?.mode === 'edit'
            ? 'Изменения обновят запись в каталоге. Существующие данные сохранены.'
            : 'Настройте новую запись справочника. Родитель необязателен.'
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
          <label className={`adm-field${form.name.trim() ? '' : ' is-empty'}`}>
            <span>Название</span>
            <input
              value={form.name}
              placeholder="Введите название категории"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className={`adm-field${dialog?.mode === 'edit' || form.parent_id ? '' : ' is-empty'}`}>
            <span>Родитель</span>
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
              <option value="">{dialog?.mode === 'edit' ? 'Без родителя' : 'Выберите родительскую категорию'}</option>
              {parents.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
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
        title="Удалить категорию"
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
            <b>{initials(subject.label)}</b>
            <div>
              <strong>{subject.label}</strong>
              <small>
                {subject.parent ? subject.parent : 'Без родителя'} · порядок: {subject.sort}
                <br />
                {Number(counts[subject.id] || 0).toLocaleString('ru-RU')} объявлений
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
