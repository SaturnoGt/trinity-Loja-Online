'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({ product }) {
  const imagem =
    product.images?.find((img) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '/produtos/frente.jpg.jpeg';

  return (
    <Link
      href={`/produto/${product.id}`}
      className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_20px_60px_rgba(255,255,255,0.08)]"
    >
      {/* Badge */}
      <span className="absolute left-4 top-4 z-20 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
        NOVO
      </span>

      {/* Imagem */}
      <div className="overflow-hidden">
        <Image
          src={imagem}
          alt={product.name}
          width={700}
          height={700}
          className="aspect-square w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
        />
      </div>

      {/* Conteúdo */}
      <div className="space-y-5 p-6">

        <div>
          <h3 className="text-lg font-bold transition duration-300 group-hover:text-white">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {product.description}
          </p>
        </div>

        <div className="border-t border-zinc-800 pt-5">

          <div className="mb-5 text-3xl font-black tracking-tight">
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
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
  );
}