'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import ProductGrid from '@/components/home/ProductGrid';

export default function BuscaContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get('q')?.trim() || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function buscarProdutos() {
      if (!query) {
        setProducts([]);
        setLoading(false);
        setError('');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products?search=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Erro ao buscar produtos: ${response.status}`
          );
        }

        const data = await response.json();

        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name === 'AbortError') return;

        console.error('Erro ao buscar produtos:', error);

        setProducts([]);
        setError(
          'Não foi possível carregar os resultados da busca.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    buscarProdutos();

    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Busca
        </p>

        <h1 className="text-3xl font-bold sm:text-4xl">
          {query ? (
            <>
              Resultados para{' '}
              <span className="text-zinc-400">
                “{query}”
              </span>
            </>
          ) : (
            'Digite um produto para pesquisar'
          )}
        </h1>

        {!loading && query && !error && (
          <p className="mt-3 text-sm text-zinc-500">
            {products.length}{' '}
            {products.length === 1
              ? 'produto encontrado'
              : 'produtos encontrados'}
          </p>
        )}
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
          <p className="font-semibold text-red-400">
            {error}
          </p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          loading={loading}
        />
      )}
    </main>
  );
}