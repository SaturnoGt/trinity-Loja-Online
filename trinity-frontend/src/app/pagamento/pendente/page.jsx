"use client";

import Link from "next/link";
import {
  Clock3,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";

export default function PaymentPendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
      <section className="w-full max-w-2xl rounded-3xl border border-amber-500/20 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-amber-950/20 sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <Clock3 size={42} />
        </div>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
          Pagamento pendente
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          Estamos aguardando a confirmação
        </h1>

        <p className="mx-auto mt-5 max-w-lg leading-7 text-zinc-400">
          Seu pedido foi criado, mas o pagamento ainda está
          sendo processado pelo Mercado Pago. Assim que houver
          uma atualização, o status do pedido será alterado
          automaticamente.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-left">
          <p className="text-sm leading-6 text-zinc-400">
            Pagamentos por boleto, PIX ou métodos sujeitos à
            análise podem levar alguns minutos para serem
            confirmados.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          <Link
            href="/meus-pedidos"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
          >
            <PackageSearch size={20} />
            Acompanhar pedido
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/60 px-6 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <ShoppingBag size={20} />
            Voltar à loja
          </Link>
        </div>

        <p className="mt-7 text-xs leading-5 text-zinc-600">
          Não é necessário realizar outro pagamento enquanto
          este estiver pendente.
        </p>
      </section>
    </main>
  );
}