'use client';

/**
 * Nueva Venta — Client Component (CSR)
 *
 * Esta página es interactiva (gestión de carrito en tiempo real) y usa
 * Route Handlers de Next.js para leer productos y registrar ventas.
 * Se marca explícitamente como Client Component porque necesita estado React.
 */

import { useState, useEffect } from 'react';
import type { Product, CartEntry } from '@/types';
import { calcIVA, calcTotal } from '@/types';
import { formatCLP } from '@/lib/format';
import { Spinner } from '@/components/Spinner';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function NuevaVentaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<{ id: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((e) => e.product.id === product.id);
      if (existing) {
        return prev.map((e) =>
          e.product.id === product.id
            ? { ...e, quantity: Math.min(e.quantity + 1, product.stock) }
            : e,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSaleSuccess(null);
  }

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((e) => e.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((e) => (e.product.id === productId ? { ...e, quantity: qty } : e)),
      );
    }
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((e) => e.product.id !== productId));
  }

  const subtotal = cart.reduce((acc, e) => acc + e.product.price * e.quantity, 0);
  const ivaAmount = calcIVA(subtotal);
  const total = calcTotal(subtotal);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSaleError(null);
    setProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((e) => ({ product_id: e.product.id, quantity: e.quantity })),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      const sale = await res.json();
      setSaleSuccess({ id: sale.id, total: sale.total });
      setCart([]);
      // Refrescar productos para reflejar stock actualizado
      const updated = await fetch('/api/products').then((r) => r.json());
      setProducts(updated);
    } catch (e: unknown) {
      setSaleError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de productos */}
        <div className="lg:col-span-2 space-y-4">
          <input
            className="input"
            placeholder="Buscar producto o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  p.stock === 0
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-95'
                }`}
              >
                <p className="font-medium text-gray-800 text-sm leading-tight">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.category_name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-blue-600 font-bold">{formatCLP(p.price)}</span>
                  <span
                    className={`text-xs ${p.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {p.stock === 0 ? 'Sin stock' : `${p.stock} disp.`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="card flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Carrito</h2>

          {saleSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 text-sm">
              <p className="font-semibold">¡Venta #{saleSuccess.id} registrada!</p>
              <p>
                Total cobrado: <strong>{formatCLP(saleSuccess.total)}</strong>
              </p>
            </div>
          )}

          {saleError && <ErrorAlert message={saleError} />}

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Agrega productos desde el catálogo.
            </p>
          ) : (
            <>
              <ul className="space-y-2 flex-1">
                {cart.map((entry) => (
                  <li key={entry.product.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {entry.product.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatCLP(entry.product.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => updateQty(entry.product.id, entry.quantity - 1)}
                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base leading-none"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={entry.product.stock}
                        value={entry.quantity}
                        onChange={(e) => updateQty(entry.product.id, Number(e.target.value))}
                        className="w-10 text-center text-sm border border-gray-300 rounded-md py-0.5"
                      />
                      <button
                        onClick={() => updateQty(entry.product.id, entry.quantity + 1)}
                        disabled={entry.quantity >= entry.product.stock}
                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base leading-none disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(entry.product.id)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Neto</span>
                  <span>{formatCLP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%)</span>
                  <span>{formatCLP(ivaAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCLP(total)}</span>
                </div>
              </div>

              <button
                className="btn-success w-full justify-center text-base py-3"
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing ? 'Procesando…' : 'Confirmar venta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
