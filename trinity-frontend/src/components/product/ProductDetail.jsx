"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useCart } from "@/context/CartContext";

import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";

function getInitialVariation(product) {
  if (!Array.isArray(product?.variations)) {
    return null;
  }

  return (
    product.variations.find(
      (variation) => Number(variation?.stock) > 0
    ) ||
    product.variations[0] ||
    null
  );
}

export default function ProductDetail({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const initialVariation = useMemo(
    () => getInitialVariation(product),
    [product]
  );

  const [selectedVariation, setSelectedVariation] =
    useState(initialVariation);

  useEffect(() => {
    setSelectedVariation(initialVariation);
  }, [initialVariation]);

  function validateVariation() {
    if (!selectedVariation) {
      toast.error("Selecione uma variação.");
      return false;
    }

    const stock = Number(selectedVariation.stock);

    if (!Number.isFinite(stock) || stock <= 0) {
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

    toast.success(
      "Produto adicionado. Indo para o carrinho..."
    );

    router.push("/carrinho");
  }

  if (!product) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
        <ProductGallery
          images={
            Array.isArray(product.images)
              ? product.images
              : []
          }
          productName={product.name}
        />

        <ProductInfo
          product={product}
          selectedVariation={selectedVariation}
          onVariationChange={setSelectedVariation}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      </section>
    </main>
  );
}