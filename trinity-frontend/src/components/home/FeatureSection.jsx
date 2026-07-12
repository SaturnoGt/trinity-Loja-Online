export default function FeatureSection() {
  const items = [
    {
      title: "Entrega Nacional",
      text: "Enviamos para todo o Brasil.",
    },
    {
      title: "Pagamento Seguro",
      text: "Mercado Pago protegido.",
    },
    {
      title: "Qualidade Premium",
      text: "Streetwear desenvolvido para durar.",
    },
    {
      title: "Troca Garantida",
      text: "Até 7 dias após o recebimento.",
    },
  ];

  return (
    <section className="border-y border-zinc-800 bg-zinc-900/40 py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition duration-300 hover:border-white"
          >
            <h3 className="mb-3 text-lg font-bold">
              {item.title}
            </h3>

            <p className="text-sm text-zinc-400">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}