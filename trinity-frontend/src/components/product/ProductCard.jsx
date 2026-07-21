'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFavorites } from '@/context/FavoritesContext';

export default function ProductCard({ product }) {
  const { toggleFavorite, isFavorite } = useFavorites();

  const favorite = isFavorite(product.id);

  const imagem =
    product.images?.find((img) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '/produtos/frente.jpg.jpeg';

  async function handleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const added = await toggleFavorite(product);

      if (added) {
        toast.success(
          'Produto adicionado aos favoritos'
        );
      } else {
        toast.success(
          'Produto removido dos favoritos'
        );
      }
    } catch (error) {
      console.error(
        'Erro ao atualizar favorito:',
        error
      );

      toast.error(
        error.message ||
          'Não foi possível atualizar os favoritos'
      );
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition-all duration-500 hover:-translate-y-3 hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/50">
      <div className="relative overflow-hidden">
        <Link
          href={`/produto/${product.id}`}
          aria-label={`Ver produto ${product.name}`}
          className="block"
        >
          <Image
            src={imagem}
            alt={product.name}
            width={700}
            height={700}
            className="aspect-square w-full object-cover transition duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
            NEW
          </span>

          <div className="absolute bottom-5 left-1/2 w-[85%] -translate-x-1/2 translate-y-24 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 font-bold text-black">
              Comprar
              <ArrowRight size={18} />
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleFavorite}
          aria-label={
            favorite
              ? `Remover ${product.name} dos favoritos`
              : `Adicionar ${product.name} aos favoritos`
          }
          className={`absolute right-4 top-4 z-10 rounded-full border p-2.5 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 ${
            favorite
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-white/10 bg-black/40 text-white hover:border-white hover:bg-white hover:text-black'
          }`}
        >
          <Heart
            size={19}
            fill={favorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <Link
        href={`/produto/${product.id}`}
        className="block space-y-4 p-6"
      >
        <h3 className="text-lg font-bold transition group-hover:text-white">
          {product.name}
        </h3>

        <p className="line-clamp-2 text-sm leading-6 text-zinc-400">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-4">
          <span className="text-2xl font-black">
            R${' '}
            {Number(product.price)
              .toFixed(2)
              .replace('.', ',')}
          </span>

          <span className="whitespace-nowrap text-sm text-zinc-500 transition group-hover:text-white">
            Ver →
          </span>
        </div>
      </Link>
    </article>
  );
}