import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    // Ventas de hoy (SQLite usa UTC; ajustamos a -3 / -4 hr Chile aprox)
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

    return NextResponse.json({
      today_sales_count: todayStats.today_sales_count,
      today_total: todayStats.today_total,
      top_products: topProducts,
      low_stock: lowStock,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 });
  }
}
