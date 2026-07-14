"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  LoaderCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inválida. Status ${response.status}.`
    );
  }
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CarrinhoPage() {
  const router = useRouter();

  const {
    cart,
    removeFromCart,
  } = useCart();

  const { token } = useAuth();

  const [checkingOut, setCheckingOut] = useState(false);

  const total = cart.reduce((accumulator, item) => {
    const price = Number(item.product?.price || 0);
    const quantity = Number(item.quantity || 0);

    return accumulator + price * quantity;
  }, 0);

  async function handleCheckout() {
    if (checkingOut) {
      return;
    }

    if (!token) {
      toast.error(
        "Você precisa entrar na sua conta para finalizar a compra."
      );

      router.push("/login");
      return;
    }

    if (!cart.length) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    const invalidItem = cart.find((item) => {
      const productId = Number(item.product?.id);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.product?.price);

      return (
        !Number.isInteger(productId) ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0
      );
    });

    if (invalidItem) {
      toast.error(
        "Existe um produto inválido no carrinho."
      );
      return;
    }

    try {
      setCheckingOut(true);

      /*
       * 1. Criar pedido no backend
       */
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            total,
            items: cart.map((item) => ({
              productId: Number(item.product.id),
              productName: item.product.name,
              quantity: Number(item.quantity),
              unitPrice: Number(item.product.price),
            })),
          }),
        }
      );

      const orderData =
        await readJsonResponse(orderResponse);

      if (orderResponse.status === 401) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.error ||
            orderData?.message ||
            "Não foi possível criar o pedido."
        );
      }

      const order = orderData?.order || orderData;

      if (!order?.id) {
        throw new Error(
          "O pedido foi criado sem um identificador válido."
        );
      }

      /*
       * 2. Criar preferência de pagamento
       */
      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/create-preference`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: order.id,

            items: cart.map((item) => ({
              id: String(item.product.id),
              title: item.product.name,
              quantity: Number(item.quantity),
              unit_price: Number(item.product.price),
            })),
          }),
        }
      );

      const paymentData =
        await readJsonResponse(paymentResponse);

      if (paymentResponse.status === 401) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData?.error ||
            paymentData?.message ||
            "Não foi possível iniciar o pagamento."
        );
      }

      const checkoutUrl =
        paymentData?.init_point ||
        paymentData?.sandbox_init_point;

      if (!checkoutUrl) {
        console.error(
          "Resposta do pagamento sem URL:",
          paymentData
        );

        throw new Error(
          "O Mercado Pago não retornou a página de pagamento."
        );
      }

      toast.success(
        "Redirecionando para o Mercado Pago..."
      );

      /*
       * Não limpa o carrinho agora.
       * Vamos limpar somente depois que o pagamento
       * for aprovado.
       */
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("Erro no checkout:", error);

      toast.error(
        error.message ||
          "Não foi possível finalizar a compra."
      );
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Checkout
          </p>

          <h1 className="text-4xl font-black">
            Seu carrinho
          </h1>

          <p className="mt-3 text-zinc-400">
            Revise os produtos antes de seguir para o
            pagamento.
          </p>
        </header>

        {cart.length === 0 ? (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
              <ShoppingBag size={30} />
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Seu carrinho está vazio
            </h2>

            <p className="mt-3 text-zinc-500">
              Escolha um produto para continuar sua compra.
            </p>

            <button
              type="button"
              onClick={() => router.push("/#produtos")}
              className="mt-7 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
            >
              Ver produtos
            </button>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              {cart.map((item) => {
                const image =
                  item.product.images?.find(
                    (productImage) =>
                      productImage.isMain
                  )?.imageUrl ||
                  item.product.images?.[0]?.imageUrl ||
                  "/produtos/frente.jpg.jpeg";

                const itemTotal =
                  Number(item.product.price) *
                  Number(item.quantity);

                return (
                  <article
                    key={`${item.product.id}-${item.variation?.id || "default"}`}
                    className="flex flex-col gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-zinc-600 sm:flex-row sm:items-center"
                  >
                    <Image
                      src={image}
                      alt={item.product.name}
                      width={128}
                      height={128}
                      className="aspect-square h-32 w-32 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold">
                        {item.product.name}
                      </h2>

                      {item.variation && (
                        <p className="mt-2 text-zinc-400">
                          {item.variation.size}
                          {item.variation.color
                            ? ` • ${item.variation.color}`
                            : ""}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-zinc-500">
                        Quantidade: {item.quantity}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xl font-black">
                        {formatPrice(itemTotal)}
                      </p>

                      <button
                        type="button"
                        disabled={checkingOut}
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.variation?.id
                          )
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900/70 p-7 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold">
                Resumo
              </h2>

              <div className="mt-7 space-y-4">
                <div className="flex justify-between gap-4 text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="flex justify-between gap-4 text-zinc-400">
                  <span>Frete</span>
                  <span className="font-semibold text-emerald-400">
                    Grátis
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-zinc-800" />

              <div className="flex items-end justify-between gap-4">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-lg font-bold text-black transition hover:-translate-y-1 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {checkingOut ? (
                  <>
                    <LoaderCircle
                      size={21}
                      className="animate-spin"
                    />
                    Preparando pagamento...
                  </>
                ) : (
                  <>
                    <CreditCard size={21} />
                    Finalizar compra
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                Você será redirecionado para o ambiente seguro
                do Mercado Pago.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}