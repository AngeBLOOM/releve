'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, ShoppingBag, Package, LayoutGrid, Users, BarChart2, Plug, Megaphone, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

const NAV_ITEMS = [
  { href: '/inbox',        label: 'Bandeja',       icon: MessageSquare },
  { href: '/orders',       label: 'Pedidos',        icon: ShoppingBag },
  { href: '/disenos',      label: 'Diseños',        icon: Palette },
  { href: '/catalog',      label: 'Catálogo',       icon: LayoutGrid },
  { href: '/inventory',    label: 'Inventario',     icon: Package },
  { href: '/customers',    label: 'Clientes',       icon: Users },
  { href: '/reports',      label: 'Reportes',       icon: BarChart2 },
  { href: '/marketing',    label: 'Marketing',      icon: Megaphone },
  { href: '/integrations', label: 'Integraciones',  icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BrandLogo size={32} rounded="rounded-lg" />
          <div>
            <span className="text-sm font-bold text-gray-900">Relevé</span>
            <span className="block text-xs text-gray-400">Panel de gestión</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith(href) ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
            <Icon size={17} />{label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">Relevé v1.0</p>
      </div>
    </aside>
  );
}
