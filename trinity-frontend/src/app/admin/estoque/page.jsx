'use client';

import Link from 'next/link';

import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Check,
  LoaderCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import toast from 'react-hot-toast';

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

function normalizeStock(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(parsed)
  );
}

export default function EstoquePage() {
  const [products, setProducts] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [draftStock, setDraftStock] =
    useState({});

  const [savingIds, setSavingIds] =
    useState({});

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
          process.env
            .NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error(
            'NEXT_PUBLIC_API_URL não configurada.'
          );
        }

        const token =
          getStoredToken();

        const response =
          await fetch(
            `${apiUrl}/products`,
            {
              cache: 'no-store',
              headers: token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {},
            }
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            data?.message ||
              'Erro ao carregar produtos.'
          );
        }

        const data =
          await response.json();

        const normalizedProducts =
          Array.isArray(data)
            ? data
            : [];

        setProducts(
          normalizedProducts
        );

        const nextDraft = {};

        normalizedProducts.forEach(
          (product) => {
            const variations =
              Array.isArray(
                product.variations
              )
                ? product.variations
                : [];

            variations.forEach(
              (variation) => {
                nextDraft[
                  variation.id
                ] = normalizeStock(
                  variation.stock
                );
              }
            );
          }
        );

        setDraftStock(
          nextDraft
        );
      } catch (err) {
        console.error(
          'Erro ao carregar estoque:',
          err
        );

        setError(
          err?.message ||
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

  const stockRows =
    useMemo(() => {
      return products.flatMap(
        (product) => {
          const variations =
            Array.isArray(
              product.variations
            )
              ? product.variations
              : [];

          if (
            variations.length === 0
          ) {
            return [
              {
                id:
                  `product-${product.id}`,
                variationId: null,
                productId:
                  product.id,
                productName:
                  product.name,
                category:
                  product.category ||
                  'Sem categoria',
                size:
                  'Sem variação',
                color:
                  'Sem variação',
                stock: 0,
              },
            ];
          }

          return variations.map(
            (variation) => ({
              id: variation.id,
              variationId:
                variation.id,
              productId:
                product.id,
              productName:
                product.name,
              category:
                product.category ||
                'Sem categoria',
              size:
                variation.size ||
                'Único',
              color:
                variation.color ||
                'Padrão',
              stock:
                normalizeStock(
                  variation.stock
                ),
            })
          );
        }
      );
    }, [products]);

  const filteredRows =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return stockRows;
      }

      return stockRows.filter(
        (row) =>
          [
            row.productName,
            row.category,
            row.size,
            row.color,
          ].some((value) =>
            String(value)
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          )
      );
    }, [search, stockRows]);

  const totalUnits =
    stockRows.reduce(
      (total, row) =>
        total + row.stock,
      0
    );

  const lowStock =
    stockRows.filter(
      (row) =>
        row.stock > 0 &&
        row.stock <= 5
    ).length;

  const outOfStock =
    stockRows.filter(
      (row) =>
        row.stock === 0
    ).length;

  function changeDraftStock(
    variationId,
    value
  ) {
    if (!variationId) {
      return;
    }

    setDraftStock(
      (current) => ({
        ...current,
        [variationId]:
          normalizeStock(value),
      })
    );
  }

  function incrementStock(
    variationId
  ) {
    if (!variationId) {
      return;
    }

    setDraftStock(
      (current) => ({
        ...current,
        [variationId]:
          normalizeStock(
            current[
              variationId
            ] || 0
          ) + 1,
      })
    );
  }

  function decrementStock(
    variationId
  ) {
    if (!variationId) {
      return;
    }

    setDraftStock(
      (current) => ({
        ...current,
        [variationId]:
          Math.max(
            0,
            normalizeStock(
              current[
                variationId
              ] || 0
            ) - 1
          ),
      })
    );
  }

  function isStockChanged(
    row
  ) {
    if (!row.variationId) {
      return false;
    }

    return (
      normalizeStock(
        draftStock[
          row.variationId
        ]
      ) !==
      normalizeStock(row.stock)
    );
  }

  async function saveStock(
    row
  ) {
    if (!row.variationId) {
      toast.error(
        'Este produto não possui uma variação editável.'
      );

      return;
    }

    const apiUrl =
      process.env
        .NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      toast.error(
        'NEXT_PUBLIC_API_URL não configurada.'
      );

      return;
    }

    const token =
      getStoredToken();

    if (!token) {
      toast.error(
        'Sua sessão não foi encontrada.'
      );

      return;
    }

    const stock =
      normalizeStock(
        draftStock[
          row.variationId
        ]
      );

    try {
      setSavingIds(
        (current) => ({
          ...current,
          [row.variationId]:
            true,
        })
      );

      const response =
        await fetch(
          `${apiUrl}/products/variations/${row.variationId}/stock`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              stock,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Não foi possível atualizar o estoque.'
        );
      }

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) => ({
              ...product,

              variations:
                Array.isArray(
                  product.variations
                )
                  ? product.variations.map(
                      (
                        variation
                      ) =>
                        variation.id ===
                        row.variationId
                          ? {
                              ...variation,
                              stock:
                                data
                                  ?.variation
                                  ?.stock ??
                                stock,
                            }
                          : variation
                    )
                  : [],
            })
          )
      );

      setDraftStock(
        (current) => ({
          ...current,
          [row.variationId]:
            data?.variation
              ?.stock ??
            stock,
        })
      );

      toast.success(
        `Estoque de ${row.productName} atualizado.`
      );
    } catch (err) {
      console.error(
        'Erro ao salvar estoque:',
        err
      );

      toast.error(
        err?.message ||
          'Não foi possível salvar o estoque.'
      );
    } finally {
      setSavingIds(
        (current) => ({
          ...current,
          [row.variationId]:
            false,
        })
      );
    }
  }

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
                Consulte, reponha e
                corrija o estoque de
                cada variação sem
                precisar editar o
                produto inteiro.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadProducts({
                  refresh: true,
                })
              }
              disabled={
                loading ||
                refreshing
              }
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
                : 'Atualizar dados'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
          <AlertCircle
            size={20}
          />

          <p className="text-sm font-bold">
            {error}
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Produtos"
          value={
            products.length
          }
          icon={Package}
        />

        <MetricCard
          label="Variações"
          value={
            stockRows.length
          }
          icon={Boxes}
        />

        <MetricCard
          label="Unidades disponíveis"
          value={totalUnits}
          icon={Boxes}
        />

        <MetricCard
          label="Alertas"
          value={
            lowStock +
            outOfStock
          }
          icon={
            AlertTriangle
          }
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-white">
              Inventário
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                filteredRows.length
              }{' '}
              registros
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
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Buscar produto, tamanho ou cor"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl bg-zinc-800/70"
                />
              )
            )}
          </div>
        ) : filteredRows.length ===
          0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <Boxes
              size={34}
              className="text-zinc-600"
            />

            <h3 className="mt-4 font-bold text-white">
              Nenhum item
              encontrado
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Cadastre produtos
              e variações para
              preencher o estoque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
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

                  <th className="px-6 py-4 text-right">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map(
                  (row) => {
                    const editingStock =
                      row
                        .variationId
                        ? normalizeStock(
                            draftStock[
                              row
                                .variationId
                            ]
                          )
                        : 0;

                    const saving =
                      Boolean(
                        savingIds[
                          row
                            .variationId
                        ]
                      );

                    const changed =
                      isStockChanged(
                        row
                      );

                    return (
                      <tr
                        key={
                          row.id
                        }
                        className="border-b border-zinc-800/80 text-sm last:border-0 hover:bg-zinc-800/30"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/produtos/${row.productId}`}
                            className="font-bold text-white hover:text-zinc-300"
                          >
                            {
                              row.productName
                            }
                          </Link>
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {
                            row.category
                          }
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {
                            row.size
                          }
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {
                            row.color
                          }
                        </td>

                        <td className="px-6 py-4">
                          {row.variationId ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  decrementStock(
                                    row.variationId
                                  )
                                }
                                disabled={
                                  saving ||
                                  editingStock <=
                                    0
                                }
                                aria-label={`Diminuir estoque de ${row.productName}`}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Minus
                                  size={
                                    16
                                  }
                                />
                              </button>

                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  editingStock
                                }
                                onChange={(
                                  event
                                ) =>
                                  changeDraftStock(
                                    row.variationId,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="h-10 w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-center font-black text-white outline-none transition focus:border-white disabled:opacity-50"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  incrementStock(
                                    row.variationId
                                  )
                                }
                                disabled={
                                  saving
                                }
                                aria-label={`Aumentar estoque de ${row.productName}`}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-500">
                              Sem
                              variação
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <StockBadge
                            stock={
                              row
                                .variationId
                                ? editingStock
                                : row.stock
                            }
                          />
                        </td>

                        <td className="px-6 py-4 text-right">
                          {row.variationId ? (
                            <button
                              type="button"
                              onClick={() =>
                                saveStock(
                                  row
                                )
                              }
                              disabled={
                                saving ||
                                !changed
                              }
                              className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                changed
                                  ? 'bg-white text-black hover:bg-zinc-200'
                                  : 'border border-zinc-800 bg-zinc-900 text-zinc-500'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {saving ? (
                                <>
                                  <LoaderCircle
                                    size={
                                      16
                                    }
                                    className="animate-spin"
                                  />
                                  Salvando
                                </>
                              ) : changed ? (
                                <>
                                  <Save
                                    size={
                                      16
                                    }
                                  />
                                  Salvar
                                </>
                              ) : (
                                <>
                                  <Check
                                    size={
                                      16
                                    }
                                  />
                                  Salvo
                                </>
                              )}
                            </button>
                          ) : null}
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

function StockBadge({
  stock,
}) {
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