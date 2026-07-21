"use client";

import Link from "next/link";
import { XCircle, CreditCard, ShoppingCart } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
      <section className="w-full max-w-2xl rounded-3xl border border-red-500/20 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-red-950/20 sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
          <XCircle size={42} />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
          Pagamento não aprovado
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          Não foi possível concluir o pagamento
        </h1>

        <p className="mx-auto mt-5 max-w-lg leading-7 text-zinc-400">
          Seu pedido foi criado, mas o pagamento não foi aprovado.
          Você pode tentar novamente utilizando outro método de pagamento.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          <Link
            href="/carrinho"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200"
          >
            <CreditCard size={20} />
            Tentar novamente
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-6 py-4 font-bold transition hover:border-zinc-500"
          >
            <ShoppingCart size={20} />
            Voltar à loja
          </Link>
        </div>
      </section>
    </main>
  );
}