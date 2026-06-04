import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { calcIVA } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const limit = Number(searchParams.get('limit') ?? '50');
    const offset = Number(searchParams.get('offset') ?? '0');

    const total = (db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number }).count;
    const data = db.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

    return NextResponse.json({ data, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json() as { items: { product_id: number; quantity: number }[] };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const createSale = db.transaction(() => {
      let subtotal = 0;

      // Validate and lock products
      const resolvedItems: { product_id: number; quantity: number; unit_price: number; subtotal: number; name: string }[] = [];

      for (const item of body.items) {
        const product = db.prepare('SELECT id, name, price, stock, active FROM products WHERE id = ?').get(item.product_id) as
          | { id: number; name: string; price: number; stock: number; active: number }
          | undefined;

        if (!product || !product.active) {
          throw new Error(`Producto ${item.product_id} no encontrado o inactivo`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}" (disponible: ${product.stock})`);
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        resolvedItems.push({
          product_id: product.id,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal: itemSubtotal,
          name: product.name,
        });
      }

      const ivaAmount = calcIVA(subtotal);
      const total = subtotal + ivaAmount;

      const saleResult = db.prepare(
        'INSERT INTO sales (subtotal, iva_amount, total) VALUES (?, ?, ?)'
      ).run(subtotal, ivaAmount, total);

      const saleId = saleResult.lastInsertRowid;

      const insertItem = db.prepare(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)'
      );
      const updateStock = db.prepare('UPDATE products SET stock = stock - ?, updated_at = datetime(\'now\') WHERE id = ?');

      for (const item of resolvedItems) {
        insertItem.run(saleId, item.product_id, item.quantity, item.unit_price, item.subtotal);
        updateStock.run(item.quantity, item.product_id);
      }

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    });

    const sale = createSale();
    return NextResponse.json(sale, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
