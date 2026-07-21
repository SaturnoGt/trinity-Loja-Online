'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  Boxes,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function normalizeId(value) {
  return String(value ?? '');
}

function formatPrice(value) {
  const price = Number(value);

  return Number.isFinite(price)
    ? price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00';
}

function getProductImage(product) {
  if (!Array.isArray(product?.images)) {
    return '/produtos/trinity/frente.jpeg';
  }

  return (
    product.images.find(
      (image) => image?.isMain
    )?.imageUrl ||
    product.images.find(
      (image) => image?.imageUrl
    )?.imageUrl ||
    '/produtos/trinity/frente.jpeg'
  );
}

function getTotalStock(product) {
  if (!Array.isArray(product?.variations)) {
    return 0;
  }

  return product.variations.reduce(
    (total, variation) => {
      const stock = Number(variation?.stock);

      return (
        total +
        (Number.isFinite(stock) && stock > 0
          ? stock
          : 0)
      );
    },
    0
  );
}

function normalizeProducts(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : [];

  return list.filter(
    (product) =>
      product &&
      product.id !== undefined &&
      product.id !== null
  );
}

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

export default function ProdutosAdminPage() {
  const {
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState(null);
  const [error, setError] = useState('');

  const loadProducts = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/products`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-store',
            signal,
          }
        );

        const data = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar os produtos.'
          );
        }

        setProducts(normalizeProducts(data));
      } catch (requestError) {
        if (requestError.name === 'AbortError') {
          return;
        }

        console.error(
          'Erro ao carregar produtos:',
          requestError
        );

        setProducts([]);
        setError(
          requestError.message ||
            'Não foi possível carregar os produtos.'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    loadProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = [
        product.id,
        product.name,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [products, search]);

  const metrics = useMemo(() => {
    const totalStock = products.reduce(
      (total, product) =>
        total + getTotalStock(product),
      0
    );

    const outOfStock = products.filter(
      (product) => getTotalStock(product) === 0
    ).length;

    const lowStock = products.filter(
      (product) => {
        const stock = getTotalStock(product);

        return stock > 0 && stock <= 5;
      }
    ).length;

    return {
      total: products.length,
      totalStock,
      outOfStock,
      lowStock,
    };
  }, [products]);

  const handleDelete = useCallback(
    async (product) => {
      if (!token) {
        toast.error(
          'Sua sessão não foi encontrada. Faça login novamente.'
        );
        return;
      }

      const normalizedProductId = normalizeId(
        product.id
      );

      const confirmed = window.confirm(
        `Deseja realmente excluir "${product.name || 'este produto'}"?\n\nEssa ação não poderá ser desfeita.`
      );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(normalizedProductId);
        setError('');

        const response = await fetch(
          `${API_URL}/products/${product.id}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await readResponse(response);

        if (response.status === 401) {
          logout();

          throw new Error(
            'Sua sessão expirou. Entre novamente.'
          );
        }

        if (response.status === 403) {
          throw new Error(
            'Você não possui permissão para excluir produtos.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível excluir o produto.'
          );
        }

        setProducts((currentProducts) =>
          currentProducts.filter(
            (item) =>
              normalizeId(item.id) !==
              normalizedProductId
          )
        );

        toast.success(
          'Produto excluído com sucesso.'
        );
      } catch (requestError) {
        console.error(
          'Erro ao excluir produto:',
          requestError
        );

        const message =
          requestError.message ||
          'Não foi possível excluir o produto.';

        setError(message);
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [logout, token]
  );

  function handleClearSearch() {
    setSearch('');
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="text-4xl font-black">
            Produtos
          </h1>

          <p className="mt-3 text-zinc-400">
            Cadastre, edite e acompanhe o estoque
            dos produtos da loja.
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          <Plus size={19} />
          Novo produto
        </Link>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Produtos"
          value={metrics.total}
        />

        <MetricCard
          label="Itens em estoque"
          value={metrics.totalStock}
        />

        <MetricCard
          label="Estoque baixo"
          value={metrics.lowStock}
        />

        <MetricCard
          label="Sem estoque"
          value={metrics.outOfStock}
        />
      </section>

      <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar por nome, categoria ou descrição..."
            aria-label="Buscar produtos"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-zinc-500">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? 'produto'
              : 'produtos'}
          </span>

          {search.trim() ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Limpar busca
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => loadProducts()}
            disabled={loading}
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-300 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Atualizar produtos"
            title="Atualizar produtos"
          >
            <RefreshCw
              size={18}
              className={
                loading ? 'animate-spin' : ''
              }
            />
          </button>
        </div>
      </section>

      {error ? (
        <ProductsError
          error={error}
          onRetry={() => loadProducts()}
        />
      ) : loading || authLoading ? (
        <ProductsLoading />
      ) : filteredProducts.length === 0 ? (
        <EmptyProducts
          hasSearch={Boolean(search.trim())}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="hidden grid-cols-[90px_1.5fr_1fr_140px_120px_150px] gap-4 border-b border-zinc-800 px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 lg:grid">
            <span>Imagem</span>
            <span>Produto</span>
            <span>Categoria</span>
            <span>Preço</span>
            <span>Estoque</span>

            <span className="text-right">
              Ações
            </span>
          </div>

          <div className="divide-y divide-zinc-800">
            {filteredProducts.map((product) => {
              const productId =
                normalizeId(product.id);

              const stock =
                getTotalStock(product);

              const image =
                getProductImage(product);

              const deleting =
                deletingId === productId;

              return (
                <article
                  key={productId}
                  className="grid gap-5 p-5 transition hover:bg-zinc-800/40 lg:grid-cols-[90px_1.5fr_1fr_140px_120px_150px] lg:items-center lg:px-6"
                >
                  <img
                    src={image}
                    alt={
                      product.name ||
                      'Imagem do produto'
                    }
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src =
                        '/produtos/trinity/frente.jpeg';
                    }}
                    className="h-20 w-20 rounded-2xl bg-zinc-800 object-cover"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">
                      {product.name ||
                        'Produto sem nome'}
                    </p>

                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                      {product.description ||
                        'Sem descrição'}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:hidden">
                      Categoria
                    </p>

                    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300">
                      {product.category ||
                        'Sem categoria'}
                    </span>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:hidden">
                      Preço
                    </p>

                    <p className="font-bold text-white">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:hidden">
                      Estoque
                    </p>

                    <StockBadge stock={stock} />
                  </div>

                  <div className="flex gap-2 lg:justify-end">
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-300 transition hover:border-white hover:text-white"
                      aria-label={`Editar ${
                        product.name ||
                        'produto'
                      }`}
                      title="Editar produto"
                    >
                      <Edit3 size={18} />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product)
                      }
                      disabled={deleting}
                      className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Excluir ${
                        product.name ||
                        'produto'
                      }`}
                      title="Excluir produto"
                    >
                      {deleting ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function StockBadge({ stock }) {
  let className =
    'border-red-500/30 bg-red-500/10 text-red-400';

  if (stock > 5) {
    className =
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  } else if (stock > 0) {
    className =
      'border-amber-500/30 bg-amber-500/10 text-amber-400';
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${className}`}
    >
      {stock > 0
        ? `${stock} em estoque`
        : 'Sem estoque'}
    </span>
  );
}

function ProductsError({ error, onRetry }) {
  return (
    <section
      role="alert"
      className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center"
    >
      <AlertCircle
        size={38}
        className="mx-auto text-red-400"
      />

      <h2 className="mt-4 text-xl font-bold">
        Não foi possível carregar os produtos
      </h2>

      <p className="mt-2 text-sm text-red-200/70">
        {error}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
      >
        <RefreshCw size={18} />
        Tentar novamente
      </button>
    </section>
  );
}

function EmptyProducts({ hasSearch }) {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
        <Boxes size={30} />
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {hasSearch
          ? 'Nenhum produto encontrado'
          : 'Nenhum produto cadastrado'}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        {hasSearch
          ? 'Tente buscar por outro nome, categoria ou descrição.'
          : 'Cadastre o primeiro produto para começar a montar o catálogo.'}
      </p>

      {!hasSearch ? (
        <Link
          href="/admin/produtos/novo"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          <Plus size={18} />
          Cadastrar produto
        </Link>
      ) : null}
    </section>
  );
}

function ProductsLoading() {
  return (
    <div
      className="space-y-4"
      aria-label="Carregando produtos"
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900"
        />
      ))}
    </div>
  );
}