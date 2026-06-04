import { describe, it, expect } from 'vitest';
import { formatCLP, formatDate } from '../lib/format';

describe('formatCLP', () => {
  it('formatea montos en CLP con separador de miles', () => {
    const result = formatCLP(1490);
    // Debe contener "1.490" o "1,490" según locale
    expect(result).toMatch(/1[.,]490/);
  });

  it('formatea montos grandes correctamente', () => {
    const result = formatCLP(1000000);
    expect(result).toMatch(/1[.,]000[.,]000/);
  });

  it('incluye el símbolo de peso', () => {
    const result = formatCLP(990);
    expect(result).toContain('$');
  });

  it('formatea cero', () => {
    const result = formatCLP(0);
    expect(result).toContain('0');
    expect(result).toContain('$');
  });
});

describe('formatDate', () => {
  it('convierte una fecha ISO a string legible', () => {
    const dateStr = '2024-01-15T12:00:00';
    const result = formatDate(dateStr);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('acepta formato SQLite con espacio', () => {
    const dateStr = '2024-01-15 12:00:00';
    const result = formatDate(dateStr);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
