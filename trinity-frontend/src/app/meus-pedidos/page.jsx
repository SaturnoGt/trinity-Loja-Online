"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";

const statusConfig = {
  PENDING: {
    label: "Aguardando pagamento",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },

  PAID: {
    label: "Pagamento aprovado",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },

  PROCESSING: {
    label: "Em preparação",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },

  SHIPPED: {
    label: "Enviado",
    className:
      "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  },

  DELIVERED: {
    label: "Entregue",
    className:
      "border-lime-500/30 bg-lime-500/10 text-lime-400",
  },

  CANCELLED: {
    label: "Cancelado",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },

  REFUNDED: {
    label: "Reembolsado",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) {
    return "Data não informada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "A API retornou um JSON inválido."
      );
    }
  }

  if (
    text.trim().startsWith("<!DOCTYPE") ||
    text.trim().startsWith("<html")
  ) {
    throw new Error(
      `A rota de pedidos não foi encontrada. Status ${response.status}.`
    );
  }

  return {
    message: text,
  };
}

export default function MeusPedidosPage() {
  const router = useRouter();

  const {
    token,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      const message =
        "A URL da API não foi configurada no frontend.";

      setError(message);
      setLoading(false);
      toast.error(message);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/orders/my-orders`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

      const data = await readResponse(response);

      if (response.status === 401) {
        toast.error(
          "Sua sessão expirou. Faça login novamente."
        );

        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Erro ${response.status} ao buscar pedidos.`
        );
      }

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : [];

      setOrders(orderList);
    } catch (requestError) {
      console.error(
        "Erro ao carregar pedidos:",
        requestError
      );

      const message =
        requestError?.message ||
        "Não foi possível carregar seus pedidos.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    loadOrders();
  }, [
    authLoading,
    isAuthenticated,
    loadOrders,
    router,
  ]);

  if (authLoading || loading) {
    return <OrdersLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Minha conta
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              Meus pedidos
            </h1>

            <p className="mt-3 text-zinc-400">
              Acompanhe pagamentos, produtos e o
              histórico das suas compras.
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            {orders.length}{" "}
            {orders.length === 1
              ? "pedido"
              : "pedidos"}
          </span>
        </header>

        {error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <AlertCircle
              size={38}
              className="mx-auto text-red-400"
            />

            <h2 className="mt-4 text-xl font-bold">
              Não foi possível carregar os pedidos
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-200/70">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
            >
              <RefreshCw size={18} />
              Tentar novamente
            </button>
          </section>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status =
                statusConfig[order.status] || {
                  label:
                    order.status ||
                    "Status desconhecido",
                  className:
                    "border-zinc-600 bg-zinc-800 text-zinc-300",
                };

              const items = Array.isArray(
                order.items
              )
                ? order.items
                : [];

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70"
                >
                  <div className="grid gap-6 border-b border-zinc-800 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Pedido
                      </p>

                      <p className="mt-2 font-mono font-bold">
                        #
                        {String(order.id).slice(
                          0,
                          8
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Data
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                        <CalendarDays size={16} />

                        {formatDate(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Total
                      </p>

                      <p className="mt-2 text-xl font-black">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    {items.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Nenhum item encontrado neste
                        pedido.
                      </p>
                    ) : (
                      items.map((item) => {
                        const quantity = Number(
                          item.quantity || 1
                        );

                        const unitPrice = Number(
                          item.unitPrice || 0
                        );

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="rounded-xl bg-zinc-800 p-3 text-zinc-300">
                                <Package size={22} />
                              </div>

                              <div>
                                <p className="font-semibold">
                                  {item.productName ||
                                    item.product
                                      ?.name ||
                                    "Produto"}
                                </p>

                                {(item.variation?.size ||
                                  item.variation
                                    ?.color) && (
                                  <p className="mt-1 text-sm text-zinc-400">
                                    {item.variation
                                      ?.size || ""}

                                    {item.variation
                                      ?.size &&
                                    item.variation
                                      ?.color
                                      ? " • "
                                      : ""}

                                    {item.variation
                                      ?.color || ""}
                                  </p>
                                )}

                                <p className="mt-1 text-sm text-zinc-500">
                                  Quantidade:{" "}
                                  {quantity}
                                </p>
                              </div>
                            </div>

                            <p className="font-bold">
                              {formatPrice(
                                unitPrice *
                                  quantity
                              )}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyOrders() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
        <ShoppingBag size={30} />
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        Você ainda não possui pedidos
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        Quando você finalizar uma compra, os
        produtos e o andamento do pedido aparecerão
        aqui.
      </p>

      <Link
        href="/#produtos"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
      >
        Explorar produtos
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}

function OrdersLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-10 h-10 w-64 rounded-xl bg-zinc-800" />

        <div className="space-y-6">
          <div className="h-72 rounded-3xl bg-zinc-900" />
          <div className="h-72 rounded-3xl bg-zinc-900" />
        </div>
      </div>
    </main>
  );
}