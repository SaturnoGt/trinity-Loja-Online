'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  LoaderCircle,
  Save,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import toast from 'react-hot-toast';

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params?.id;

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [form, setForm] =
    useState({
      name: '',
      price: '',
      category: '',
      description: '',

      weight: '',
      width: '',
      height: '',
      length: '',
    });

  useEffect(() => {
    if (!productId) {
      return;
    }

    async function loadProduct() {
      try {
        setLoading(true);
        setError('');

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
            `${apiUrl}/products/${productId}`,
            {
              cache: 'no-store',
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Erro ao carregar o produto.'
          );
        }

        setForm({
          name:
            data?.name || '',

          price:
            data?.price !== undefined
              ? String(data.price)
              : '',

          category:
            data?.category || '',

          description:
            data?.description || '',

          weight:
            data?.weight !== null &&
            data?.weight !== undefined
              ? String(data.weight)
              : '',

          width:
            data?.width !== null &&
            data?.width !== undefined
              ? String(data.width)
              : '',

          height:
            data?.height !== null &&
            data?.height !== undefined
              ? String(data.height)
              : '',

          length:
            data?.length !== null &&
            data?.length !== undefined
              ? String(data.length)
              : '',
        });
      } catch (err) {
        console.error(
          'Erro ao carregar produto:',
          err
        );

        setError(
          err?.message ||
            'Não foi possível carregar o produto.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
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

    const weight =
      Number(
        String(form.weight)
          .replace(',', '.')
      );

    const width =
      Number(
        String(form.width)
          .replace(',', '.')
      );

    const height =
      Number(
        String(form.height)
          .replace(',', '.')
      );

    const length =
      Number(
        String(form.length)
          .replace(',', '.')
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

    for (
      const [
        label,
        value,
      ] of shippingFields
    ) {
      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        toast.error(
          `Informe ${label} maior que zero.`
        );

        return;
      }
    }

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
          `${apiUrl}/products/${productId}/basic`,
          {
            method: 'PATCH',

            credentials: 'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                name,
                price,
                description,
                category,

                weight,
                width,
                height,
                length,
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
            'Não foi possível atualizar o produto.'
        );
      }

      toast.success(
        'Produto atualizado com sucesso.'
      );

      router.push(
        `/admin/produtos/${productId}`
      );
    } catch (err) {
      console.error(
        'Erro ao atualizar produto:',
        err
      );

      toast.error(
        err?.message ||
          'Não foi possível atualizar o produto.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          size={34}
          className="animate-spin text-zinc-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/produtos/${productId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft
            size={17}
          />

          Voltar para o produto
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="border-b border-zinc-800 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
            Catálogo
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Editar produto
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Altere as informações principais do produto e os dados usados no cálculo do frete.
            Estoque e variações podem ser gerenciados separadamente.
          </p>
        </div>

        {error ? (
          <div className="p-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
                      </div>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-8 p-6 sm:p-8"
          >
            <section>
              <h2 className="mb-5 text-lg font-black text-white">
                Informações básicas
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Nome do produto"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Nome do produto"
                  required
                />

                <Field
                  label="Preço"
                  name="price"
                  value={
                    form.price
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0,00"
                  type="number"
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
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
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
                  rows={7}
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
                  Esses dados serão usados para calcular o frete automaticamente.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Peso (kg)"
                  name="weight"
                  type="number"
                  value={
                    form.weight
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0.40"
                  min="0.01"
                  step="0.01"
                  required
                />

                <Field
                  label="Largura (cm)"
                  name="width"
                  type="number"
                  value={
                    form.width
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="20"
                  min="0.1"
                  step="0.1"
                  required
                />

                <Field
                  label="Altura (cm)"
                  name="height"
                  type="number"
                  value={
                    form.height
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="5"
                  min="0.1"
                  step="0.1"
                  required
                />

                <Field
                  label="Comprimento (cm)"
                  name="length"
                  type="number"
                  value={
                    form.length
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="30"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
              <Link
                href={`/admin/produtos/${productId}`}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={
                  saving
                }
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

                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </form>
        )}
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
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-zinc-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={
          onChange
        }
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
