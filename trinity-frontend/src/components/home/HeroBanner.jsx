'use client';

import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-zinc-950">

      <div className="absolute inset-0">

        <div className="absolute left-[-150px] top-[-100px] h-[550px] w-[550px] rounded-full bg-white/5 blur-[170px]" />

        <div className="absolute right-[-100px] bottom-[-100px] h-[500px] w-[500px] rounded-full bg-zinc-500/10 blur-[160px]" />

      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 text-center">

        <span className="mb-8 rounded-full border border-zinc-700 px-5 py-2 text-xs uppercase tracking-[0.45em] text-zinc-400">
          TRINITY STREETWEAR
        </span>

        <h1 className="text-6xl font-black tracking-[0.35em] sm:text-7xl lg:text-8xl">
          TRINITY
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
          Minimalismo, identidade e qualidade. Cada peça foi criada para durar
          e representar quem veste.
        </p>

        <div className="mt-12 flex flex-col gap-5 sm:flex-row">

          <Link
            href="#produtos"
            className="rounded-2xl bg-white px-10 py-4 font-bold text-black transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            Comprar Agora
          </Link>

          <Link
            href="#produtos"
            className="rounded-2xl border border-zinc-700 px-10 py-4 transition hover:border-white"
          >
            Explorar
          </Link>

        </div>

      </div>

    </section>
  );
}