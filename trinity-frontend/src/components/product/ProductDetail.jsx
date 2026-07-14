"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useCart } from "@/context/CartContext";

import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";

export default function ProductDetail({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedVariation, setSelectedVariation] = useState(
    product.variations?.find(
      (variation) => variation.stock > 0
    ) ||
      product.variations?.[0] ||
      null
  );

  function validateVariation() {
    if (!selectedVariation) {
      toast.error("Selecione um tamanho.");
      return false;
    }

    if (Number(selectedVariation.stock) <= 0) {
      toast.error("Essa variação está sem estoque.");
      return false;
    }

    return true;
  }

  function handleAddToCart() {
    if (!validateVariation()) {
      return;
    }

    addToCart(product, selectedVariation);

    toast.success("Produto adicionado ao carrinho!");
  }

  function handleBuyNow() {
    if (!validateVariation()) {
      return;
    }

    addToCart(product, selectedVariation);

    toast.success("Produto adicionado. Indo para o carrinho...");

    router.push("/carrinho");
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2">
      <ProductGallery images={product.images} />

      <ProductInfo
        product={product}
        selectedVariation={selectedVariation}
        onVariationChange={setSelectedVariation}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </section>
  );
}