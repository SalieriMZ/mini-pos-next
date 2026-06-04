import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini POS',
  description: 'Sistema de punto de venta con Next.js App Router, SSR/SSG, TypeScript y Tailwind',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
