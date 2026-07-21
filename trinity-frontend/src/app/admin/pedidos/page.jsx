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
  CalendarDays,
  ChevronRight,
  CreditCard,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },

  PAID: {
    label: 'Pago',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },

  PROCESSING: {
    label: 'Em preparação',
    className:
      'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },

  SHIPPED: {
    label: 'Enviado',
    className:
      'border-violet-500/30 bg-violet-500/10 text-violet-400',
  },

  DELIVERED: {
    label: 'Entregue',
    className:
      'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  },

  CANCELLED: {
    label: 'Cancelado',
    className:
      'border-red-500/30 bg-red-500/10 text-red-400',
  },

  REFUNDED: {
    label: 'Reembolsado',
    className:
      'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
  },
};

const STATUS_OPTIONS = [
  {
    value: 'ALL',
    label: 'Todos os status',
  },
  {
    value: 'PENDING',
    label: 'Pendentes',
  },
  {
    value: 'PAID',
    label: 'Pagos',
  },
  {
    value: 'PROCESSING',
    label: 'Em preparação',
  },
  {
    value: 'SHIPPED',
    label: 'Enviados',
  },
  {
    value: 'DELIVERED',
    label: 'Entregues',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelados',
  },
  {
    value: 'REFUNDED',
    label: 'Reembolsados',
  },
];

function formatPrice(value) {
  const number = Number(value);

  return (
    Number.isFinite(number) ? number : 0
  ).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value) {
  if (!value) {
    return 'Data indisponível';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
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

function normalizeOrders(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getItemsCount(order) {
  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce((total, item) => {
    const quantity = Number(item?.quantity);

    return (
      total +
      (Number.isFinite(quantity) ? quantity : 0)
    );
  }, 0);
}

export default function PedidosAdminPage() {
  const {
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] =
    useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(
    async (signal) => {
      if (authLoading) {
        return;
      }

      if (!token) {
        setOrders([]);
        setError(
          'Sua sessão não foi encontrada. Faça login novamente.'
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/orders/admin`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
            signal,
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
            'Você não possui permissão para visualizar os pedidos.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar os pedidos.'
          );
        }

        setOrders(normalizeOrders(data));
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao carregar pedidos:',
          requestError
        );

        setOrders([]);

        setError(
          requestError?.message ||
            'Não foi possível carregar os pedidos.'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [authLoading, logout, token]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadOrders(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === 'ALL' ||
        order?.status === selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        order?.id,
        order?.paymentId,
        order?.user?.name,
        order?.user?.email,
        order?.user?.phone,
        order?.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [orders, search, selectedStatus]);

  const statistics = useMemo(() => {
    const totalRevenue = orders.reduce(
      (total, order) => {
        const value = Number(order?.total);

        if (
          order?.status === 'CANCELLED' ||
          order?.status === 'REFUNDED'
        ) {
          return total;
        }

        return (
          total +
          (Number.isFinite(value) ? value : 0)
        );
      },
      0
    );

    const pendingOrders = orders.filter(
      (order) => order?.status === 'PENDING'
    ).length;

    const paidOrders = orders.filter(
      (order) =>
        order?.status === 'PAID' ||
        order?.status === 'PROCESSING' ||
        order?.status === 'SHIPPED' ||
        order?.status === 'DELIVERED'
    ).length;

    return {
      totalRevenue,
      pendingOrders,
      paidOrders,
    };
  }, [orders]);

  if (loading || authLoading) {
    return <OrdersLoading />;
  }

  if (error) {
    return (
      <OrdersError
        error={error}
        onRetry={() => loadOrders()}
      />
    );
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            Pedidos
          </h1>

          <p className="mt-3 text-zinc-400">
            Acompanhe pagamentos, separação e entrega
            dos pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-bold text-zinc-200 transition hover:border-white hover:text-white"
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </header>

      <section className="mb-8 grid gap-5 md:grid-cols-3">
        <StatisticCard
          icon={ShoppingBag}
          label="Total de pedidos"
          value={orders.length}
        />

        <StatisticCard
          icon={Package}
          label="Aguardando pagamento"
          value={statistics.pendingOrders}
        />

        <StatisticCard
          icon={CreditCard}
          label="Receita registrada"
          value={formatPrice(
            statistics.totalRevenue
          )}
        />
      </section>

      <section className="mb-6 grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar por cliente, e-mail ou código..."
            aria-label="Buscar pedidos"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(event.target.value)
          }
          aria-label="Filtrar pedidos por status"
          className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
        >
          {STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {filteredOrders.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              {filteredOrders.length}{' '}
              {filteredOrders.length === 1
                ? 'pedido encontrado'
                : 'pedidos encontrados'}
            </p>

            <p className="text-sm text-zinc-500">
              {statistics.paidOrders}{' '}
              {statistics.paidOrders === 1
                ? 'pedido confirmado'
                : 'pedidos confirmados'}
            </p>
          </div>

          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_1fr_auto] gap-5 border-b border-zinc-800 bg-zinc-950/60 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 lg:grid">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Status</span>
              <span>Total</span>
              <span className="sr-only">Abrir</span>
            </div>

            <div className="divide-y divide-zinc-800">
              {filteredOrders.map(
                (order, index) => (
                  <OrderRow
                    key={
                      order?.id ??
                      `order-${index}`
                    }
                    order={order}
                  />
                )
              )}
            </div>
          </section>
        </>
      ) : (
        <EmptyOrders
          hasFilters={
            Boolean(search.trim()) ||
            selectedStatus !== 'ALL'
          }
          onClearFilters={() => {
            setSearch('');
            setSelectedStatus('ALL');
          }}
        />
      )}
    </div>
  );
}

function OrderRow({ order }) {
  const status =
    STATUS_CONFIG[order?.status] ||
    STATUS_CONFIG.PENDING;

  const orderId = String(order?.id || '');
  const itemsCount = getItemsCount(order);

  return (
    <Link
      href={`/admin/pedidos/${encodeURIComponent(
        orderId
      )}`}
      className="group grid gap-5 px-6 py-5 transition hover:bg-zinc-800/50 lg:grid-cols-[1.1fr_1.4fr_1fr_1fr_auto] lg:items-center"
    >
      <div>
        <p className="font-mono text-sm font-bold text-white">
          #{orderId.slice(0, 8) || 'Sem código'}
        </p>

        <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <CalendarDays size={14} />
          {formatDate(order?.createdAt)}
        </p>
      </div>

      <div className="min-w-0">
        <p className="flex items-center gap-2 font-bold text-zinc-200">
          <User
            size={16}
            className="shrink-0 text-zinc-500"
          />

          <span className="truncate">
            {order?.user?.name ||
              'Cliente não informado'}
          </span>
        </p>

        <p className="mt-2 truncate text-sm text-zinc-500">
          {order?.user?.email ||
            'E-mail não informado'}
        </p>
      </div>

      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>

        <p className="mt-2 text-xs text-zinc-500">
          {itemsCount}{' '}
          {itemsCount === 1 ? 'item' : 'itens'}
        </p>
      </div>

      <div>
        <p className="text-lg font-black text-white">
          {formatPrice(order?.total)}
        </p>

        {order?.paymentId ? (
          <p className="mt-2 max-w-48 truncate text-xs text-zinc-500">
            Pagamento: {order.paymentId}
          </p>
        ) : null}
      </div>

      <ChevronRight
        size={21}
        className="hidden text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white lg:block"
      />
    </Link>
  );
}

function StatisticCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-center gap-3 text-zinc-500">
        <Icon size={21} />

        <p className="text-xs font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>

      <p className="mt-4 break-words text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyOrders({
  hasFilters,
  onClearFilters,
}) {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
      <Package
        size={42}
        className="mx-auto text-zinc-600"
      />

      <h2 className="mt-5 text-xl font-black text-white">
        {hasFilters
          ? 'Nenhum pedido encontrado'
          : 'Ainda não há pedidos'}
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
        {hasFilters
          ? 'Nenhum pedido corresponde aos filtros selecionados.'
          : 'Os novos pedidos aparecerão aqui assim que forem realizados.'}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          Limpar filtros
        </button>
      ) : null}
    </section>
  );
}

function OrdersLoading() {
  return (
    <div
      aria-label="Carregando pedidos"
      aria-busy="true"
    >
      <div className="mb-8 h-32 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900" />

      <div className="mb-8 grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>

      <div className="mb-6 h-24 animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900" />

      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
        <Loader2
          size={34}
          className="animate-spin text-zinc-500"
        />
      </div>
    </div>
  );
}

function OrdersError({ error, onRetry }) {
  return (
    <section
      role="alert"
      className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-14 text-center"
    >
      <AlertCircle
        size={42}
        className="mx-auto text-red-400"
      />

      <h1 className="mt-5 text-2xl font-black text-white">
        Não foi possível carregar os pedidos
      </h1>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-200/70">
        {error}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
      >
        <RefreshCw size={18} />
        Tentar novamente
      </button>
    </section>
  );
}