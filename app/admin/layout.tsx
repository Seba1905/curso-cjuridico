'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Escanear asistencia' },
  { href: '/admin/participantes', label: 'Participantes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="panel-shell">
      <aside className="panel-sidebar">
        <div className="panel-sidebar-brand">
          Consultorio Jurídico
          <span>Unicordoba</span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'activo' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="panel-main">{children}</main>
    </div>
  );
}