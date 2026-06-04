/**
 * Tests de integración para el Route Handler de productos.
 * Usa una DB en memoria (:memory:) para no contaminar datos reales.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';

// ── Helpers para simular la lógica del Route Handler ─────────────────────────

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      sku TEXT UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subtotal INTEGER NOT NULL,
      iva_amount INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );
  `);

  // Seed mínimo
  db.prepare("INSERT INTO categories (id, name) VALUES (1, 'Abarrotes')").run();
  db.prepare("INSERT INTO categories (id, name) VALUES (2, 'Lácteos')").run();
  db.prepare("INSERT INTO products (name, price, stock, category_id, sku) VALUES ('Arroz (1 kg)', 1490, 80, 1, 'ARR-001')").run();
  db.prepare("INSERT INTO products (name, price, stock, category_id, sku) VALUES ('Leche Entera (1 L)', 990, 0, 2, 'LEC-001')").run();

  return db;
}

type Db = ReturnType<typeof createTestDb>;
type Product = { id: number; name: string; price: number; stock: number; category_id: number; sku: string | null; active: number };

function getAllProducts(db: Db): Product[] {
  return db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.active = 1 ORDER BY p.name ASC
  `).all() as Product[];
}

describe('API de productos (lógica de DB)', () => {
  let db: Db;

  beforeAll(() => {
    db = createTestDb();
  });

  afterAll(() => {
    db.close();
  });

  it('devuelve todos los productos activos', () => {
    const products = getAllProducts(db);
    expect(products.length).toBe(2);
  });

  it('los productos tienen las propiedades requeridas', () => {
    const products = getAllProducts(db);
    for (const p of products) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(typeof p.price).toBe('number');
      expect(typeof p.stock).toBe('number');
    }
  });

  it('desactivar un producto lo excluye del listado', () => {
    db.prepare("UPDATE products SET active = 0 WHERE sku = 'ARR-001'").run();
    const products = getAllProducts(db);
    expect(products.every((p) => p.sku !== 'ARR-001')).toBe(true);
    // Restaurar
    db.prepare("UPDATE products SET active = 1 WHERE sku = 'ARR-001'").run();
  });

  it('registrar una venta descuenta stock', () => {
    const product = db.prepare('SELECT * FROM products WHERE sku = ?').get('ARR-001') as Product;
    const stockAntes = product.stock;

    const createSale = db.transaction(() => {
      const subtotal = product.price * 2;
      const ivaAmount = Math.round(subtotal * 0.19);
      const total = subtotal + ivaAmount;

      const { lastInsertRowid: saleId } = db.prepare(
        'INSERT INTO sales (subtotal, iva_amount, total) VALUES (?, ?, ?)'
      ).run(subtotal, ivaAmount, total);

      db.prepare(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)'
      ).run(saleId, product.id, 2, product.price, subtotal);

      db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(2, product.id);

      return db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    });

    createSale();

    const updated = db.prepare('SELECT stock FROM products WHERE sku = ?').get('ARR-001') as { stock: number };
    expect(updated.stock).toBe(stockAntes - 2);
  });

  it('productos sin stock tienen stock = 0', () => {
    const leche = db.prepare('SELECT * FROM products WHERE sku = ?').get('LEC-001') as Product;
    expect(leche.stock).toBe(0);
  });
});
