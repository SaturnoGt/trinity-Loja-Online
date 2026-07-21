'use client';

import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

export default function EstoquePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error(
            'NEXT_PUBLIC_API_URL não configurada.'
          );
        }

        const token = getStoredToken();

        const response = await fetch(
          `${apiUrl}/products`,
          {
            cache: 'no-store',
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            data?.message ||
              'Erro ao carregar produtos.'
          );
        }

        const data = await response.json();

        setProducts(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          'Erro ao carregar estoque:',
          err
        );

        setError(
          err.message ||
            'Não foi possível carregar o estoque.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stockRows = useMemo(() => {
    return products.flatMap((product) => {
      const variations = Array.isArray(
        product.variations
      )
        ? product.variations
        : [];

      if (variations.length === 0) {
        return [
          {
            id: `product-${product.id}`,
            productId: product.id,
            productName: product.name,
            category:
              product.category || 'Sem categoria',
            size: 'Sem variação',
            color: 'Sem variação',
            stock: 0,
          },
        ];
      }

      return variations.map((variation) => ({
        id: variation.id,
        productId: product.id,
        productName: product.name,
        category:
          product.category || 'Sem categoria',
        size: variation.size || 'Único',
        color: variation.color || 'Padrão',
        stock: Number(variation.stock || 0),
      }));
    });
  }, [products]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return stockRows;
    }

    return stockRows.filter((row) =>
      [
        row.productName,
        row.category,
        row.size,
        row.color,
      ].some((value) =>
        String(value)
          .toLowerCase()
          .includes(normalizedSearch)
      )
    );
  }, [search, stockRows]);

  const totalUnits = stockRows.reduce(
    (total, row) => total + row.stock,
    0
  );

  const lowStock = stockRows.filter(
    (row) => row.stock > 0 && row.stock <= 5
  ).length;

  const outOfStock = stockRows.filter(
    (row) => row.stock === 0
  ).length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                Operação
              </p>

              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Controle de estoque
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                Acompanhe as quantidades disponíveis
                de cada produto, tamanho e cor.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadProducts({ refresh: true })
              }
              disabled={loading || refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              {refreshing
                ? 'Atualizando...'
                : 'Atualizar estoque'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
          <AlertCircle size={20} />

          <p className="text-sm font-bold">
            {error}
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Produtos"
          value={products.length}
          icon={Package}
        />

        <MetricCard
          label="Variações"
          value={stockRows.length}
          icon={Boxes}
        />

        <MetricCard
          label="Unidades disponíveis"
          value={totalUnits}
          icon={Boxes}
        />

        <MetricCard
          label="Alertas"
          value={lowStock + outOfStock}
          icon={AlertTriangle}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-white">
              Inventário
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {filteredRows.length} registros
              encontrados.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar produto, tamanho ou cor"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-zinc-800/70"
                />
              )
            )}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <Boxes
              size={34}
              className="text-zinc-600"
            />

            <h3 className="mt-4 font-bold text-white">
              Nenhum item encontrado
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Cadastre produtos e variações para
              preencher o estoque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">
                    Produto
                  </th>
                  <th className="px-6 py-4">
                    Categoria
                  </th>
                  <th className="px-6 py-4">
                    Tamanho
                  </th>
                  <th className="px-6 py-4">
                    Cor
                  </th>
                  <th className="px-6 py-4">
                    Estoque
                  </th>
                  <th className="px-6 py-4">
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/80 text-sm last:border-0 hover:bg-zinc-800/30"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/produtos`}
                        className="font-bold text-white hover:text-zinc-300"
                      >
                        {row.productName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-zinc-400">
                      {row.category}
                    </td>

                    <td className="px-6 py-4 text-zinc-400">
                      {row.size}
                    </td>

                    <td className="px-6 py-4 text-zinc-400">
                      {row.color}
                    </td>

                    <td className="px-6 py-4 font-black text-white">
                      {row.stock}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge
                        stock={row.stock}
                      />
                    </td>
                  </tr>
                ))}
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
  icon: Icon,
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black text-white">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
        Sem estoque
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
        Estoque baixo
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
      Disponível
    </span>
  );
}