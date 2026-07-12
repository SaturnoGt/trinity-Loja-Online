"use client";

import { useContext, useEffect, useState } from "react";
import AuthContext from "@/context/AuthContext";

export default function MeusPedidosPage() {
  const { token } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setOrders(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Carregando pedidos...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Faça login para visualizar seus pedidos.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-10 text-4xl font-bold">
          Meus Pedidos
        </h1>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            Você ainda não possui pedidos.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="flex flex-wrap justify-between gap-6">

                  <div>
                    <p className="text-sm text-zinc-400">
                      Pedido
                    </p>

                    <p className="font-mono font-bold">
                      #{order.id.slice(0, 8)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400">
                      Status
                    </p>

                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-bold
                      ${
                        order.status === "PAID"
                          ? "bg-green-600"
                          : order.status === "PENDING"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400">
                      Total
                    </p>

                    <p className="font-bold text-lg">
                      R${" "}
                      {Number(order.total)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>
                  </div>

                </div>

                <div className="mt-6 border-t border-zinc-800 pt-6 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between"
                    >
                      <div>
                        <p>{item.productName}</p>

                        <p className="text-sm text-zinc-500">
                          Quantidade: {item.quantity}
                        </p>
                      </div>

                      <div className="font-semibold">
                        R${" "}
                        {(item.unitPrice * item.quantity)
                          .toFixed(2)
                          .replace(".", ",")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
                  {new Date(order.createdAt).toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}