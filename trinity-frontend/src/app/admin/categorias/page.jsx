'use client';

import {
  FolderPlus,
  Layers3,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const INITIAL_CATEGORIES = [
  {
    id: 1,
    name: 'Camisetas',
    description: 'Camisetas da coleção Trinity.',
  },
  {
    id: 2,
    name: 'Oversized',
    description: 'Modelos com caimento oversized.',
  },
  {
    id: 3,
    name: 'Moletons',
    description: 'Moletons e peças para dias frios.',
  },
  {
    id: 4,
    name: 'Acessórios',
    description: 'Acessórios e complementos.',
  },
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState(
    INITIAL_CATEGORIES
  );
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) =>
      `${category.name} ${category.description}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [categories, search]);

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    setCategories((currentCategories) => [
      ...currentCategories,
      {
        id: Date.now(),
        name: normalizedName,
        description:
          description.trim() ||
          'Categoria sem descrição.',
      },
    ]);

    setName('');
    setDescription('');
  }

  function removeCategory(id) {
    setCategories((currentCategories) =>
      currentCategories.filter(
        (category) => category.id !== id
      )
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
              Catálogo
            </p>

            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Categorias
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              Organize os produtos da Trinity em
              grupos fáceis de encontrar.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <article className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
                <FolderPlus size={21} />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Nova categoria
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Adicione um grupo ao catálogo.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Nome
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ex.: Bonés"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">
                Descrição
              </span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Descreva a categoria"
                className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
            >
              <Plus size={18} />
              Criar categoria
            </button>

            <p className="text-xs leading-5 text-zinc-600">
              Nesta etapa, as categorias criadas
              ficam apenas durante esta sessão. A
              integração permanente poderá ser
              conectada ao banco posteriormente.
            </p>
          </form>
        </article>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-white">
                Categorias cadastradas
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredCategories.length}{' '}
                categorias encontradas.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar categoria"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <Layers3
                size={34}
                className="text-zinc-600"
              />

              <h3 className="mt-4 font-bold text-white">
                Nenhuma categoria encontrada
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredCategories.map(
                (category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-zinc-800/30"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
                        <Package size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-white">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeCategory(category.id)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-500 transition hover:border-red-500/30 hover:text-red-300"
                      aria-label={`Excluir ${category.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}