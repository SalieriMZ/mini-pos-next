import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorAlert } from '../components/ErrorAlert';

describe('ErrorAlert', () => {
  it('muestra el mensaje de error', () => {
    render(<ErrorAlert message="Stock insuficiente" />);
    expect(screen.getByText(/Stock insuficiente/)).toBeTruthy();
  });

  it('contiene la etiqueta "Error:"', () => {
    render(<ErrorAlert message="Algo falló" />);
    expect(screen.getByText(/Error:/)).toBeTruthy();
  });

  it('aplica clase de fondo rojo', () => {
    const { container } = render(<ErrorAlert message="Test" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('bg-red-50');
  });
});
