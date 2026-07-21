'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

function formatPrice(price) {
  return Number(price || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ProductCard({ product }) {
  const router = useRouter();

  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const {
    toggleFavorite,
    isFavorite,
  } = useFavorites();

  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  const favorite = isFavorite(product.id);

  const image = useMemo(() => {
    return (
      product.images?.find(
        (img) => img.isMain
      )?.imageUrl ||
      product.images?.[0]?.imageUrl ||
      '/produtos/frente.jpg.jpeg'
    );
  }, [product.images]);

  async function handleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();

    if (authLoading || favoriteLoading) {
      return;
    }

    if (!isAuthenticated) {
      toast.error(
        'Você precisa entrar na sua conta para favoritar produtos.'
      );

      router.push('/login');
      return;
    }

    setFavoriteLoading(true);

    try {
      await toggleFavorite(product);

      toast.success(
        favorite
          ? 'Produto removido dos favoritos.'
          : 'Produto adicionado aos favoritos.'
      );
    } catch (error) {
      console.error(
        'Erro ao atualizar favorito:',
        error
      );

      toast.error(
        error?.message ||
          'Não foi possível atualizar os favoritos.'
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_20px_60px_rgba(255,255,255,0.08)]">
      <span className="absolute left-4 top-4 z-20 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
        NOVO
      </span>

      <button
        type="button"
        onClick={handleFavorite}
        disabled={
          authLoading || favoriteLoading
        }
        aria-busy={favoriteLoading}
        aria-label={
          favorite
            ? `Remover ${product.name} dos favoritos`
            : `Adicionar ${product.name} aos favoritos`
        }
        className={`absolute right-4 top-4 z-20 rounded-full border p-2.5 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 ${
          favorite
            ? 'border-red-500 bg-red-500 text-white'
            : 'border-white/10 bg-black/50 text-white hover:border-white hover:bg-white hover:text-black'
        }`}
      >
        {favoriteLoading ? (
          <Loader2
            size={19}
            aria-hidden="true"
            className="animate-spin"
          />
        ) : (
          <Heart
            size={19}
            aria-hidden="true"
            fill={
              favorite
                ? 'currentColor'
                : 'none'
            }
          />
        )}
      </button>

      <Link
        href={`/produto/${product.id}`}
        className="block h-full"
      >
        <div className="overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            width={700}
            height={700}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="aspect-square w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
          />
        </div>

        <div className="flex h-[240px] flex-col justify-between p-6">
          <div>
            <h3 className="text-lg font-bold transition duration-300 group-hover:text-white">
              {product.name}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
              {product.description ||
                'Sem descrição disponível.'}
            </p>
          </div>

          <div className="border-t border-zinc-800 pt-5">
            <div className="mb-5 text-3xl font-black tracking-tight">
              {formatPrice(product.price)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.25em] text-zinc-500 transition group-hover:text-zinc-300">
                Ver detalhes
              </span>

              <div className="rounded-xl bg-white px-5 py-3 font-bold text-black transition-all duration-300 group-hover:scale-110">
                →
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}