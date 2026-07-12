"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6">

      <h1 className="mb-10 text-2xl font-bold">
        Trinity Admin
      </h1>

      <nav className="space-y-3">

        <Link
          href="/admin"
          className="block rounded-lg p-3 transition hover:bg-zinc-800"
        >
          📊 Dashboard
        </Link>

        <Link
          href="/admin/produtos"
          className="block rounded-lg p-3 transition hover:bg-zinc-800"
        >
          📦 Produtos
        </Link>

        <Link
          href="/admin/pedidos"
          className="block rounded-lg p-3 transition hover:bg-zinc-800"
        >
          🛒 Pedidos
        </Link>

        <Link
          href="/admin/usuarios"
          className="block rounded-lg p-3 transition hover:bg-zinc-800"
        >
          👥 Usuários
        </Link>

      </nav>

    </aside>
  );
}