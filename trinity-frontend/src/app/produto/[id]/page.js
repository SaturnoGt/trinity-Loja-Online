"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ProductDetail from "@/components/product/ProductDetail";
import { productService } from "@/services/productService";

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen items-center justify-center">
        Produto não encontrado.
      </div>
    );
  }

  return <ProductDetail product={product} />;
}