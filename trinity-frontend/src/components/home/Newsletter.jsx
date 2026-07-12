export default function Newsletter() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">

        <h2 className="mb-4 text-4xl font-black">
          Entre para a Trinity
        </h2>

        <p className="mb-8 text-zinc-400">
          Receba lançamentos, coleções limitadas e promoções antes de todo mundo.
        </p>

        <div className="flex flex-col gap-4 md:flex-row">

          <input
            type="email"
            placeholder="Seu melhor e-mail"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-4 outline-none transition focus:border-white"
          />

          <button className="rounded-xl bg-white px-8 py-4 font-bold text-black transition duration-300 hover:scale-105">
            Inscrever-se
          </button>

        </div>

      </div>
    </section>
  );
}