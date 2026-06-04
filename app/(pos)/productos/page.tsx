/**
 * Productos — Server Component con SSG + ISR (revalidate: 60 s)
 *
 * Las categorías se obtienen en tiempo de build (o revalidación ISR).
 * La lista de productos se carga inicialmente en el servidor y luego
 * el componente cliente gestiona las operaciones CRUD vía Route Handlers.
 */

import { ProductsClient } from './ProductsClient';
import type { Category } from '@/types';

export const revalidate = 60; // ISR: regenera la página cada 60 segundos

async function getCategories(): Promise<Category[]> {
  const getDb = (await import('@/lib/db')).default;
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
}

async function getProducts() {
  const getDb = (await import('@/lib/db')).default;
  const db = getDb();
  return db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.active = 1
    ORDER BY p.name ASC
  `).all();
}

export default async function ProductosPage() {
  const [categories, initialProducts] = await Promise.all([getCategories(), getProducts()]);

  return (
    <ProductsClient
      initialProducts={initialProducts as Parameters<typeof ProductsClient>[0]['initialProducts']}
      categories={categories}
    />
  );
}
