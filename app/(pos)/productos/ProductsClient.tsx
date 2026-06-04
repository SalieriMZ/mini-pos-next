'use client';

import { useState } from 'react';
import type { Product, Category } from '@/types';
import { formatCLP } from '@/lib/format';
import { ErrorAlert } from '@/components/ErrorAlert';

type FormState = {
  name: string;
  price: string;
  stock: string;
  category_id: string;
  sku: string;
};

const EMPTY_FORM: FormState = { name: '', price: '', stock: '', category_id: '', sku: '' };

interface Props {
  initialProducts: Product[];
  categories: Category[];
}

export function ProductsClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('');

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id.toString() ?? '' });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      category_id: String(p.category_id),
      sku: p.sku ?? '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: Number(form.category_id),
        sku: form.sku.trim() || null,
        active: 1,
      };

      if (editing) {
        const res = await fetch(`/api/products/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated: Product = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const created: Product = await res.json();
        setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      }
      setShowForm(false);
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Desactivar el producto "${p.name}"?`)) return;
    try {
      await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  const filtered = filterCat
    ? products.filter((p) => p.category_id === Number(filterCat))
    : products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <div className="flex gap-2">
          <select
            className="input w-auto"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={openCreate}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Sin productos.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-50 text-blue-700">{p.category_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCLP(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`badge ${
                        p.stock <= 5
                          ? p.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary text-xs py-1 px-2"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger text-xs py-1 px-2"
                        onClick={() => handleDelete(p)}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editing ? 'Editar producto' : 'Nuevo producto'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <ErrorAlert message={formError} />}

              <div>
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio CLP *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Stock *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Categoría *</label>
                <select
                  className="input"
                  required
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                >
                  <option value="">Seleccionar…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">SKU</label>
                <input
                  className="input"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
