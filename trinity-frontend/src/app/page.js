'use client';

import { useEffect, useMemo, useState } from 'react';

import HeroBanner from '@/components/home/HeroBanner';
import SearchBar from '@/components/home/SearchBar';
import CategoryBar from '@/components/home/CategoryBar';
import ProductGrid from '@/components/home/ProductGrid';
import FeatureSection from '@/components/home/FeatureSection';
import Newsletter from '@/components/home/Newsletter';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products`
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }

        const data = await response.json();

        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarProdutos();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const nome = product.name?.toLowerCase() || '';
      const categoria = product.category?.toLowerCase() || '';

      const termoBusca = search.toLowerCase().trim();
      const categoriaSelecionada = selectedCategory
        .toLowerCase()
        .trim();

      const matchesSearch =
        termoBusca === '' || nome.includes(termoBusca);

      const matchesCategory =
        categoriaSelecionada === 'todos' ||
        categoria.includes(categoriaSelecionada);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <HeroBanner />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <section
        id="produtos"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            Produtos
          </h2>

          <span className="text-sm text-zinc-500">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? 'produto'
              : 'produtos'}
          </span>
        </div>

        <ProductGrid
          products={filteredProducts}
          loading={loading}
        />
      </section>

      <FeatureSection />

      <Newsletter />
    </main>
  );
}