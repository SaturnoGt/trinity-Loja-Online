"use client";

export default function VariationSelector({
  variations = [],
  selectedVariation,
  onSelect,
}) {
  const validVariations = Array.isArray(variations)
    ? variations
    : [];

  if (!validVariations.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">
          Produto sem variações disponíveis.
        </p>
      </div>
    );
  }

  const selectedStock = Number(
    selectedVariation?.stock
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          Selecione o tamanho
        </h2>

        {selectedVariation && (
          <span className="text-sm text-zinc-500">
            {Number.isFinite(selectedStock)
              ? `Estoque: ${Math.max(
                  selectedStock,
                  0
                )}`
              : "Estoque indisponível"}
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        role="radiogroup"
        aria-label="Tamanhos disponíveis"
      >
        {validVariations.map((variation) => {
          const stock = Number(variation?.stock);
          const outOfStock =
            !Number.isFinite(stock) || stock <= 0;

          const selected =
            selectedVariation?.id === variation?.id;

          const size =
            variation?.size || "Único";

          return (
            <button
              key={
                variation?.id ||
                `${size}-${variation?.color}`
              }
              type="button"
              onClick={() => onSelect?.(variation)}
              disabled={outOfStock}
              role="radio"
              aria-checked={selected}
              aria-label={`${size}${
                outOfStock
                  ? ", sem estoque"
                  : `, ${stock} ${
                      stock === 1
                        ? "unidade disponível"
                        : "unidades disponíveis"
                    }`
              }`}
              className={`h-14 rounded-2xl border text-lg font-bold transition-all duration-300 ${
                selected
                  ? "border-white bg-white text-black shadow-lg"
                  : "border-zinc-700 bg-zinc-900 text-white hover:-translate-y-1 hover:border-white"
              } ${
                outOfStock
                  ? "cursor-not-allowed opacity-30 line-through hover:translate-y-0 hover:border-zinc-700"
                  : ""
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>

      {selectedVariation && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">
              Cor
            </span>

            <span className="font-semibold text-white">
              {selectedVariation.color ||
                "Não informada"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}