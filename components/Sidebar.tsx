'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/productos', label: 'Productos', icon: '◫' },
  { href: '/nueva-venta', label: 'Nueva Venta', icon: '⊕' },
  { href: '/historial', label: 'Historial', icon: '☰' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight text-white">Mini POS</h1>
        <p className="text-xs text-gray-400 mt-0.5">Sistema de ventas</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">CLP · IVA 19%</p>
      </div>
    </aside>
  );
}
