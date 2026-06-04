import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(Number(id));
    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    const items = db.prepare(`
      SELECT si.*, p.name AS product_name
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
    `).all(Number(id));

    return NextResponse.json({ ...(sale as object), items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener venta' }, { status: 500 });
  }
}
