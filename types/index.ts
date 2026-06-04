// ── Domain types ─────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number;
  category_name: string;
  sku: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  subtotal: number;
  iva_amount: number;
  total: number;
  created_at: string;
  items?: SaleItem[];
}

export interface DashboardData {
  today_sales_count: number;
  today_total: number;
  top_products: { product_id: number; name: string; total_sold: number }[];
  low_stock: { id: number; name: string; stock: number }[];
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartEntry {
  product: Product;
  quantity: number;
}

// ── IVA helpers ───────────────────────────────────────────────────────────────

export const IVA_RATE = 0.19;

export function calcIVA(subtotal: number): number {
  return Math.round(subtotal * IVA_RATE);
}

export function calcTotal(subtotal: number): number {
  return subtotal + calcIVA(subtotal);
}
