"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { useCart } from "@/context/CartContext";

import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";

export default function ProductDetail({ product }) {
  const { addToCart } = useCart();

  const [selectedVariation, setSelectedVariation] = useState(
    product.variations?.find((v) => v.stock > 0) ||
      product.variations?.[0] ||
      null
  );

  function handleAddToCart() {
    if (!selectedVariation) {
      toast.error("Selecione um tamanho.");
      return;
    }

    addToCart(product, selectedVariation);

    toast.success("Produto adicionado ao carrinho!");
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-2">

      <ProductGallery images={product.images} />

      <ProductInfo
        product={product}
        selectedVariation={selectedVariation}
        onVariationChange={setSelectedVariation}
        onAddToCart={handleAddToCart}
      />

    </section>
  );
}