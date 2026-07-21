'use client';

import Link from 'next/link';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';

const NAVIGATION_SECTIONS = [
  {
    label: null,
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      {
        label: 'Produtos',
        href: '/admin/produtos',
        icon: Package,
      },
      {
        label: 'Categorias',
        href: '/admin/categorias',
        icon: Tags,
      },
      {
        label: 'Estoque',
        href: '/admin/estoque',
        icon: Boxes,
      },
    ],
  },
  {
    label: 'Vendas',
    items: [
      {
        label: 'Pedidos',
        href: '/admin/pedidos',
        icon: ShoppingBag,
      },
      {
        label: 'Cupons',
        href: '/admin/cupons',
        icon: TicketPercent,
      },
    ],
  },
  {
    label: 'Clientes',
    items: [
      {
        label: 'Usuários',
        href: '/admin/usuarios',
        icon: Users,
      },
    ],
  },
  {
    label: 'Análise',
    items: [
      {
        label: 'Relatórios',
        href: '/admin/relatorios',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Loja',
    items: [
      {
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: Settings,
      },
    ],
  },
];

function isNavigationItemActive(item, pathname) {
  if (item.exact) {
    return pathname === item.href;
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );
}

export default function AdminSidebar({
  pathname,
  user,
  onLogout,
  mobile = false,
  onClose,
}) {
  function handleLinkClick() {
    if (mobile && onClose) {
      onClose();
    }
  }

  return (
    <aside
      className={
        mobile
          ? 'flex h-full flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-5 shadow-2xl'
          : 'sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950/95 p-6 lg:flex'
      }
    >
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-black">
              T
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Administração
              </p>

              <h1 className="mt-1 text-xl font-black text-white">
                Trinity Admin
              </h1>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Loja online
          </div>
        </div>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu administrativo"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-600 hover:text-white"
          >
            <X size={19} />
          </button>
        ) : null}
      </div>

      <nav
        className="space-y-6"
        aria-label="Navegação administrativa"
      >
        {NAVIGATION_SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.label || `section-${sectionIndex}`}
          >
            {section.label ? (
              <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">
                {section.label}
              </p>
            ) : null}

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  isNavigationItemActive(
                    item,
                    pathname
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    aria-current={
                      active ? 'page' : undefined
                    }
                    className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-bold transition ${
                      active
                        ? 'border-white bg-white text-black shadow-lg shadow-black/20'
                        : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={19}
                      className={
                        active
                          ? 'text-black'
                          : 'text-zinc-500 transition group-hover:text-white'
                      }
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        <div className="border-t border-zinc-800 pt-5">
          <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-black text-white">
                {getInitials(user?.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {user?.name || 'Administrador'}
                </p>

                <p className="mt-1 truncate text-xs text-zinc-500">
                  {user?.email ||
                    'Conta administrativa'}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
              Administrador
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}

function getInitials(name) {
  if (!name) {
    return 'AD';
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'AD';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}