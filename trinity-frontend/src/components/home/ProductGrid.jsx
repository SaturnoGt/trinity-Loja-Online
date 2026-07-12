'use client';

import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  loading,
}) {
  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        Carregando produtos...
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-24 text-center text-zinc-500">
        Nenhum produto encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}