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
  Crown,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function normalizeUsers(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
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

function formatDate(value) {
  if (!value) {
    return 'Data indisponível';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function getOrdersCount(user) {
  const value = Number(user?.ordersCount);

  if (Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(user?.orders)) {
    return user.orders.length;
  }

  return 0;
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

export default function UsuariosAdminPage() {
  const {
    token,
    user: currentUser,
    loading: authLoading,
    logout,
  } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] =
    useState('ALL');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState(null);
  const [deletingId, setDeletingId] =
    useState(null);
  const [error, setError] = useState('');

  const loadUsers = useCallback(
    async (signal) => {
      if (authLoading) {
        return;
      }

      if (!token) {
        setUsers([]);
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
          `${API_URL}/users`,
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
            'Você não possui permissão para visualizar os usuários.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar os usuários.'
          );
        }

        setUsers(normalizeUsers(data));
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao carregar usuários:',
          requestError
        );

        setUsers([]);

        setError(
          requestError?.message ||
            'Não foi possível carregar os usuários.'
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

    loadUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'ALL' ||
        user?.role === roleFilter;

      if (!matchesRole) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchableText = [
        user?.id,
        user?.name,
        user?.email,
        user?.phone,
        user?.cpf,
        user?.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [users, search, roleFilter]);

  const metrics = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (user) => user?.role === 'ADMIN'
      ).length,

      clients: users.filter(
        (user) => user?.role === 'CLIENTE'
      ).length,

      verified: users.filter(
        (user) => Boolean(user?.isVerified)
      ).length,
    };
  }, [users]);

  async function handleRoleChange(
    selectedUser,
    newRole
  ) {
    if (
      updatingId ||
      deletingId ||
      !selectedUser
    ) {
      return;
    }

    if (!token) {
      toast.error(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    if (
      newRole !== 'ADMIN' &&
      newRole !== 'CLIENTE'
    ) {
      toast.error('Cargo inválido.');
      return;
    }

    if (selectedUser.role === newRole) {
      return;
    }

    const isCurrentUser =
      String(currentUser?.id || '') ===
      String(selectedUser.id || '');

    if (
      isCurrentUser &&
      newRole !== 'ADMIN'
    ) {
      toast.error(
        'Você não pode remover seu próprio acesso de administrador.'
      );
      return;
    }

    const confirmed = window.confirm(
      newRole === 'ADMIN'
        ? `Deseja transformar "${selectedUser.email}" em administrador?`
        : `Deseja remover o acesso administrativo de "${selectedUser.email}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(selectedUser.id);

      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(
          selectedUser.id
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

      const updatedUser =
        normalizeUser(data);

      setUsers((currentUsers) =>
        currentUsers.map((userItem) =>
          String(userItem.id) ===
          String(selectedUser.id)
            ? {
                ...userItem,
                ...(updatedUser || {}),
                role:
                  updatedUser?.role ||
                  data?.role ||
                  newRole,
              }
            : userItem
        )
      );

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
      setUpdatingId(null);
    }
  }

  async function handleDelete(selectedUser) {
    if (
      deletingId ||
      updatingId ||
      !selectedUser
    ) {
      return;
    }

    if (!token) {
      toast.error(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    const isCurrentUser =
      String(currentUser?.id || '') ===
      String(selectedUser.id || '');

    if (isCurrentUser) {
      toast.error(
        'Você não pode excluir sua própria conta pelo painel.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o usuário "${selectedUser.email}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(selectedUser.id);

      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(
          selectedUser.id
        )}`,
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
          'Você não possui permissão para excluir usuários.'
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
            'Não foi possível excluir o usuário.'
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (userItem) =>
            String(userItem.id) !==
            String(selectedUser.id)
        )
      );

      toast.success(
        'Usuário excluído com sucesso.'
      );
    } catch (requestError) {
      console.error(
        'Erro ao excluir usuário:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível excluir o usuário.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            Usuários
          </h1>

          <p className="mt-3 text-zinc-400">
            Gerencie clientes, administradores e
            acessos da loja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUsers()}
          disabled={
            loading ||
            authLoading ||
            Boolean(updatingId) ||
            Boolean(deletingId)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-bold text-zinc-200 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={
              loading ? 'animate-spin' : ''
            }
          />

          Atualizar
        </button>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users size={21} />}
          label="Total"
          value={metrics.total}
        />

        <MetricCard
          icon={<Crown size={21} />}
          label="Administradores"
          value={metrics.admins}
        />

        <MetricCard
          icon={<UserRound size={21} />}
          label="Clientes"
          value={metrics.clients}
        />

        <MetricCard
          icon={<ShieldCheck size={21} />}
          label="Verificados"
          value={metrics.verified}
        />
      </section>

      <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 lg:flex-row lg:items-center lg:justify-between">
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
            placeholder="Buscar por nome, e-mail ou telefone..."
            aria-label="Buscar usuários"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            aria-label="Filtrar usuários por cargo"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white"
          >
            <option value="ALL">
              Todos os cargos
            </option>

            <option value="CLIENTE">
              Clientes
            </option>

            <option value="ADMIN">
              Administradores
            </option>
          </select>

          <span className="text-sm text-zinc-500">
            {filteredUsers.length}{' '}
            {filteredUsers.length === 1
              ? 'usuário'
              : 'usuários'}
          </span>
        </div>
      </section>

      {error ? (
        <UsersError
          error={error}
          onRetry={() => loadUsers()}
        />
      ) : loading || authLoading ? (
        <UsersLoading />
      ) : filteredUsers.length === 0 ? (
        <EmptyUsers
          hasFilter={
            Boolean(search.trim()) ||
            roleFilter !== 'ALL'
          }
          onClearFilters={() => {
            setSearch('');
            setRoleFilter('ALL');
          }}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="hidden grid-cols-[1.7fr_1fr_130px_120px_130px_150px] gap-4 border-b border-zinc-800 px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 xl:grid">
            <span>Usuário</span>
            <span>Telefone</span>
            <span>Pedidos</span>
            <span>Cadastro</span>
            <span>Cargo</span>

            <span className="text-right">
              Ações
            </span>
          </div>

          <div className="divide-y divide-zinc-800">
            {filteredUsers.map(
              (selectedUser, index) => {
                const userId = String(
                  selectedUser?.id || ''
                );

                const isCurrentUser =
                  String(currentUser?.id || '') ===
                  userId;

                const updating =
                  String(updatingId || '') ===
                  userId;

                const deleting =
                  String(deletingId || '') ===
                  userId;

                const ordersCount =
                  getOrdersCount(selectedUser);

                return (
                  <article
                    key={
                      userId ||
                      `user-${index}`
                    }
                    className="grid gap-5 p-5 transition hover:bg-zinc-800/40 xl:grid-cols-[1.7fr_1fr_130px_120px_130px_150px] xl:items-center xl:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
                        {selectedUser.role ===
                        'ADMIN' ? (
                          <Crown size={21} />
                        ) : (
                          <UserRound size={21} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold text-white">
                            {selectedUser.name ||
                              'Usuário sem nome'}
                          </p>

                          {isCurrentUser ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-black">
                              Você
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 truncate text-sm text-zinc-500">
                          {selectedUser.email ||
                            'E-mail não informado'}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <VerifiedBadge
                            verified={Boolean(
                              selectedUser.isVerified
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-400">
                      {formatPhone(
                        selectedUser.phone
                      )}
                    </p>

                    <p className="text-sm font-semibold text-zinc-300">
                      {ordersCount}{' '}
                      {ordersCount === 1
                        ? 'pedido'
                        : 'pedidos'}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {formatDate(
                        selectedUser.createdAt
                      )}
                    </p>

                    <RoleBadge
                      role={selectedUser.role}
                    />

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Link
                        href={`/admin/usuarios/${encodeURIComponent(
                          userId
                        )}`}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-300 transition hover:border-white hover:text-white"
                        aria-label={`Ver detalhes de ${
                          selectedUser.email ||
                          selectedUser.name ||
                          'usuário'
                        }`}
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleRoleChange(
                            selectedUser,
                            selectedUser.role ===
                              'ADMIN'
                              ? 'CLIENTE'
                              : 'ADMIN'
                          )
                        }
                        disabled={
                          updating ||
                          deleting ||
                          isCurrentUser
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 transition hover:border-amber-500 hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={
                          selectedUser.role ===
                          'ADMIN'
                            ? `Remover acesso administrativo de ${selectedUser.email}`
                            : `Promover ${selectedUser.email} para administrador`
                        }
                        title={
                          isCurrentUser
                            ? 'Você não pode alterar o próprio cargo'
                            : selectedUser.role ===
                                'ADMIN'
                              ? 'Transformar em cliente'
                              : 'Transformar em administrador'
                        }
                      >
                        {updating ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Crown size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            selectedUser
                          )
                        }
                        disabled={
                          deleting ||
                          updating ||
                          isCurrentUser
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Excluir ${
                          selectedUser.email ||
                          selectedUser.name ||
                          'usuário'
                        }`}
                        title={
                          isCurrentUser
                            ? 'Você não pode excluir sua própria conta'
                            : 'Excluir usuário'
                        }
                      >
                        {deleting ? (
                          <Loader2
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
              }
            )}
          </div>
        </section>
      )}
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

function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN';

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${
        isAdmin
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
      }`}
    >
      {isAdmin ? 'Administrador' : 'Cliente'}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
        verified
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-zinc-700 bg-zinc-800 text-zinc-500'
      }`}
    >
      {verified ? 'Verificado' : 'Não verificado'}
    </span>
  );
}

function UsersError({
  error,
  onRetry,
}) {
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
        Não foi possível carregar os usuários
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

function EmptyUsers({
  hasFilter,
  onClearFilters,
}) {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
        <Users size={30} />
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {hasFilter
          ? 'Nenhum usuário encontrado'
          : 'Nenhum usuário cadastrado'}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        {hasFilter
          ? 'Tente alterar a busca ou o filtro de cargo.'
          : 'Os usuários cadastrados na loja aparecerão aqui.'}
      </p>

      {hasFilter ? (
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

function UsersLoading() {
  return (
    <div
      className="space-y-4"
      aria-label="Carregando usuários"
      aria-busy="true"
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex h-28 animate-pulse items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900"
        >
          {item === 1 ? (
            <Loader2
              size={28}
              className="animate-spin text-zinc-600"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}