"use client";

import {
  Suspense,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  LoaderCircle,
  Package,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const cartClearedRef = useRef(false);

  const paymentId =
    searchParams.get("payment_id") ||
    searchParams.get("collection_id");

  const status =
    searchParams.get("status") ||
    searchParams.get("collection_status");

  const externalReference =
    searchParams.get("external_reference");

  useEffect(() => {
    if (cartClearedRef.current) {
      return;
    }

    /*
     * O webhook continua sendo a fonte verdadeira
     * para atualizar o pedido no banco.
     *
     * Aqui limpamos apenas o carrinho local depois
     * que o Mercado Pago retorna para a página
     * de pagamento aprovado.
     */
    if (status === "approved") {
      clearCart();
      cartClearedRef.current = true;
    }
  }, [status, clearCart]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
      <section className="w-full max-w-2xl rounded-3xl border border-emerald-500/20 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-emerald-950/20 sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 size={42} />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
          Pagamento aprovado
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          Pedido confirmado!
        </h1>

        <p className="mx-auto mt-5 max-w-lg leading-7 text-zinc-400">
          Seu pagamento foi recebido. A Trinity já está
          preparando os próximos passos do seu pedido.
        </p>

        {(paymentId || externalReference) && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-left">
            {externalReference && (
              <div className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Pedido
                </span>

                <span className="break-all font-mono text-sm text-zinc-300">
                  {externalReference}
                </span>
              </div>
            )}

            {paymentId && (
              <div
                className={
                  externalReference
                    ? "flex flex-col gap-1 pt-4"
                    : "flex flex-col gap-1"
                }
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Pagamento
                </span>

                <span className="break-all font-mono text-sm text-zinc-300">
                  {paymentId}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          <Link
            href="/perfil"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
          >
            <Package size={20} />
            Ver meus pedidos
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-6 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <ShoppingBag size={20} />
            Continuar comprando
          </Link>
        </div>

        <p className="mt-7 text-xs leading-5 text-zinc-600">
          A confirmação definitiva do pedido é processada
          automaticamente pelo Mercado Pago.
        </p>
      </section>
    </main>
  );
}

function PaymentSuccessLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="flex items-center gap-3 text-zinc-400">
        <LoaderCircle
          size={24}
          className="animate-spin"
        />

        Carregando confirmação...
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}