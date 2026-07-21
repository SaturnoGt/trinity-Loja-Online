'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import ProductGrid from '@/components/home/ProductGrid';
import { useFavorites } from '@/context/FavoritesContext';

export default function FavoritosPage() {
  const { favorites } = useFavorites();

  const favoriteProducts = Array.isArray(favorites)
    ? favorites
    : [];

  const totalFavorites = favoriteProducts.length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Sua seleção
          </p>

          <h1 className="text-4xl font-black text-white">
            Favoritos
          </h1>

          <p className="mt-2 text-zinc-400">
            Seus produtos salvos em um só lugar.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          <Heart
            size={16}
            aria-hidden="true"
            fill={
              totalFavorites > 0
                ? 'currentColor'
                : 'none'
            }
          />

          {totalFavorites}{' '}
          {totalFavorites === 1
            ? 'produto'
            : 'produtos'}
        </span>
      </div>

      {totalFavorites === 0 ? (
        <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-20 text-center sm:py-24">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
            <Heart
              size={30}
              aria-hidden="true"
            />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            Nenhum favorito ainda
          </h2>

          <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-500">
            Salve seus produtos preferidos para encontrá-los
            rapidamente depois.
          </p>

          <Link
            href="/#produtos"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-105 hover:bg-zinc-200 active:scale-95"
          >
            Explorar produtos
          </Link>
        </section>
      ) : (
        <ProductGrid
          products={favoriteProducts}
          loading={false}
        />
      )}
    </main>
  );
}