'use client';

import {
  Bell,
  Menu,
  Search,
} from 'lucide-react';
import { useMemo } from 'react';

const PAGE_TITLES = {
  '/admin': {
    title: 'Dashboard',
    description:
      'Visão geral da operação da loja.',
  },
  '/admin/produtos': {
    title: 'Produtos',
    description:
      'Gerencie o catálogo da Trinity.',
  },
  '/admin/categorias': {
    title: 'Categorias',
    description:
      'Organize os produtos da loja.',
  },
  '/admin/estoque': {
    title: 'Estoque',
    description:
      'Acompanhe quantidades e alertas.',
  },
  '/admin/pedidos': {
    title: 'Pedidos',
    description:
      'Gerencie vendas e entregas.',
  },
  '/admin/cupons': {
    title: 'Cupons',
    description:
      'Crie e acompanhe descontos.',
  },
  '/admin/usuarios': {
    title: 'Usuários',
    description:
      'Gerencie clientes e administradores.',
  },
  '/admin/relatorios': {
    title: 'Relatórios',
    description:
      'Analise o desempenho da loja.',
  },
  '/admin/configuracoes': {
    title: 'Configurações',
    description:
      'Ajuste dados e recursos da loja.',
  },
};

export default function AdminHeader({
  pathname,
  user,
  onOpenMenu,
}) {
  const page = useMemo(
    () => getPageInfo(pathname),
    [pathname]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu administrativo"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-600 hover:text-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xl font-black text-white sm:text-2xl">
              {page.title}
            </p>

            <p className="mt-1 hidden text-sm text-zinc-500 sm:block">
              {page.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="search"
                placeholder="Pesquisar no painel..."
                className="h-11 w-72 rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
          >
            <Bell size={19} />

            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-zinc-900 bg-red-500" />
          </button>

          <div className="hidden items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 sm:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-black text-white">
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0">
              <p className="max-w-36 truncate text-sm font-bold text-white">
                {user?.name || 'Administrador'}
              </p>

              <p className="text-xs text-zinc-500">
                ADMIN
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-900 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium capitalize text-zinc-500">
            {formattedDate}
          </p>

          <p className="text-xs text-zinc-600">
            Painel administrativo Trinity
          </p>
        </div>
      </div>
    </header>
  );
}

function getPageInfo(pathname) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const matchingPath = Object.keys(
    PAGE_TITLES
  )
    .filter((path) => path !== '/admin')
    .find(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`)
    );

  if (matchingPath) {
    return PAGE_TITLES[matchingPath];
  }

  return {
    title: 'Administração',
    description:
      'Gerencie a operação da Trinity.',
  };
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