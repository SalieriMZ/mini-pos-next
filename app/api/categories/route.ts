import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}
