'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Edit3,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  Package,
  RefreshCw,
} from 'lucide-react';

import { useParams } from 'next/navigation';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function normalizeProductId(value) {
  if (Array.isArray(value)) {
    return String(
      value[0] ?? ''
    ).trim();
  }

  return String(
    value ?? ''
  ).trim();
}

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return 'R$ 0,00';
  }

  return price.toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  );
}

function getProductImage(product) {
  const images =
    Array.isArray(product?.images)
      ? product.images
      : [];

  return (
    images.find(
      (image) =>
        image?.isMain &&
        image?.imageUrl
    )?.imageUrl ||
    images.find(
      (image) =>
        image?.imageUrl
    )?.imageUrl ||
    ''
  );
}

async function readResponse(
  response
) {
  const text =
    await response.text();

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

export default function ProdutoAdminDetalhesPage() {
  const params = useParams();

  const productId =
    normalizeProductId(
      params?.id
    );

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadProduct =
    useCallback(
      async (signal) => {
        if (!productId) {
          setError(
            'ID de produto inválido.'
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError('');

          const response =
            await fetch(
              `${API_URL}/products/${encodeURIComponent(
                productId
              )}`,
              {
                method: 'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

                signal,
              }
            );

          const data =
            await readResponse(
              response
            );

          if (
            response.status ===
            404
          ) {
            throw new Error(
              'Produto não encontrado.'
            );
          }

          if (!response.ok) {
            throw new Error(
              data?.message ||
                data?.error ||
                'Não foi possível carregar o produto.'
            );
          }

          setProduct(data);
        } catch (
          requestError
        ) {
          if (
            requestError?.name ===
            'AbortError'
          ) {
            return;
          }

          console.error(
            'Erro ao carregar produto:',
            requestError
          );

          setProduct(null);

          setError(
            requestError?.message ||
              'Não foi possível carregar o produto.'
          );
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
          }
        }
      },
      [productId]
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadProduct(
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [loadProduct]);

  const variations =
    useMemo(() => {
      return Array.isArray(
        product?.variations
      )
        ? product.variations
        : [];
    }, [product]);

  const images =
    useMemo(() => {
      return Array.isArray(
        product?.images
      )
        ? product.images
        : [];
    }, [product]);

  const totalStock =
    useMemo(() => {
      return variations.reduce(
        (
          total,
          variation
        ) => {
          const stock =
            Number(
              variation?.stock
            );

          return (
            total +
            (Number.isFinite(
              stock
            ) && stock > 0
              ? stock
              : 0)
          );
        },
        0
      );
    }, [variations]);

  const lowStock =
    useMemo(() => {
      return variations.filter(
        (variation) => {
          const stock =
            Number(
              variation?.stock
            );

          return (
            stock > 0 &&
            stock <= 5
          );
        }
      ).length;
    }, [variations]);

  const outOfStock =
    useMemo(() => {
      return variations.filter(
        (variation) =>
          Number(
            variation?.stock
          ) === 0
      ).length;
    }, [variations]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          size={36}
          className="animate-spin text-zinc-500"
        />
      </div>
    );
  }

  if (
    error ||
    !product
  ) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center">
        <AlertCircle
          size={42}
          className="mx-auto text-red-400"
        />

        <h1 className="mt-5 text-2xl font-black text-white">
          Não foi possível abrir
          o produto
        </h1>

        <p className="mt-3 text-red-200/70">
          {error ||
            'Produto não encontrado.'}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              loadProduct()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/20 px-5 py-3 font-bold text-white transition hover:bg-red-500/20"
          >
            <RefreshCw
              size={18}
            />

            Tentar novamente
          </button>

          <Link
            href="/admin/produtos"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft
              size={18}
            />

            Voltar para produtos
          </Link>
        </div>
      </section>
    );
  }

  const mainImage =
    getProductImage(product);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/admin/produtos"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft
              size={17}
            />

            Voltar para produtos
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Catálogo
          </p>

          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            {product.name ||
              'Produto'}
          </h1>

          <p className="mt-3 text-zinc-400">
            Consulte as informações
            do produto e acesse as
            ferramentas de gestão.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/produto/${productId}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-bold text-white transition hover:border-white"
          >
            <ExternalLink
              size={18}
            />

            Ver na loja
          </Link>

          <Link
            href="/admin/estoque"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-bold text-white transition hover:border-white"
          >
            <Boxes
              size={18}
            />

            Estoque
          </Link>

          <Link
            href={`/admin/produtos/${productId}/editar`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            <Edit3
              size={18}
            />

            Editar produto
          </Link>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Preço"
          value={formatPrice(
            product.price
          )}
        />

        <MetricCard
          label="Estoque total"
          value={totalStock}
        />

        <MetricCard
          label="Estoque baixo"
          value={lowStock}
        />

        <MetricCard
          label="Sem estoque"
          value={outOfStock}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="aspect-square bg-zinc-950">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={
                  product.name ||
                  'Produto'
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-700">
                <ImageIcon
                  size={60}
                />
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Imagens
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {images.length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <Package
                size={22}
              />

              <h2 className="text-xl font-black text-white">
                Informações do
                produto
              </h2>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <InfoItem
              label="ID"
              value={
                product.id
              }
            />

            <InfoItem
              label="Categoria"
              value={
                product.category ||
                'Sem categoria'
              }
            />

            <InfoItem
              label="Preço"
              value={formatPrice(
                product.price
              )}
            />

            <InfoItem
              label="Variações"
              value={
                variations.length
              }
            />

            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Descrição
              </p>

              <p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">
                {product.description ||
                  'Sem descrição.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">
              Estoque por variação
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Quantidade disponível
              para cada combinação.
            </p>
          </div>

          <Link
            href="/admin/estoque"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition hover:border-white"
          >
            <Boxes
              size={17}
            />

            Gerenciar estoque
          </Link>
        </div>

        {variations.length ===
        0 ? (
          <div className="p-10 text-center text-zinc-500">
            Nenhuma variação
            cadastrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <th className="px-6 py-4">
                    Tamanho
                  </th>

                  <th className="px-6 py-4">
                    Cor
                  </th>

                  <th className="px-6 py-4">
                    Quantidade
                  </th>

                  <th className="px-6 py-4">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {variations.map(
                  (
                    variation,
                    index
                  ) => {
                    const stock =
                      Math.max(
                        0,
                        Number(
                          variation.stock ||
                            0
                        )
                      );

                    return (
                      <tr
                        key={
                          variation.id ||
                          index
                        }
                        className="border-b border-zinc-800/80 last:border-0"
                      >
                        <td className="px-6 py-4 font-bold text-white">
                          {variation.size ||
                            'Único'}
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {variation.color ||
                            'Padrão'}
                        </td>

                        <td className="px-6 py-4 font-black text-white">
                          {stock}
                        </td>

                        <td className="px-6 py-4">
                          <StockBadge
                            stock={
                              stock
                            }
                          />
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-white">
        {value}
      </p>
    </article>
  );
}

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function StockBadge({
  stock,
}) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300">
        Sem estoque
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
        Estoque baixo
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
      Disponível
    </span>
  );
}z