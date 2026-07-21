'use client';

import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const QUICK_ACTIONS = [
  {
    title: 'Cadastrar produto',
    description:
      'Adicione um novo item ao catálogo.',
    href: '/admin/produtos',
    icon: Package,
  },
  {
    title: 'Gerenciar pedidos',
    description:
      'Acompanhe pagamentos e entregas.',
    href: '/admin/pedidos',
    icon: ClipboardList,
  },
  {
    title: 'Controlar estoque',
    description:
      'Confira quantidades e variações.',
    href: '/admin/estoque',
    icon: Boxes,
  },
  {
    title: 'Ver clientes',
    description:
      'Gerencie usuários e permissões.',
    href: '/admin/usuarios',
    icon: Users,
  },
];

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-300',
  },
  PAID: {
    label: 'Pago',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  },
  PROCESSING: {
    label: 'Em preparação',
    className:
      'border-blue-500/20 bg-blue-500/10 text-blue-300',
  },
  SHIPPED: {
    label: 'Enviado',
    className:
      'border-violet-500/20 bg-violet-500/10 text-violet-300',
  },
  DELIVERED: {
    label: 'Entregue',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelado',
    className:
      'border-red-500/20 bg-red-500/10 text-red-300',
  },
  REFUNDED: {
    label: 'Reembolsado',
    className:
      'border-orange-500/20 bg-orange-500/10 text-orange-300',
  },
};

const INITIAL_DASHBOARD = {
  products: 0,
  users: 0,
  orders: 0,
  revenue: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
  productsWithoutImage: 0,
};

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

function formatDate(value) {
  if (!value) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getShortOrderId(id) {
  if (!id) {
    return 'Sem ID';
  }

  const normalizedId = String(id);

  return normalizedId.length > 10
    ? normalizedId.slice(-8).toUpperCase()
    : normalizedId.toUpperCase();
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(
    INITIAL_DASHBOARD
  );

  const [recentOrders, setRecentOrders] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(
    async ({ isRefresh = false } = {}) => {
      try {
        if (isRefresh) {
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

        const requestOptions = {
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
            requestOptions
          ),

          fetch(
            `${apiUrl}/orders/admin`,
            requestOptions
          ),
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
            'Você não possui permissão para acessar o painel.'
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

        setRecentOrders(
          Array.isArray(ordersData)
            ? ordersData.slice(0, 5)
            : []
        );
      } catch (err) {
        console.error(
          'Erro ao carregar dashboard:',
          err
        );

        setError(
          err.message ||
            'Não foi possível carregar o Dashboard.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(
    () => [
      {
        label: 'Receita total',
        value: formatCurrency(
          dashboard.revenue
        ),
        description: 'Vendas confirmadas',
        icon: CircleDollarSign,
      },
      {
        label: 'Pedidos',
        value: String(dashboard.orders),
        description: 'Pedidos registrados',
        icon: ShoppingBag,
      },
      {
        label: 'Produtos',
        value: String(dashboard.products),
        description: 'Produtos cadastrados',
        icon: Package,
      },
      {
        label: 'Clientes',
        value: String(dashboard.users),
        description: 'Usuários cadastrados',
        icon: Users,
      },
    ],
    [dashboard]
  );

  const alerts = useMemo(
    () => [
      {
        title: 'Estoque baixo',
        value: dashboard.lowStockProducts,
        description:
          dashboard.lowStockProducts === 0
            ? 'Nenhum produto em alerta.'
            : `${dashboard.lowStockProducts} ${
                dashboard.lowStockProducts === 1
                  ? 'produto precisa'
                  : 'produtos precisam'
              } de reposição.`,
        href: '/admin/estoque',
      },
      {
        title: 'Pedidos pendentes',
        value: dashboard.pendingOrders,
        description:
          dashboard.pendingOrders === 0
            ? 'Nenhum pedido aguardando ação.'
            : `${dashboard.pendingOrders} ${
                dashboard.pendingOrders === 1
                  ? 'pedido aguarda'
                  : 'pedidos aguardam'
              } atendimento.`,
        href: '/admin/pedidos',
      },
      {
        title: 'Produtos sem imagem',
        value:
          dashboard.productsWithoutImage,
        description:
          dashboard.productsWithoutImage === 0
            ? 'Nenhum problema encontrado.'
            : `${dashboard.productsWithoutImage} ${
                dashboard.productsWithoutImage ===
                1
                  ? 'produto está'
                  : 'produtos estão'
              } sem imagem.`,
        href: '/admin/produtos',
      },
    ],
    [dashboard]
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
                Visão geral
              </p>

              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Bem-vindo ao painel Trinity
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                Acompanhe os principais números da
                loja, gerencie pedidos, produtos,
                clientes e estoque em um só lugar.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadDashboard({
                  isRefresh: true,
                })
              }
              disabled={loading || refreshing}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <section className="flex flex-col gap-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-300"
            />

            <div>
              <p className="font-bold text-red-200">
                Não foi possível carregar os
                dados
              </p>

              <p className="mt-1 text-sm text-red-300/80">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100 transition hover:bg-red-400/20"
          >
            <RefreshCw size={15} />
            Tentar novamente
          </button>
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
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex flex-col gap-4 border-b border-zinc-800 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                Pedidos recentes
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Últimas movimentações da loja.
              </p>
            </div>

            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 transition hover:text-white"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle
                size={30}
                className="animate-spin text-zinc-500"
              />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                <ShoppingBag size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-white">
                Nenhum pedido recente
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Quando novos pedidos forem
                realizados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentOrders.map((order) => (
                <RecentOrderItem
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <p className="text-sm font-bold text-white">
              Atenção necessária
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Alertas importantes da operação.
            </p>
          </div>

          <div className="space-y-3 p-5">
            {loading
              ? Array.from({ length: 3 }).map(
                  (_, index) => (
                    <AlertSkeleton
                      key={index}
                    />
                  )
                )
              : alerts.map((alert) => (
                  <AlertItem
                    key={alert.title}
                    title={alert.title}
                    description={
                      alert.description
                    }
                    value={alert.value}
                    href={alert.href}
                  />
                ))}
          </div>
        </article>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xl font-black text-white">
            Ações rápidas
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Atalhos para as tarefas mais usadas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 transition group-hover:bg-white group-hover:text-black">
                  <Icon size={22} />
                </div>

                <h2 className="mt-5 font-bold text-white">
                  {action.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {action.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition group-hover:text-white">
                  Acessar
                  <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RecentOrderItem({ order }) {
  const status =
    STATUS_CONFIG[order.status] || {
      label: order.status || 'Desconhecido',
      className:
        'border-zinc-700 bg-zinc-800 text-zinc-300',
    };

  const customerName =
    order.user?.name ||
    order.user?.email ||
    'Cliente não identificado';

  const totalItems = Array.isArray(
    order.items
  )
    ? order.items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      )
    : 0;

  return (
    <Link
      href={`/admin/pedidos/${order.id}`}
      className="flex flex-col gap-4 p-5 transition hover:bg-zinc-800/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-white">
            Pedido #{getShortOrderId(order.id)}
          </p>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <p className="mt-2 truncate text-sm text-zinc-400">
          {customerName}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {formatDate(order.createdAt)}
          {' • '}
          {totalItems}{' '}
          {totalItems === 1
            ? 'item'
            : 'itens'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-black text-white">
          {formatCurrency(order.total)}
        </p>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500">
          Detalhes
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}

function AlertItem({
  title,
  description,
  value,
  href,
}) {
  const hasAlert = Number(value) > 0;

  return (
    <Link
      href={href}
      className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-zinc-700 hover:bg-zinc-950"
    >
      <div
        className={
          hasAlert
            ? 'mt-0.5 text-amber-400'
            : 'mt-0.5 text-emerald-400'
        }
      >
        {hasAlert ? (
          <AlertTriangle size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-white">
            {title}
          </p>

          {hasAlert && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-black text-amber-300">
              {value}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-zinc-800" />
          <div className="mt-4 h-9 w-32 rounded bg-zinc-800" />
          <div className="mt-3 h-4 w-36 rounded bg-zinc-800" />
        </div>

        <div className="h-12 w-12 rounded-2xl bg-zinc-800" />
      </div>
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex gap-3">
        <div className="h-5 w-5 rounded bg-zinc-800" />

        <div className="flex-1">
          <div className="h-4 w-28 rounded bg-zinc-800" />
          <div className="mt-3 h-3 w-full rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}