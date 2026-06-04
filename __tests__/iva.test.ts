import { describe, it, expect } from 'vitest';
import { calcIVA, calcTotal, IVA_RATE } from '../types/index';

describe('IVA / cálculo de totales', () => {
  it('IVA_RATE debe ser 0.19', () => {
    expect(IVA_RATE).toBe(0.19);
  });

  it('calcIVA redondea correctamente', () => {
    // $1000 * 19% = $190
    expect(calcIVA(1000)).toBe(190);
  });

  it('calcIVA maneja montos con centavos fraccionarios', () => {
    // $1490 * 0.19 = 283.1 → redondea a 283
    expect(calcIVA(1490)).toBe(283);
  });

  it('calcIVA de 0 es 0', () => {
    expect(calcIVA(0)).toBe(0);
  });

  it('calcTotal = subtotal + IVA', () => {
    const subtotal = 5000;
    expect(calcTotal(subtotal)).toBe(subtotal + calcIVA(subtotal));
  });

  it('cálculo de carrito con múltiples productos', () => {
    // Simula 2 pan marraqueta ($190 c/u) + 1 leche ($990)
    const items = [
      { price: 190, quantity: 2 },
      { price: 990, quantity: 1 },
    ];
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    // 190*2 + 990 = 1370
    expect(subtotal).toBe(1370);
    expect(calcIVA(subtotal)).toBe(Math.round(1370 * 0.19));
    expect(calcTotal(subtotal)).toBe(subtotal + Math.round(1370 * 0.19));
  });

  it('calcIVA es consistente con calcTotal', () => {
    for (const amount of [100, 999, 1490, 2490, 10000, 99999]) {
      expect(calcTotal(amount)).toBe(amount + calcIVA(amount));
    }
  });
});
