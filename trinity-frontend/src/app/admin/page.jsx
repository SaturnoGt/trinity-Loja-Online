export default function AdminPage() {
  return (
    <div>

      <h1 className="mb-8 text-4xl font-bold">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-xl bg-zinc-900 p-6">
          <h2 className="text-zinc-400">
            Produtos
          </h2>

          <p className="mt-3 text-4xl font-bold">
            --
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900 p-6">
          <h2 className="text-zinc-400">
            Pedidos
          </h2>

          <p className="mt-3 text-4xl font-bold">
            --
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900 p-6">
          <h2 className="text-zinc-400">
            Usuários
          </h2>

          <p className="mt-3 text-4xl font-bold">
            --
          </p>
        </div>

      </div>

    </div>
  );
}