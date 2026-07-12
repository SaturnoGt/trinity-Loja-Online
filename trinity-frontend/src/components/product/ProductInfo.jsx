"use client";

import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  PackageCheck,
  CreditCard,
} from "lucide-react";

import VariationSelector from "./VariationSelector";

export default function ProductInfo({
  product,
  selectedVariation,
  onVariationChange,
  onAddToCart,
  adding = false,
}) {
  return (
    <div className="space-y-8">

      <div>

        <span className="rounded-full border border-zinc-700 px-4 py-1 text-xs uppercase tracking-[0.25em] text-zinc-400">
          Trinity Collection
        </span>

        <h1 className="mt-6 text-4xl font-black leading-tight lg:text-5xl">
          {product.name}
        </h1>

      </div>

      <div className="flex items-end gap-3">

        <span className="text-5xl font-black">
          R$ {Number(product.price).toFixed(2).replace(".", ",")}
        </span>

        <span className="pb-2 text-sm text-green-400">
          Em estoque
        </span>

      </div>

      <p className="max-w-xl text-base leading-8 text-zinc-400">
        {product.description}
      </p>

      <VariationSelector
        variations={product.variations}
        selectedVariation={selectedVariation}
        onSelect={onVariationChange}
      />

      <div className="space-y-4">

        <button
          onClick={onAddToCart}
          disabled={!selectedVariation}
          className="
            flex
            h-14
            w-full
            items-center
            justify-center
            gap-3
            rounded-2xl
            bg-white
            text-lg
            font-bold
            text-black
            transition-all
            duration-300
            hover:-translate-y-1
            hover:scale-[1.02]
            hover:bg-zinc-200
            active:scale-95
            disabled:cursor-not-allowed
            disabled:bg-zinc-700
            disabled:text-zinc-400
          "
        >
          <ShoppingCart size={22} />

          {adding
            ? "Adicionado ✓"
            : "Adicionar ao Carrinho"}
        </button>

        <button
          className="
            h-14
            w-full
            rounded-2xl
            border
            border-zinc-700
            font-semibold
            transition-all
            duration-300
            hover:border-white
            hover:bg-zinc-900
          "
        >
          Comprar Agora
        </button>

      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <div className="space-y-5">

          <div className="flex items-center gap-4">
            <Truck className="text-white" size={22} />
            <div>
              <p className="font-semibold">
                Envio para todo o Brasil
              </p>
              <p className="text-sm text-zinc-500">
                Despacho rápido após confirmação do pagamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CreditCard className="text-white" size={22} />
            <div>
              <p className="font-semibold">
                Pagamento Seguro
              </p>
              <p className="text-sm text-zinc-500">
                Mercado Pago com proteção ao comprador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ShieldCheck className="text-white" size={22} />
            <div>
              <p className="font-semibold">
                Compra Protegida
              </p>
              <p className="text-sm text-zinc-500">
                Seus dados são criptografados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <PackageCheck className="text-white" size={22} />
            <div>
              <p className="font-semibold">
                Produto Original Trinity
              </p>
              <p className="text-sm text-zinc-500">
                Desenvolvido com materiais premium.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}