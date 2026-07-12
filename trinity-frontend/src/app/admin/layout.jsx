"use client";

import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">

      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6">

        <h1 className="mb-10 text-2xl font-bold">
          Trinity Admin
        </h1>

        <nav className="space-y-3">

          <Link
            href="/admin"
            className="block rounded-lg px-4 py-3 hover:bg-zinc-800"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/produtos"
            className="block rounded-lg px-4 py-3 hover:bg-zinc-800"
          >
            Produtos
          </Link>

          <Link
            href="/admin/pedidos"
            className="block rounded-lg px-4 py-3 hover:bg-zinc-800"
          >
            Pedidos
          </Link>

          <Link
            href="/admin/usuarios"
            className="block rounded-lg px-4 py-3 hover:bg-zinc-800"
          >
            Usuários
          </Link>

        </nav>

      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  );
}