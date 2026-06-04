import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get('category_id');
    const activeOnly = searchParams.get('active') !== '0';

    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (activeOnly) {
      sql += ' AND p.active = 1';
    }
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(Number(categoryId));
    }
    sql += ' ORDER BY p.name ASC';

    const products = db.prepare(sql).all(...params);
    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json() as {
      name: string;
      price: number;
      stock: number;
      category_id: number;
      sku?: string | null;
      active?: number;
    };

    const { name, price, stock, category_id, sku = null, active = 1 } = body;

    if (!name || price == null || stock == null || !category_id) {
      return NextResponse.json({ error: 'Campos requeridos: name, price, stock, category_id' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO products (name, price, stock, category_id, sku, active) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, price, stock, category_id, sku, active);

    const product = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
