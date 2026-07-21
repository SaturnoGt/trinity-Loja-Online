"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import ProductDetail from "@/components/product/ProductDetail";
import { productService } from "@/services/productService";

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data = await productService.getById(id);

        if (active) {
          setProduct(data);
        }
      } catch (err) {
        console.error("Erro ao carregar produto:", err);

        if (active) {
          setProduct(null);
          setError(
            "Não foi possível carregar este produto."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadProduct();
    }

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />

          <p className="text-zinc-400">
            Carregando produto...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">
            Ops!
          </h2>

          <p className="mt-3 text-zinc-300">
            {error}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            Voltar para a loja
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h2 className="text-2xl font-bold">
            Produto não encontrado
          </h2>

          <p className="mt-3 text-zinc-400">
            Este produto não existe ou foi removido.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            Voltar para a loja
          </Link>
        </div>
      </main>
    );
  }

  return <ProductDetail product={product} />;
}