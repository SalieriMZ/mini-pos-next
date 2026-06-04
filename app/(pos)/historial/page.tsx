'use client';

/**
 * Historial de ventas — Client Component
 *
 * Carga ventas desde el Route Handler y permite expandir el detalle
 * de cada venta de forma interactiva.
 */

import { useState, useEffect } from 'react';
import type { Sale } from '@/types';
import { formatCLP, formatDate } from '@/lib/format';
import { Spinner } from '@/components/Spinner';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function HistorialPage() {
  const [data, setData] = useState<{ data: Sale[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch('/api/sales?limit=50&offset=0')
      .then((r) => r.json())
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(sale: Sale) {
    if (selected?.id === sale.id) {
      setSelected(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const full = await fetch(`/api/sales/${sale.id}`).then((r) => r.json());
      setSelected(full);
    } catch {
      // ignorar
    } finally {
      setLoadingDetail(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;

  const sales = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Historial de ventas</h1>
        <span className="badge bg-blue-100 text-blue-700">{data?.total ?? 0} registros</span>
      </div>

      {sales.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">Sin ventas registradas aún.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Neto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">IVA</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetail(s)}
                    >
                      <td className="px-4 py-3 text-gray-500">#{s.id}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3 text-right">{formatCLP(s.subtotal)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCLP(s.iva_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCLP(s.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {loadingDetail && selected === null
                          ? '…'
                          : selected?.id === s.id
                            ? '▲'
                            : '▼'}
                      </td>
                    </tr>
                    {selected?.id === s.id && selected.items && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-2">
                            Detalle de ítems
                          </p>
                          <table className="text-xs w-full">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left pb-1">Producto</th>
                                <th className="text-right pb-1">Cantidad</th>
                                <th className="text-right pb-1">Precio u.</th>
                                <th className="text-right pb-1">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selected.items.map((item) => (
                                <tr key={item.id} className="border-t border-blue-100">
                                  <td className="py-1 pr-4">{item.product_name}</td>
                                  <td className="py-1 text-right">{item.quantity}</td>
                                  <td className="py-1 text-right">{formatCLP(item.unit_price)}</td>
                                  <td className="py-1 text-right font-medium">
                                    {formatCLP(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
