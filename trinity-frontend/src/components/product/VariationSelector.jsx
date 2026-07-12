"use client";

export default function VariationSelector({
  variations = [],
  selectedVariation,
  onSelect,
}) {
  if (!variations.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">
          Produto sem variações disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <h3 className="text-lg font-bold">
          Selecione o tamanho
        </h3>

        {selectedVariation && (
          <span className="text-sm text-zinc-500">
            Estoque: {selectedVariation.stock}
          </span>
        )}

      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">

        {variations.map((variation) => {
          const selected = selectedVariation?.id === variation.id;

          return (
            <button
              key={variation.id}
              onClick={() => onSelect(variation)}
              disabled={variation.stock <= 0}
              className={`
                h-14 rounded-2xl border text-lg font-bold transition-all duration-300

                ${
                  selected
                    ? "border-white bg-white text-black shadow-lg"
                    : "border-zinc-700 bg-zinc-900 hover:border-white hover:-translate-y-1"
                }

                ${
                  variation.stock <= 0
                    ? "cursor-not-allowed opacity-30 line-through"
                    : ""
                }
              `}
            >
              {variation.size}
            </button>
          );
        })}

      </div>

      {selectedVariation && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

          <div className="flex items-center justify-between">

            <span className="text-zinc-400">
              Cor
            </span>

            <span className="font-semibold">
              {selectedVariation.color}
            </span>

          </div>

        </div>
      )}

    </div>
  );
}