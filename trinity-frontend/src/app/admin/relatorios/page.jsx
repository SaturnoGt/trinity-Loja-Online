'use client';

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const INITIAL_DASHBOARD = {
  products: 0,
  users: 0,
  orders: 0,
  revenue: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
  productsWithoutImage: 0,
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendentes',
    icon: Clock3,
  },
  PAID: {
    label: 'Pagos',
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: 'Em preparação',
    icon: PackageCheck,
  },
  SHIPPED: {
    label: 'Enviados',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Entregues',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelados',
    icon: XCircle,
  },
  REFUNDED: {
    label: 'Reembolsados',
    icon: XCircle,
  },
};

const REVENUE_STATUSES = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

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

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(
    Number(value || 0)
  );
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  return `${year}-${month}`;
}

function getLastMonths(amount = 6) {
  const months = [];
  const today = new Date();

  for (let index = amount - 1; index >= 0; index--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - index,
      1
    );

    months.push({
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
      })
        .format(date)
        .replace('.', ''),
    });
  }

  return months;
}

export default function RelatoriosPage() {
  const [dashboard, setDashboard] = useState(
    INITIAL_DASHBOARD
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(
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

        if (!token) {
          throw new Error(
            'Token de autenticação não encontrado.'
          );
        }

        const options = {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const [
          dashboardResponse,
          ordersResponse,
        ] = await Promise.all([
          fetch(
            `${apiUrl}/orders/dashboard`,
            options
          ),
          fetch(`${apiUrl}/orders/admin`, options),
        ]);

        if (
          dashboardResponse.status === 401 ||
          ordersResponse.status === 401
        ) {
          throw new Error(
            'Sua sessão expirou. Entre novamente.'
          );
        }

        if (
          dashboardResponse.status === 403 ||
          ordersResponse.status === 403
        ) {
          throw new Error(
            'Você não possui permissão para acessar os relatórios.'
          );
        }

        if (!dashboardResponse.ok) {
          const responseData =
            await dashboardResponse
              .json()
              .catch(() => null);

          throw new Error(
            responseData?.message ||
              'Erro ao carregar os indicadores.'
          );
        }

        if (!ordersResponse.ok) {
          const responseData =
            await ordersResponse
              .json()
              .catch(() => null);

          throw new Error(
            responseData?.message ||
              'Erro ao carregar os pedidos.'
          );
        }

        const [
          dashboardData,
          ordersData,
        ] = await Promise.all([
          dashboardResponse.json(),
          ordersResponse.json(),
        ]);

        setDashboard({
          products: Number(
            dashboardData?.products || 0
          ),
          users: Number(
            dashboardData?.users || 0
          ),
          orders: Number(
            dashboardData?.orders || 0
          ),
          revenue: Number(
            dashboardData?.revenue || 0
          ),
          pendingOrders: Number(
            dashboardData?.pendingOrders || 0
          ),
          lowStockProducts: Number(
            dashboardData?.lowStockProducts || 0
          ),
          productsWithoutImage: Number(
            dashboardData?.productsWithoutImage ||
              0
          ),
        });

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );
      } catch (err) {
        console.error(
          'Erro ao carregar relatórios:',
          err
        );

        setError(
          err.message ||
            'Não foi possível carregar os relatórios.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const confirmedOrders = useMemo(
    () =>
      orders.filter((order) =>
        REVENUE_STATUSES.includes(order.status)
      ),
    [orders]
  );

  const averageTicket = useMemo(() => {
    if (confirmedOrders.length === 0) {
      return 0;
    }

    const total = confirmedOrders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    return total / confirmedOrders.length;
  }, [confirmedOrders]);

  const cancellationRate = useMemo(() => {
    if (orders.length === 0) {
      return 0;
    }

    const cancelledOrders = orders.filter(
      (order) =>
        order.status === 'CANCELLED' ||
        order.status === 'REFUNDED'
    ).length;

    return (
      (cancelledOrders / orders.length) *
      100
    );
  }, [orders]);

  const statusReport = useMemo(() => {
    return Object.entries(STATUS_CONFIG).map(
      ([status, config]) => ({
        status,
        ...config,
        total: orders.filter(
          (order) => order.status === status
        ).length,
      })
    );
  }, [orders]);

  const monthlyRevenue = useMemo(() => {
    const months = getLastMonths(6);

    return months.map((month) => {
      const value = confirmedOrders
        .filter((order) => {
          if (!order.createdAt) {
            return false;
          }

          const orderDate = new Date(
            order.createdAt
          );

          return (
            getMonthKey(orderDate) === month.key
          );
        })
        .reduce(
          (sum, order) =>
            sum + Number(order.total || 0),
          0
        );

      return {
        ...month,
        value,
      };
    });
  }, [confirmedOrders]);

  const maximumMonthlyRevenue = useMemo(
    () =>
      Math.max(
        ...monthlyRevenue.map(
          (month) => month.value
        ),
        1
      ),
    [monthlyRevenue]
  );

  const topCustomers = useMemo(() => {
    const customerMap = new Map();

    for (const order of confirmedOrders) {
      const customerId =
        order.user?.id ||
        order.user?.email ||
        'desconhecido';

      const customerName =
        order.user?.name ||
        order.user?.email ||
        'Cliente não identificado';

      const existingCustomer =
        customerMap.get(customerId);

      if (existingCustomer) {
        existingCustomer.orders += 1;
        existingCustomer.total += Number(
          order.total || 0
        );

        continue;
      }

      customerMap.set(customerId, {
        id: customerId,
        name: customerName,
        email: order.user?.email || '',
        orders: 1,
        total: Number(order.total || 0),
      });
    }

    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [confirmedOrders]);

  const metrics = [
    {
      label: 'Receita confirmada',
      value: formatCurrency(
        dashboard.revenue
      ),
      description:
        'Pedidos pagos ou em andamento',
      icon: CircleDollarSign,
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(averageTicket),
      description:
        'Média por pedido confirmado',
      icon: TrendingUp,
    },
    {
      label: 'Pedidos confirmados',
      value: formatNumber(
        confirmedOrders.length
      ),
      description:
        'Pedidos que geraram receita',
      icon: ShoppingBag,
    },
    {
      label: 'Taxa de cancelamento',
      value: `${cancellationRate.toFixed(
        1
      )}%`,
      description:
        'Cancelados ou reembolsados',
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                Relatórios
              </p>

              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Desempenho da Trinity
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                Acompanhe faturamento, pedidos,
                clientes e o desempenho geral da
                loja.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadReports({
                  refresh: true,
                })
              }
              disabled={loading || refreshing}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                : 'Atualizar relatório'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <section className="flex gap-3 rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0 text-red-300"
          />

          <div>
            <p className="font-bold text-red-200">
              Não foi possível carregar os
              relatórios
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {error}
            </p>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map(
              (_, index) => (
                <MetricSkeleton key={index} />
              )
            )
          : metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <article
                  key={metric.label}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        {metric.label}
                      </p>

                      <p className="mt-3 text-3xl font-black text-white">
                        {metric.value}
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        {metric.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-300">
                      <Icon size={22} />
                    </div>
                  </div>
                </article>
              );
            })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
              <BarChart3 size={21} />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Receita dos últimos 6 meses
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Valores de pedidos confirmados.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-800/70" />
          ) : (
            <div className="mt-8 flex h-64 items-end gap-3">
              {monthlyRevenue.map((month) => {
                const height = Math.max(
                  (month.value /
                    maximumMonthlyRevenue) *
                    100,
                  month.value > 0 ? 8 : 2
                );

                return (
                  <div
                    key={month.key}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div className="mb-3 text-center text-xs font-bold text-zinc-400">
                      {month.value > 0
                        ? formatCurrency(month.value)
                        : 'R$ 0'}
                    </div>

                    <div className="flex h-44 items-end rounded-2xl bg-zinc-950/70 p-2">
                      <div
                        className="w-full rounded-xl bg-white transition-all"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-center text-xs font-bold uppercase text-zinc-500">
                      {month.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="font-bold text-white">
              Pedidos por status
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Distribuição dos pedidos da loja.
            </p>
          </div>

          <div className="space-y-3 p-5">
            {loading
              ? Array.from({ length: 5 }).map(
                  (_, index) => (
                    <RowSkeleton key={index} />
                  )
                )
              : statusReport.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-400">
                          <Icon size={18} />
                        </div>

                        <p className="text-sm font-bold text-white">
                          {item.label}
                        </p>
                      </div>

                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-zinc-300">
                        {item.total}
                      </span>
                    </div>
                  );
                })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="font-bold text-white">
              Melhores clientes
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Clientes com maior valor em compras
              confirmadas.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <RowSkeleton key={index} />
                )
              )}
            </div>
          ) : topCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente no relatório"
              description="Os clientes aparecerão após os primeiros pedidos confirmados."
            />
          ) : (
            <div className="divide-y divide-zinc-800">
              {topCustomers.map(
                (customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-zinc-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {customer.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {customer.orders}{' '}
                          {customer.orders === 1
                            ? 'pedido'
                            : 'pedidos'}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 font-black text-white">
                      {formatCurrency(
                        customer.total
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="font-bold text-white">
              Resumo da operação
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Visão rápida da estrutura da loja.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <SummaryItem
              label="Produtos cadastrados"
              value={dashboard.products}
            />

            <SummaryItem
              label="Clientes cadastrados"
              value={dashboard.users}
            />

            <SummaryItem
              label="Pedidos registrados"
              value={dashboard.orders}
            />

            <SummaryItem
              label="Pedidos pendentes"
              value={dashboard.pendingOrders}
            />

            <SummaryItem
              label="Produtos com estoque baixo"
              value={dashboard.lowStockProducts}
            />

            <SummaryItem
              label="Produtos sem imagem"
              value={
                dashboard.productsWithoutImage
              }
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
        <Icon size={26} />
      </div>

      <h3 className="mt-4 font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="h-3 w-28 rounded bg-zinc-800" />
      <div className="mt-4 h-9 w-32 rounded bg-zinc-800" />
      <div className="mt-3 h-4 w-40 rounded bg-zinc-800" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="h-4 w-full rounded bg-zinc-800" />
    </div>
  );
}