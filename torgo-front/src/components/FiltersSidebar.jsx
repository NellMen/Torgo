import { useMemo, useState } from 'react';

function CategoryNode({ node, selected, onToggle, depth = 0 }) {
  const [open, setOpen] = useState(depth === 1);
  const hasChildren = node.children?.length > 0;
  const checked = selected.has(node.id);

  return (
    <div className="filter-tree-node" style={{ '--depth': depth }}>
      <div className="filter-tree-row">
        {hasChildren ? (
          <button
            type="button"
            className="filter-tree-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="filter-tree-spacer" />
        )}
        <label className="filter-check">
          <input type="checkbox" checked={checked} onChange={() => onToggle(node.id)} />
          <span>{node.label}</span>
        </label>
      </div>
      {hasChildren && open && (
        <div className="filter-tree-children">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FiltersSidebar({
  categoriesTree = [],
  filters,
  onChange,
  onApply,
  onReset,
}) {
  const selected = useMemo(() => new Set(filters.categories || []), [filters.categories]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.({ ...filters, categories: Array.from(next) });
  };

  const setField = (name, value) => onChange?.({ ...filters, [name]: value });

  return (
    <aside className="filters-sidebar" aria-label="Фильтры">
      <button type="button" className="text-btn filters-reset" onClick={onReset}>Сбросить</button>
      <div className="filters-block">
        <h3>Категории</h3>
        <div className="filter-tree">
          {categoriesTree.map((node) => (
            <CategoryNode key={node.id} node={node} selected={selected} onToggle={toggle} />
          ))}
        </div>
      </div>

      <div className="filters-block">
        <h3>Цена</h3>
        <div className="filters-range">
          <input
            type="number"
            placeholder="От"
            className="field-input"
            value={filters.priceMin}
            onChange={(e) => setField('priceMin', e.target.value)}
          />
          <input
            type="number"
            placeholder="До"
            className="field-input"
            value={filters.priceMax}
            onChange={(e) => setField('priceMax', e.target.value)}
          />
        </div>
      </div>

      <div className="filters-block">
        <h3>Город</h3>
        <input
          type="text"
          placeholder="Москва"
          className="field-input"
          value={filters.city}
          onChange={(e) => setField('city', e.target.value)}
        />
      </div>

      <div className="filters-block">
        <h3>Состояние</h3>
        <select
          className="field-input"
          value={filters.condition}
          onChange={(e) => setField('condition', e.target.value)}
        >
          <option value="">Любое</option>
          <option value="new">Новое</option>
          <option value="used">Б/у</option>
        </select>
      </div>

      <div className="filters-block">
        <h3>Слова в описании</h3>
        <input
          type="text"
          className="field-input"
          value={filters.q}
          onChange={(e) => setField('q', e.target.value)}
        />
      </div>

      <div className="filters-block">
        <h3>Исключить слова</h3>
        <input
          type="text"
          className="field-input"
          value={filters.exclude}
          onChange={(e) => setField('exclude', e.target.value)}
        />
      </div>

      <button type="button" className="btn btn-sm filters-apply" onClick={onApply}>
        Применить
      </button>
    </aside>
  );
}
