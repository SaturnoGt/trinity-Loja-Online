'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Crown,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  WalletCards,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function normalizeId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }

  return String(value ?? '').trim();
}

function normalizeUser(data) {
  if (
    data?.user &&
    typeof data.user === 'object'
  ) {
    return data.user;
  }

  if (data && typeof data === 'object') {
    return data;
  }

  return null;
}

function formatCurrency(value) {
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
    return 'Não informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return 'Não informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCpf(value) {
  if (!value) {
    return 'Não informado';
  }

  const originalValue = String(value);
  const digits = originalValue.replace(/\D/g, '');

  if (digits.length !== 11) {
    return originalValue;
  }

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
}

function formatPhone(value) {
  if (!value) {
    return 'Não informado';
  }

  const originalValue = String(value);
  const digits = originalValue.replace(/\D/g, '');

  if (digits.length === 11) {
    return digits.replace(
      /(\d{2})(\d{5})(\d{4})/,
      '($1) $2-$3'
    );
  }

  if (digits.length === 10) {
    return digits.replace(
      /(\d{2})(\d{4})(\d{4})/,
      '($1) $2-$3'
    );
  }

  return originalValue;
}

function formatZipCode(value) {
  if (!value) {
    return 'Não informado';
  }

  const originalValue = String(value);
  const digits = originalValue.replace(/\D/g, '');

  if (digits.length !== 8) {
    return originalValue;
  }

  return digits.replace(
    /(\d{5})(\d{3})/,
    '$1-$2'
  );
}

function getStatusLabel(status) {
  const labels = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    PROCESSING: 'Em preparação',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  };

  return labels[status] || status || 'Desconhecido';
}

function getStatusClasses(status) {
  const styles = {
    PENDING:
      'border-amber-500/30 bg-amber-500/10 text-amber-400',

    PAID:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',

    PROCESSING:
      'border-blue-500/30 bg-blue-500/10 text-blue-400',

    SHIPPED:
      'border-violet-500/30 bg-violet-500/10 text-violet-400',

    DELIVERED:
      'border-green-500/30 bg-green-500/10 text-green-400',

    CANCELED:
      'border-red-500/30 bg-red-500/10 text-red-400',

    CANCELLED:
      'border-red-500/30 bg-red-500/10 text-red-400',

    REFUNDED:
      'border-zinc-600 bg-zinc-800 text-zinc-300',
  };

  return (
    styles[status] ||
    'border-zinc-700 bg-zinc-800 text-zinc-300'
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

export default function UsuarioDetalhesAdminPage() {
  const params = useParams();
  const router = useRouter();

  const userId = normalizeId(params?.id);

  const {
    token,
    user: currentUser,
    loading: authLoading,
    logout,
  } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] =
    useState(false);
  const [error, setError] = useState('');

  const loadUser = useCallback(
    async (signal) => {
      if (authLoading) {
        return;
      }

      if (!userId) {
        setUser(null);
        setError(
          'Identificador do usuário inválido.'
        );
        setLoading(false);
        return;
      }

      if (!token) {
        setUser(null);
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
          `${API_URL}/users/${encodeURIComponent(
            userId
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
            'Você não possui permissão para visualizar este usuário.'
          );
        }

        if (response.status === 404) {
          throw new Error(
            'O usuário solicitado não foi encontrado.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar o usuário.'
          );
        }

        const normalizedUser = normalizeUser(data);

        if (!normalizedUser) {
          throw new Error(
            'A API retornou dados inválidos para o usuário.'
          );
        }

        setUser({
          ...normalizedUser,
          orders: Array.isArray(
            normalizedUser.orders
          )
            ? normalizedUser.orders
            : [],
        });
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao carregar usuário:',
          requestError
        );

        setUser(null);

        setError(
          requestError?.message ||
            'Não foi possível carregar o usuário.'
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
      token,
      userId,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadUser(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadUser]);

  const fullAddress = useMemo(() => {
    if (!user) {
      return '';
    }

    const firstLine = [
      user.street,
      user.number,
      user.complement,
    ]
      .filter(Boolean)
      .join(', ');

    const secondLine = [
      user.neighborhood,
      user.city,
      user.state,
    ]
      .filter(Boolean)
      .join(' - ');

    return [firstLine, secondLine]
      .filter(Boolean)
      .join('\n');
  }, [user]);

  const ordersCount = useMemo(() => {
    const value = Number(user?.ordersCount);

    if (Number.isFinite(value)) {
      return value;
    }

    return Array.isArray(user?.orders)
      ? user.orders.length
      : 0;
  }, [user]);

  const totalSpent = useMemo(() => {
    const value = Number(user?.totalSpent);

    if (Number.isFinite(value)) {
      return value;
    }

    if (!Array.isArray(user?.orders)) {
      return 0;
    }

    return user.orders.reduce(
      (total, order) => {
        if (
          order?.status === 'CANCELLED' ||
          order?.status === 'CANCELED' ||
          order?.status === 'REFUNDED'
        ) {
          return total;
        }

        const orderTotal = Number(order?.total);

        return (
          total +
          (Number.isFinite(orderTotal)
            ? orderTotal
            : 0)
        );
      },
      0
    );
  }, [user]);

  const isCurrentUser =
    Boolean(currentUser?.id && user?.id) &&
    String(currentUser.id) === String(user.id);

  async function handleRoleChange() {
    if (
      updatingRole ||
      !user ||
      !token
    ) {
      return;
    }

    const newRole =
      user.role === 'ADMIN'
        ? 'CLIENTE'
        : 'ADMIN';

    if (
      isCurrentUser &&
      newRole !== 'ADMIN'
    ) {
      toast.error(
        'Você não pode remover o próprio acesso de administrador.'
      );
      return;
    }

    const confirmed = window.confirm(
      newRole === 'ADMIN'
        ? `Deseja transformar "${user.email}" em administrador?`
        : `Deseja remover o acesso administrativo de "${user.email}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingRole(true);

      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(
          user.id
        )}/role`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: newRole,
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
          'Você não possui permissão para alterar cargos.'
        );
      }

      if (response.status === 404) {
        throw new Error(
          'O usuário não foi encontrado.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível alterar o cargo.'
        );
      }

      const updatedUser = normalizeUser(data);

      setUser((currentUserData) => ({
        ...currentUserData,
        ...(updatedUser || {}),
        role:
          updatedUser?.role ||
          data?.role ||
          newRole,
        orders: Array.isArray(
          updatedUser?.orders
        )
          ? updatedUser.orders
          : currentUserData.orders,
      }));

      toast.success(
        newRole === 'ADMIN'
          ? 'Usuário promovido para administrador.'
          : 'Usuário alterado para cliente.'
      );
    } catch (requestError) {
      console.error(
        'Erro ao atualizar cargo:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível alterar o cargo.'
      );
    } finally {
      setUpdatingRole(false);
    }
  }

  if (loading || authLoading) {
    return <UserDetailsLoading />;
  }

  if (error || !user) {
    return (
      <UserDetailsError
        error={
          error ||
          'O usuário não foi encontrado.'
        }
        onRetry={() => loadUser()}
        onBack={() =>
          router.push('/admin/usuarios')
        }
      />
    );
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/usuarios"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar para usuários
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Detalhes do usuário
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-3xl font-black sm:text-4xl">
              {user.name || 'Usuário sem nome'}
            </h1>

            {isCurrentUser ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-black">
                Você
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-zinc-400">
            Confira os dados, endereço e histórico
            de compras.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => loadUser()}
            disabled={loading || updatingRole}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-bold text-zinc-200 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={handleRoleChange}
            disabled={
              updatingRole || isCurrentUser
            }
            title={
              isCurrentUser
                ? 'Você não pode alterar seu próprio cargo'
                : undefined
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-bold text-amber-400 transition hover:border-amber-500 hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updatingRole ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Crown size={18} />
            )}

            {updatingRole
              ? 'Salvando...'
              : user.role === 'ADMIN'
                ? 'Transformar em cliente'
                : 'Promover para admin'}
          </button>
        </div>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ShoppingBag size={21} />}
          label="Pedidos"
          value={ordersCount}
        />

        <MetricCard
          icon={<WalletCards size={21} />}
          label="Total gasto"
          value={formatCurrency(totalSpent)}
        />

        <MetricCard
          icon={
            user.role === 'ADMIN' ? (
              <Crown size={21} />
            ) : (
              <UserRound size={21} />
            )
          }
          label="Cargo"
          value={
            user.role === 'ADMIN'
              ? 'Administrador'
              : 'Cliente'
          }
        />

        <MetricCard
          icon={<ShieldCheck size={21} />}
          label="Verificação"
          value={
            user.isVerified
              ? 'Verificado'
              : 'Pendente'
          }
        />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        <InfoCard
          title="Dados pessoais"
          icon={<UserRound size={21} />}
        >
          <InfoRow
            icon={<UserRound size={18} />}
            label="Nome"
            value={user.name || 'Não informado'}
          />

          <InfoRow
            icon={<Mail size={18} />}
            label="E-mail"
            value={user.email || 'Não informado'}
          />

          <InfoRow
            icon={<Phone size={18} />}
            label="Telefone"
            value={formatPhone(user.phone)}
          />

          <InfoRow
            icon={<CheckCircle2 size={18} />}
            label="CPF"
            value={formatCpf(user.cpf)}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Nascimento"
            value={formatDate(user.birthDate)}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Cadastro"
            value={formatDateTime(user.createdAt)}
          />

          <InfoRow
            icon={<RefreshCw size={18} />}
            label="Última atualização"
            value={formatDateTime(user.updatedAt)}
          />
        </InfoCard>

        <InfoCard
          title="Endereço"
          icon={<MapPin size={21} />}
        >
          {fullAddress ? (
            <>
              <InfoRow
                icon={<MapPin size={18} />}
                label="Endereço"
                value={fullAddress}
                preserveLines
              />

              <InfoRow
                icon={<MapPin size={18} />}
                label="CEP"
                value={formatZipCode(
                  user.zipCode
                )}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-10 text-center">
              <MapPin
                size={30}
                className="mx-auto text-zinc-600"
              />

              <p className="mt-4 font-semibold text-zinc-300">
                Endereço não cadastrado
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Este usuário ainda não informou um
                endereço.
              </p>
            </div>
          )}
        </InfoCard>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Histórico de pedidos
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Compras realizadas por este usuário.
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            {user.orders.length}{' '}
            {user.orders.length === 1
              ? 'pedido'
              : 'pedidos'}
          </span>
        </div>

        {user.orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
              <Package size={30} />
            </div>

            <h3 className="mt-6 text-xl font-bold">
              Nenhum pedido realizado
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
              Quando este usuário fizer uma compra,
              o pedido aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_130px] gap-4 border-b border-zinc-800 px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 md:grid">
              <span>Pedido</span>
              <span>Data</span>
              <span>Status</span>
              <span className="text-right">
                Total
              </span>
            </div>

            <div className="divide-y divide-zinc-800">
              {user.orders.map(
                (order, index) => (
                  <Link
                    key={
                      order?.id ??
                      `order-${index}`
                    }
                    href={`/admin/pedidos/${encodeURIComponent(
                      order.id
                    )}`}
                    className="group grid gap-4 p-5 transition hover:bg-zinc-800/50 md:grid-cols-[1.2fr_1fr_1fr_130px] md:items-center md:px-6"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 md:hidden">
                        Pedido
                      </p>

                      <div className="mt-1 flex items-center gap-2 md:mt-0">
                        <Package
                          size={18}
                          className="text-zinc-500"
                        />

                        <span className="font-bold text-white">
                          #
                          {String(
                            order.id
                          ).slice(0, 8)}
                        </span>

                        <ExternalLink
                          size={15}
                          className="text-zinc-600 transition group-hover:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 md:hidden">
                        Data
                      </p>

                      <p className="mt-1 text-sm text-zinc-400 md:mt-0">
                        {formatDateTime(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 md:hidden">
                        Status
                      </p>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(
                          order.status
                        )}
                      </span>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600 md:hidden">
                        Total
                      </p>

                      <p className="mt-1 font-black text-white md:mt-0">
                        {formatCurrency(
                          order.total
                        )}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-center gap-3 text-zinc-500">
        {icon}

        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>

      <p className="mt-4 break-words text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
          {icon}
        </div>

        <h2 className="text-xl font-black">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  preserveLines = false,
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mt-0.5 shrink-0 text-zinc-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
          {label}
        </p>

        <p
          className={[
            'mt-1 break-words text-sm font-semibold text-zinc-300',
            preserveLines
              ? 'whitespace-pre-line'
              : '',
          ].join(' ')}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function UserDetailsLoading() {
  return (
    <div
      className="animate-pulse"
      aria-label="Carregando usuário"
      aria-busy="true"
    >
      <div className="mb-8 h-10 w-72 max-w-full rounded-xl bg-zinc-900" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 rounded-3xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-[430px] rounded-3xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>

      <div className="flex h-64 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
        <Loader2
          size={34}
          className="animate-spin text-zinc-600"
        />
      </div>
    </div>
  );
}

function UserDetailsError({
  error,
  onRetry,
  onBack,
}) {
  return (
    <section
      role="alert"
      className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center"
    >
      <AlertCircle
        size={42}
        className="mx-auto text-red-400"
      />

      <h1 className="mt-5 text-2xl font-black">
        Não foi possível carregar o usuário
      </h1>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-red-200/70">
        {error}
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/20 px-5 py-3 font-bold text-red-100 transition hover:bg-red-300/10"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
        >
          <RefreshCw size={18} />
          Tentar novamente
        </button>
      </div>
    </section>
  );
}