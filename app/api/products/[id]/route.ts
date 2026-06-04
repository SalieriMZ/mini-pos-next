import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const product = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.active = 1
    `).get(Number(id));

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json() as {
      name?: string;
      price?: number;
      stock?: number;
      category_id?: number;
      sku?: string | null;
      active?: number;
    };

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    db.prepare(`
      UPDATE products
      SET name = COALESCE(?, name),
          price = COALESCE(?, price),
          stock = COALESCE(?, stock),
          category_id = COALESCE(?, category_id),
          sku = COALESCE(?, sku),
          active = COALESCE(?, active),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.price ?? null,
      body.stock ?? null,
      body.category_id ?? null,
      body.sku ?? null,
      body.active ?? null,
      Number(id)
    );

    const updated = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `).get(Number(id));

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("UPDATE products SET active = 0, updated_at = datetime('now') WHERE id = ?").run(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
