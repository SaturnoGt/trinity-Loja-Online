'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Search,
} from 'lucide-react';

import ProductGrid from '@/components/home/ProductGrid';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `A API retornou uma resposta inválida. Status ${response.status}.`
    );
  }
}

function normalizeProducts(data) {
  const products =
    data?.products ??
    data?.data ??
    data;

  return Array.isArray(products)
    ? products
    : [];
}

export default function BuscaContent() {
  const searchParams = useSearchParams();

  const query =
    searchParams.get('q')?.trim() || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(
    Boolean(query)
  );
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
          `${API_URL}/products?search=${encodeURIComponent(
            query
          )}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store',
          }
        );

        const data = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível buscar os produtos.'
          );
        }

        setProducts(normalizeProducts(data));
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao buscar produtos:',
          requestError
        );

        setProducts([]);
        setError(
          requestError?.message ||
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
            'Encontre seu próximo produto'
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

      {!query ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/50 px-6 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
            <Search size={26} />
          </div>

          <h2 className="text-xl font-bold text-white">
            Digite algo para pesquisar
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Use a barra de busca para encontrar
            camisetas, moletons, acessórios e outros
            produtos da Trinity.
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
          <AlertCircle
            size={28}
            className="mb-4 text-red-400"
          />

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