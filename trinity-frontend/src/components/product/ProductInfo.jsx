"use client";

import {
  CreditCard,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import VariationSelector from "./VariationSelector";

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "R$ 0,00";
  }

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const benefits = [
  {
    title: "Envio para todo o Brasil",
    description:
      "Despacho rápido após a confirmação do pagamento.",
    icon: Truck,
  },
  {
    title: "Pagamento seguro",
    description:
      "Mercado Pago com proteção ao comprador.",
    icon: CreditCard,
  },
  {
    title: "Compra protegida",
    description:
      "Seus dados são tratados com segurança.",
    icon: ShieldCheck,
  },
  {
    title: "Produto original Trinity",
    description:
      "Desenvolvido com materiais selecionados.",
    icon: PackageCheck,
  },
];

export default function ProductInfo({
  product,
  selectedVariation,
  onVariationChange,
  onAddToCart,
  onBuyNow,
  adding = false,
}) {
  const variations = Array.isArray(product?.variations)
    ? product.variations
    : [];

  const stock = Number(selectedVariation?.stock);

  const hasStock =
    selectedVariation &&
    Number.isFinite(stock) &&
    stock > 0;

  const hasVariations = variations.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex rounded-full border border-zinc-700 px-4 py-1 text-xs uppercase tracking-[0.25em] text-zinc-400">
          Trinity Collection
        </span>

        <h1 className="mt-6 text-4xl font-black leading-tight text-white lg:text-5xl">
          {product?.name || "Produto Trinity"}
        </h1>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <span className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          {formatPrice(product?.price)}
        </span>

        <span
          className={`pb-1 text-sm font-medium ${
            hasStock
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {hasStock
            ? `${stock} ${
                stock === 1
                  ? "unidade disponível"
                  : "unidades disponíveis"
              }`
            : "Sem estoque"}
        </span>
      </div>

      <p className="max-w-xl text-base leading-8 text-zinc-400">
        {product?.description ||
          "Descrição indisponível para este produto."}
      </p>

      {hasVariations ? (
        <VariationSelector
          variations={variations}
          selectedVariation={selectedVariation}
          onSelect={onVariationChange}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          Nenhuma variação disponível para este produto.
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!hasStock || adding}
          aria-busy={adding}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-lg font-bold text-black transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          <ShoppingCart
            size={22}
            aria-hidden="true"
          />

          {adding
            ? "Adicionando..."
            : "Adicionar ao carrinho"}
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={!hasStock || adding}
          className="h-14 w-full rounded-2xl border border-zinc-700 font-semibold transition-all duration-300 hover:border-white hover:bg-white hover:text-black active:scale-[0.98] disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:hover:bg-zinc-900"
        >
          Comprar agora
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="space-y-5">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="flex items-start gap-4"
              >
                <Icon
                  className="mt-0.5 shrink-0 text-white"
                  size={22}
                  aria-hidden="true"
                />

                <div>
                  <p className="font-semibold text-white">
                    {benefit.title}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}