'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Package,
  RefreshCw,
  Save,
  ShoppingBag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

const STATUS_OPTIONS = [
  {
    value: 'PENDING',
    label: 'Pendente',
  },
  {
    value: 'PAID',
    label: 'Pago',
  },
  {
    value: 'PROCESSING',
    label: 'Em preparação',
  },
  {
    value: 'SHIPPED',
    label: 'Enviado',
  },
  {
    value: 'DELIVERED',
    label: 'Entregue',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelado',
  },
  {
    value: 'REFUNDED',
    label: 'Reembolsado',
  },
];

const VALID_STATUSES = STATUS_OPTIONS.map(
  (option) => option.value
);

function normalizeId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }

  return String(value ?? '').trim();
}

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
    dateStyle: 'long',
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

function normalizeOrder(data) {
  if (
    data?.order &&
    typeof data.order === 'object'
  ) {
    return data.order;
  }

  if (data && typeof data === 'object') {
    return data;
  }

  return null;
}

function getProductImage(item) {
  const images = item?.product?.images;

  if (!Array.isArray(images)) {
    return '/produtos/trinity/frente.jpeg';
  }

  const mainImage =
    images.find(
      (image) =>
        image?.isMain ||
        image?.isPrimary ||
        image?.primary
    ) ||
    images.find(
      (image) =>
        image?.imageUrl ||
        image?.url ||
        image?.src
    );

  return (
    mainImage?.imageUrl ||
    mainImage?.url ||
    mainImage?.src ||
    '/produtos/trinity/frente.jpeg'
  );
}

export default function PedidoDetalhesAdminPage() {
  const params = useParams();
  const orderId = normalizeId(params?.id);

  const {
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(
    async (signal) => {
      if (authLoading) {
        return;
      }

      if (!orderId) {
        setError(
          'O código do pedido não foi encontrado.'
        );
        setLoading(false);
        return;
      }

      if (!token) {
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
          `${API_URL}/orders/admin/${encodeURIComponent(
            orderId
          )}`,
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
            'Você não possui permissão para acessar este pedido.'
          );
        }

        if (response.status === 404) {
          throw new Error(
            'O pedido solicitado não foi encontrado.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar o pedido.'
          );
        }

        const normalizedOrder =
          normalizeOrder(data);

        if (!normalizedOrder) {
          throw new Error(
            'A API retornou um pedido inválido.'
          );
        }

        const normalizedStatus =
          VALID_STATUSES.includes(
            normalizedOrder.status
          )
            ? normalizedOrder.status
            : 'PENDING';

        setOrder({
          ...normalizedOrder,
          status: normalizedStatus,
          items: Array.isArray(
            normalizedOrder.items
          )
            ? normalizedOrder.items
            : [],
        });

        setStatus(normalizedStatus);
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao carregar pedido:',
          requestError
        );

        setOrder(null);

        setError(
          requestError?.message ||
            'Não foi possível carregar o pedido.'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      authLoading,
      logout,
      orderId,
      token,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadOrder(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadOrder]);

  const itemsTotal = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => {
        const unitPrice = Number(
          item?.unitPrice
        );

        const quantity = Number(
          item?.quantity
        );

        return (
          total +
          (Number.isFinite(unitPrice)
            ? unitPrice
            : 0) *
            (Number.isFinite(quantity)
              ? quantity
              : 0)
        );
      },
      0
    );
  }, [order?.items]);

  const totalItems = useMemo(() => {
    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) => {
        const quantity = Number(
          item?.quantity
        );

        return (
          total +
          (Number.isFinite(quantity)
            ? quantity
            : 0)
        );
      },
      0
    );
  }, [order?.items]);

  const hasStatusChanged =
    Boolean(order) &&
    VALID_STATUSES.includes(status) &&
    status !== order.status;

  async function handleStatusUpdate() {
    if (
      saving ||
      !order ||
      !hasStatusChanged
    ) {
      return;
    }

    if (!token) {
      toast.error(
        'Sua sessão expirou. Faça login novamente.'
      );
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      toast.error(
        'Selecione um status válido.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/orders/admin/${encodeURIComponent(
          order.id
        )}/status`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
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
          'Você não possui permissão para atualizar pedidos.'
        );
      }

      if (response.status === 404) {
        throw new Error(
          'O pedido não foi encontrado.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível atualizar o status.'
        );
      }

      const updatedOrder =
        normalizeOrder(data);

      const updatedStatus =
        updatedOrder?.status || status;

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...(updatedOrder || {}),
        status: updatedStatus,
        items: Array.isArray(
          updatedOrder?.items
        )
          ? updatedOrder.items
          : currentOrder.items,
      }));

      setStatus(updatedStatus);

      toast.success(
        'Status do pedido atualizado com sucesso.'
      );
    } catch (requestError) {
      console.error(
        'Erro ao atualizar status:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível atualizar o status.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div
        className="flex min-h-96 items-center justify-center"
        aria-label="Carregando pedido"
        aria-busy="true"
      >
        <Loader2
          size={34}
          className="animate-spin text-zinc-400"
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link
          href="/admin/pedidos"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para pedidos
        </Link>

        <section
          role="alert"
          className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center"
        >
          <AlertCircle
            size={40}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 text-2xl font-bold">
            Não foi possível abrir o pedido
          </h1>

          <p className="mt-3 text-red-200/70">
            {error ||
              'Pedido não encontrado.'}
          </p>

          <button
            type="button"
            onClick={() => loadOrder()}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            <RefreshCw size={18} />
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/pedidos"
            className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Voltar para pedidos
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="break-all text-3xl font-black sm:text-4xl">
            Pedido #
            {String(order.id).slice(0, 8)}
          </h1>

          <p className="mt-3 text-zinc-400">
            Criado em{' '}
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            disabled={saving}
            aria-label="Status do pedido"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
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

          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={
              saving || !hasStatusChanged
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Save size={18} />
            )}

            {saving
              ? 'Salvando...'
              : 'Atualizar status'}
          </button>
        </div>
      </header>

      <section className="mb-8 grid gap-5 xl:grid-cols-3">
        <InfoCard
          icon={<CreditCard size={22} />}
          label="Valor total"
          value={formatPrice(order.total)}
        />

        <InfoCard
          icon={<ShoppingBag size={22} />}
          label="Itens"
          value={`${totalItems}`}
        />

        <InfoCard
          icon={<Package size={22} />}
          label="Pagamento"
          value={
            order.paymentId
              ? String(order.paymentId)
              : 'Não informado'
          }
          breakValue
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Package size={22} />

              <h2 className="text-xl font-bold">
                Itens do pedido
              </h2>
            </div>

            {order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map(
                  (item, index) => {
                    const image =
                      getProductImage(item);

                    const productName =
                      item?.productName ||
                      item?.product?.name ||
                      'Produto sem nome';

                    const quantity = Math.max(
                      0,
                      Number(item?.quantity) || 0
                    );

                    const unitPrice = Math.max(
                      0,
                      Number(item?.unitPrice) || 0
                    );

                    return (
                      <article
                        key={
                          item?.id ??
                          `${item?.productId}-${index}`
                        }
                        className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center"
                      >
                        <img
                          src={image}
                          alt={productName}
                          loading="lazy"
                          className="h-20 w-20 rounded-xl object-cover"
                        />

                        <div className="min-w-0">
                          <p className="break-words font-bold text-white">
                            {productName}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            Tamanho:{' '}
                            {item?.size ||
                              item?.variation
                                ?.size ||
                              'N/A'}{' '}
                            · Cor:{' '}
                            {item?.color ||
                              item?.variation
                                ?.color ||
                              'N/A'}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            Quantidade: {quantity}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {formatPrice(unitPrice)} por
                            unidade
                          </p>
                        </div>

                        <p className="font-bold text-white sm:text-right">
                          {formatPrice(
                            unitPrice * quantity
                          )}
                        </p>
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-6 text-center text-sm text-zinc-500">
                Nenhum item foi encontrado neste
                pedido.
              </p>
            )}

            <div className="mt-6 border-t border-zinc-800 pt-5">
              <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
                <span>Subtotal dos itens</span>
                <span>
                  {formatPrice(itemsTotal)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-lg font-black text-white">
                <span>Total do pedido</span>
                <span>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-6 flex items-center gap-3">
              <User size={22} />

              <h2 className="text-xl font-bold">
                Cliente
              </h2>
            </div>

            <InfoRow
              label="Nome"
              value={
                order.user?.name ||
                'Não informado'
              }
            />

            <InfoRow
              label="E-mail"
              value={
                order.user?.email ||
                'Não informado'
              }
            />

            <InfoRow
              label="Telefone"
              value={
                order.user?.phone ||
                'Não informado'
              }
            />

            <InfoRow
              label="CPF"
              value={
                order.user?.cpf ||
                'Não informado'
              }
            />
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-6 text-xl font-bold">
              Endereço de entrega
            </h2>

            <InfoRow
              label="CEP"
              value={
                order.user?.zipCode ||
                'Não informado'
              }
            />

            <InfoRow
              label="Endereço"
              value={
                [
                  order.user?.street,
                  order.user?.number,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                'Não informado'
              }
            />

            <InfoRow
              label="Complemento"
              value={
                order.user?.complement ||
                'Não informado'
              }
            />

            <InfoRow
              label="Bairro"
              value={
                order.user?.neighborhood ||
                'Não informado'
              }
            />

            <InfoRow
              label="Cidade"
              value={
                [
                  order.user?.city,
                  order.user?.state,
                ]
                  .filter(Boolean)
                  .join(' - ') ||
                'Não informado'
              }
            />
          </section>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  breakValue = false,
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-center gap-3 text-zinc-500">
        {icon}

        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>

      <p
        className={[
          'mt-4 text-2xl font-black text-white',
          breakValue
            ? 'break-all text-base'
            : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-zinc-800 py-3 last:border-b-0">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-zinc-200">
        {value}
      </p>
    </div>
  );
}