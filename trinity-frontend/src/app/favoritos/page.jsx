'use client';

import Link from 'next/link';

import ProductGrid from '@/components/home/ProductGrid';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritosPage() {
  const { favorites } = useFavorites();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-20 sm:px-6 lg:px-8">

      <div className="mb-12 flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-black">
            Favoritos
          </h1>

          <p className="mt-2 text-zinc-400">
            Seus produtos salvos.
          </p>
        </div>

        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm">
          {favorites.length}{' '}
          {favorites.length === 1
            ? 'produto'
            : 'produtos'}
        </span>

      </div>

      {favorites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 py-24 text-center">

          <h2 className="mb-3 text-2xl font-bold">
            Nenhum favorito ainda ❤️
          </h2>

          <p className="mb-8 text-zinc-500">
            Salve seus produtos preferidos para encontrá-los depois.
          </p>

          <Link
            href="/"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            Explorar produtos
          </Link>

        </div>
      ) : (
        <ProductGrid
          products={favorites}
          loading={false}
        />
      )}

    </main>
  );
}