import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo — solo se ejecuta en el servidor.
  // Excluirlo del bundle del cliente evita errores en el browser.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
