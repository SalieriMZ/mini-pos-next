/**
 * Dashboard — Server Component (SSR)
 *
 * Renderizado en el servidor en cada petición (dynamic = 'force-dynamic').
 * Los datos del día se leen directamente desde la base de datos sin pasar
 * por una llamada HTTP al cliente.
 */

import { formatCLP } from '@/lib/format';
import type { DashboardData } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData(): Promise<DashboardData> {
  // En Server Components podemos importar el módulo de BD directamente.
  // getDb() inicializa el singleton y hace el seed si es la primera vez.
  const getDb = (await import('@/lib/db')).default;
  const db = getDb();

  const todayStats = db.prepare(`
    SELECT
      COUNT(*)  AS today_sales_count,
      COALESCE(SUM(total), 0) AS today_total
    FROM sales
    WHERE date(created_at) = date('now')
  `).get() as { today_sales_count: number; today_total: number };

  const topProducts = db.prepare(`
    SELECT si.product_id, p.name, SUM(si.quantity) AS total_sold
    FROM sale_items si
    JOIN products p ON p.id = si.product_id
    GROUP BY si.product_id
    ORDER BY total_sold DESC
    LIMIT 5
  `).all() as { product_id: number; name: string; total_sold: number }[];

  const lowStock = db.prepare(`
    SELECT id, name, stock
    FROM products
    WHERE active = 1 AND stock <= 10
    ORDER BY stock ASC, name ASC
    LIMIT 10
  `).all() as { id: number; name: string; stock: number }[];

  return {
    today_sales_count: todayStats.today_sales_count,
    today_total: todayStats.today_total,
    top_products: topProducts,
    low_stock: lowStock,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Ventas hoy</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{data.today_sales_count}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Recaudado hoy (con IVA)</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{formatCLP(data.today_total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Productos más vendidos</h2>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-gray-400">Sin ventas registradas aún.</p>
          ) : (
            <ol className="space-y-3">
              {data.top_products.map((p, i) => (
                <li key={p.product_id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{p.total_sold} und.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Alerta de stock bajo
            {data.low_stock.length > 0 && (
              <span className="ml-2 badge bg-red-100 text-red-700">{data.low_stock.length}</span>
            )}
          </h2>
          {data.low_stock.length === 0 ? (
            <p className="text-sm text-gray-400">Todos los productos tienen stock suficiente.</p>
          ) : (
            <ul className="space-y-2">
              {data.low_stock.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">{p.name}</span>
                  <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.stock === 0 ? 'Sin stock' : `${p.stock} und.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
