/**
 * Singleton de base de datos SQLite (better-sqlite3).
 * Solo se importa desde Route Handlers (server-side).
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'mini-pos.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton global para Next.js (hot-reload safe)
declare global {
  var __db: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = new Database(DB_PATH);
    global.__db.pragma('journal_mode = WAL');
    global.__db.pragma('foreign_keys = ON');
    initSchema(global.__db);
    seedIfEmpty(global.__db);
  }
  return global.__db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      price       INTEGER NOT NULL,
      stock       INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      sku         TEXT    UNIQUE,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      subtotal   INTEGER NOT NULL,
      iva_amount INTEGER NOT NULL,
      total      INTEGER NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id    INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity   INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal   INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at   ON sales(created_at);
  `);
}

const CATEGORIES = [
  { id: 1, name: 'Abarrotes' },
  { id: 2, name: 'Lácteos' },
  { id: 3, name: 'Panadería' },
  { id: 4, name: 'Bebidas' },
  { id: 5, name: 'Snacks' },
];

const PRODUCTS = [
  { name: 'Arroz Grado 1 (1 kg)',      price: 1490, stock: 80,  category_id: 1, sku: 'ARR-001' },
  { name: 'Aceite Vegetal (1 L)',       price: 2490, stock: 50,  category_id: 1, sku: 'ACE-001' },
  { name: 'Azúcar Blanca (1 kg)',       price: 1190, stock: 60,  category_id: 1, sku: 'AZU-001' },
  { name: 'Leche Entera (1 L)',         price: 990,  stock: 40,  category_id: 2, sku: 'LEC-001' },
  { name: 'Yogurt Natural (165 g)',     price: 690,  stock: 30,  category_id: 2, sku: 'YOG-001' },
  { name: 'Queso Gauda (200 g)',        price: 2190, stock: 5,   category_id: 2, sku: 'QUE-001' },
  { name: 'Pan Marraqueta (unidad)',    price: 190,  stock: 100, category_id: 3, sku: 'PAN-001' },
  { name: 'Hallulla Grande (unidad)',   price: 230,  stock: 80,  category_id: 3, sku: 'PAN-002' },
  { name: 'Marraqueta Integral (und)',  price: 290,  stock: 3,   category_id: 3, sku: 'PAN-003' },
  { name: 'Agua Mineral (500 mL)',      price: 790,  stock: 120, category_id: 4, sku: 'BEB-001' },
  { name: 'Bebida Cola (1,5 L)',        price: 1590, stock: 45,  category_id: 4, sku: 'BEB-002' },
  { name: 'Papas Fritas (140 g)',       price: 1290, stock: 35,  category_id: 5, sku: 'SNK-001' },
];

function seedIfEmpty(db: Database.Database): void {
  const row = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (row.count > 0) return;

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)');
  const insertProd = db.prepare(
    'INSERT INTO products (name, price, stock, category_id, sku) VALUES (?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const cat of CATEGORIES) {
      insertCat.run(cat.id, cat.name);
    }
    for (const prod of PRODUCTS) {
      insertProd.run(prod.name, prod.price, prod.stock, prod.category_id, prod.sku);
    }
  });

  transaction();
  console.log(`[DB] Seed completado: ${CATEGORIES.length} categorías, ${PRODUCTS.length} productos.`);
}

export default getDb;
