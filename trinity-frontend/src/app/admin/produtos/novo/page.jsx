'use client';

import {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '',
  price: '',
  category: '',
  description: '',
  weight: '',
  width: '',
  height: '',
  length: '',
};

const INITIAL_VARIATION = {
  size: '',
  color: '',
  stock: 0,
};

export default function NovoProdutoPage() {
  const router = useRouter();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [variations, setVariations] =
    useState([
      { ...INITIAL_VARIATION },
    ]);

  const [images, setImages] =
    useState([
      {
        imageUrl: '',
        isMain: true,
      },
    ]);

  const [saving, setSaving] =
    useState(false);

  const totalStock = useMemo(() => {
    return variations.reduce(
      (total, variation) =>
        total +
        Math.max(
          0,
          Number(
            variation.stock || 0
          )
        ),
      0
    );
  }, [variations]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateVariation(
    index,
    field,
    value
  ) {
    setVariations((current) =>
      current.map(
        (
          variation,
          variationIndex
        ) =>
          variationIndex === index
            ? {
                ...variation,
                [field]:
                  field === 'stock'
                    ? Math.max(
                        0,
                        Number(
                          value || 0
                        )
                      )
                    : value,
              }
            : variation
      )
    );
  }

  function addVariation() {
    setVariations((current) => [
      ...current,
      {
        ...INITIAL_VARIATION,
      },
    ]);
  }

  function removeVariation(index) {
    setVariations((current) => {
      if (current.length === 1) {
        toast.error(
          'O produto precisa ter pelo menos uma variação.'
        );

        return current;
      }

      return current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );
    });
  }

  function updateImage(
    index,
    value
  ) {
    setImages((current) =>
      current.map(
        (image, imageIndex) =>
          imageIndex === index
            ? {
                ...image,
                imageUrl: value,
              }
            : image
      )
    );
  }

  function setMainImage(index) {
    setImages((current) =>
      current.map(
        (image, imageIndex) => ({
          ...image,
          isMain:
            imageIndex === index,
        })
      )
    );
  }

  function addImage() {
    setImages((current) => [
      ...current,
      {
        imageUrl: '',
        isMain: false,
      },
    ]);
  }

  function removeImage(index) {
    setImages((current) => {
      if (current.length === 1) {
        return [
          {
            imageUrl: '',
            isMain: true,
          },
        ];
      }

      const nextImages =
        current.filter(
          (_, imageIndex) =>
            imageIndex !== index
        );

      if (
        !nextImages.some(
          (image) => image.isMain
        )
      ) {
        nextImages[0] = {
          ...nextImages[0],
          isMain: true,
        };
      }

      return nextImages;
    });
  }
    async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const category =
      form.category.trim();

    const price =
      Number(
        String(form.price)
          .replace(',', '.')
      );

    const weight = Number(
      String(form.weight).replace(',', '.')
    );

    const width = Number(
      String(form.width).replace(',', '.')
    );

    const height = Number(
      String(form.height).replace(',', '.')
    );

    const length = Number(
      String(form.length).replace(',', '.')
    );

    if (name.length < 2) {
      toast.error(
        'Informe um nome válido.'
      );

      return;
    }

    if (!description) {
      toast.error(
        'Informe uma descrição.'
      );

      return;
    }

    if (!category) {
      toast.error(
        'Selecione uma categoria.'
      );

      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error(
        'Informe um preço válido.'
      );

      return;
    }

    const shippingFields = [
      ['peso', weight],
      ['largura', width],
      ['altura', height],
      ['comprimento', length],
    ];

    for (const [label, value] of shippingFields) {
      if (!Number.isFinite(value) || value <= 0) {
        toast.error(
          `Informe ${label} maior que zero.`
        );

        return;
      }
    }

    const normalizedVariations =
      variations.map(
        (variation) => ({
          size:
            variation.size.trim(),
          color:
            variation.color.trim(),
          stock: Math.max(
            0,
            Number(
              variation.stock || 0
            )
          ),
        })
      );

    if (
      normalizedVariations.some(
        (variation) =>
          !variation.size ||
          !variation.color
      )
    ) {
      toast.error(
        'Preencha tamanho e cor de todas as variações.'
      );

      return;
    }

    const normalizedImages =
      images
        .map((image) => ({
          imageUrl:
            image.imageUrl.trim(),
          isMain:
            Boolean(
              image.isMain
            ),
        }))
        .filter(
          (image) =>
            image.imageUrl
        );

    try {
      setSaving(true);

      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'NEXT_PUBLIC_API_URL não configurada.'
        );
      }

      const response =
        await fetch(
          `${apiUrl}/products`,
          {
            method: 'POST',

            credentials: 'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              name,
              price,
              description,
              category,
              weight,
              width,
              height,
              length,
              images:
                normalizedImages,
              variations:
                normalizedVariations,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Não foi possível cadastrar o produto.'
        );
      }

      toast.success(
        'Produto cadastrado com sucesso.'
      );

      router.push(
        '/admin/produtos'
      );
    } catch (error) {
      console.error(
        'Erro ao cadastrar produto:',
        error
      );

      toast.error(
        error?.message ||
          'Não foi possível cadastrar o produto.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft size={17} />
        Voltar para produtos
      </Link>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="border-b border-zinc-800 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Catálogo
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Novo produto
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Cadastre um novo item
            no catálogo da Trinity.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-10 p-6 sm:p-8"
        >
          <section>
            <h2 className="mb-5 text-lg font-black text-white">
              Informações básicas
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
                          <Field
                label="Nome do produto"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome do produto"
                required
              />

              <Field
                label="Preço"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  Categoria
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-white"
                >
                  <option value="">
                    Selecione
                  </option>

                  <option value="Camisetas">
                    Camisetas
                  </option>

                  <option value="Oversized">
                    Oversized
                  </option>

                  <option value="Moletons">
                    Moletons
                  </option>

                  <option value="Acessórios">
                    Acessórios
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-zinc-300"
              >
                Descrição
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows={6}
                placeholder="Descrição do produto"
                required
                className="w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
              />
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-8">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white">
                Dados para frete
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Informe peso e dimensões da embalagem do produto.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Peso (kg)"
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleChange}
                placeholder="0.40"
                min="0.01"
                step="0.01"
                required
              />

              <Field
                label="Largura (cm)"
                name="width"
                type="number"
                value={form.width}
                onChange={handleChange}
                placeholder="20"
                min="0.1"
                step="0.1"
                required
              />

              <Field
                label="Altura (cm)"
                name="height"
                type="number"
                value={form.height}
                onChange={handleChange}
                placeholder="5"
                min="0.1"
                step="0.1"
                required
              />

              <Field
                label="Comprimento (cm)"
                name="length"
                type="number"
                value={form.length}
                onChange={handleChange}
                placeholder="30"
                min="0.1"
                step="0.1"
                required
              />
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Variações e estoque
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Estoque total atual:
                  {' '}
                  {totalStock}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addVariation
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition hover:border-white"
              >
                <Plus size={17} />
                Adicionar variação
              </button>
            </div>

            <div className="space-y-4">
              {variations.map(
                (
                  variation,
                  index
                ) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:grid-cols-[1fr_1fr_140px_auto]"
                  >
                    <Field
                      label="Tamanho"
                      value={
                        variation.size
                      }
                      onChange={(
                        event
                      ) =>
                        updateVariation(
                          index,
                          'size',
                          event.target
                            .value
                        )
                      }
                      placeholder="Único, P, M..."
                    />

                    <Field
                      label="Cor"
                      value={
                        variation.color
                      }
                      onChange={(
                        event
                      ) =>
                        updateVariation(
                          index,
                          'color',
                          event.target
                            .value
                        )
                      }
                      placeholder="Preto..."
                    />

                    <Field
                      label="Estoque"
                      type="number"
                      value={
                        variation.stock
                      }
                      onChange={(
                        event
                      ) =>
                        updateVariation(
                          index,
                          'stock',
                          event.target
                            .value
                        )
                      }
                      min="0"
                      step="1"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeVariation(
                          index
                        )
                      }
                      className="mt-7 inline-flex h-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Imagens
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Por enquanto usamos
                  URL das imagens.
                </p>
              </div>

              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition hover:border-white"
              >
                <Plus size={17} />
                Adicionar imagem
              </button>
            </div>
                        <div className="space-y-4">
              {images.map(
                (image, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:flex-row md:items-end"
                  >
                    <div className="flex-1">
                      <Field
                        label={`Imagem ${
                          index + 1
                        }`}
                        type="url"
                        value={
                          image.imageUrl
                        }
                        onChange={(
                          event
                        ) =>
                          updateImage(
                            index,
                            event.target
                              .value
                          )
                        }
                        placeholder="https://..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setMainImage(
                          index
                        )
                      }
                      className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                        image.isMain
                          ? 'bg-white text-black'
                          : 'border border-zinc-700 bg-zinc-900 text-white'
                      }`}
                    >
                      {image.isMain
                        ? 'Principal'
                        : 'Definir principal'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          index
                        )
                      }
                      className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/admin/produtos"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />

                  Salvando...
                </>
              ) : (
                <>
                  <Save
                    size={18}
                  />

                  Cadastrar produto
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-bold text-zinc-300"
        >
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={
          placeholder
        }
        required={
          required
        }
        min={min}
        step={step}
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
      />
    </div>
  );
}