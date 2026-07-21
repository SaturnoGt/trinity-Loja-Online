'use client';

import Link from 'next/link';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function createLocalId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptyImage(isMain = false) {
  return {
    localId: createLocalId(),
    imageUrl: '',
    isMain,
  };
}

function createEmptyVariation() {
  return {
    localId: createLocalId(),
    size: '',
    color: 'Preto',
    stock: 0,
  };
}

function normalizeProductId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }

  return String(value ?? '').trim();
}

function normalizePriceInput(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `A API retornou uma resposta inválida. Status ${response.status}.`
    );
  }
}

export default function EditarProdutoPage() {
  const params = useParams();
  const router = useRouter();

  const {
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const productId = normalizeProductId(
    params?.id
  );

  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    images: [],
    variations: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalStock = useMemo(() => {
    return form.variations.reduce(
      (total, variation) => {
        const stock = Number(variation.stock);

        return (
          total +
          (Number.isFinite(stock) && stock > 0
            ? stock
            : 0)
        );
      },
      0
    );
  }, [form.variations]);

  const loadProduct = useCallback(
    async (signal) => {
      if (!productId) {
        setError('ID de produto inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(
            productId
          )}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-store',
            signal,
          }
        );

        const data = await readResponse(response);

        if (response.status === 404) {
          throw new Error(
            'O produto solicitado não foi encontrado.'
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              'Não foi possível carregar o produto.'
          );
        }

        const images = Array.isArray(data?.images)
          ? data.images
              .filter(
                (image) =>
                  image &&
                  typeof image === 'object'
              )
              .map((image) => ({
                localId: createLocalId(),
                imageUrl:
                  String(
                    image.imageUrl ?? ''
                  ).trim(),
                isMain: Boolean(image.isMain),
              }))
          : [];

        if (
          images.length > 0 &&
          !images.some((image) => image.isMain)
        ) {
          images[0] = {
            ...images[0],
            isMain: true,
          };
        }

        const variations = Array.isArray(
          data?.variations
        )
          ? data.variations
              .filter(
                (variation) =>
                  variation &&
                  typeof variation === 'object'
              )
              .map((variation) => ({
                localId: createLocalId(),
                size: String(
                  variation.size ?? ''
                ),
                color:
                  String(
                    variation.color ?? ''
                  ) || 'Preto',
                stock: Math.max(
                  0,
                  Number.parseInt(
                    variation.stock,
                    10
                  ) || 0
                ),
              }))
          : [];

        setForm({
          name: String(data?.name ?? ''),
          price: String(data?.price ?? ''),
          description: String(
            data?.description ?? ''
          ),
          category: String(
            data?.category ?? ''
          ),
          images,
          variations,
        });
      } catch (requestError) {
        if (
          requestError?.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao carregar produto:',
          requestError
        );

        setError(
          requestError?.message ||
            'Não foi possível carregar o produto.'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadProduct(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProduct]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateImage(localId, field, value) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image) => {
        if (image.localId === localId) {
          return {
            ...image,
            [field]: value,
          };
        }

        if (field === 'isMain' && value) {
          return {
            ...image,
            isMain: false,
          };
        }

        return image;
      }),
    }));
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        createEmptyImage(
          current.images.length === 0
        ),
      ],
    }));
  }

  function removeImage(localId) {
    setForm((current) => {
      const removedImage =
        current.images.find(
          (image) => image.localId === localId
        );

      const nextImages =
        current.images.filter(
          (image) => image.localId !== localId
        );

      if (
        removedImage?.isMain &&
        nextImages.length > 0
      ) {
        nextImages[0] = {
          ...nextImages[0],
          isMain: true,
        };
      }

      return {
        ...current,
        images: nextImages,
      };
    });
  }

  function updateVariation(
    localId,
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      variations: current.variations.map(
        (variation) => {
          if (
            variation.localId !== localId
          ) {
            return variation;
          }

          if (field === 'stock') {
            const parsedStock =
              Number.parseInt(value, 10);

            return {
              ...variation,
              stock: Number.isFinite(
                parsedStock
              )
                ? Math.max(0, parsedStock)
                : 0,
            };
          }

          return {
            ...variation,
            [field]: value,
          };
        }
      ),
    }));
  }

  function addVariation() {
    setForm((current) => ({
      ...current,
      variations: [
        ...current.variations,
        createEmptyVariation(),
      ],
    }));
  }

  function removeVariation(localId) {
    setForm((current) => ({
      ...current,
      variations:
        current.variations.filter(
          (variation) =>
            variation.localId !== localId
        ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (authLoading) {
      toast.error(
        'Aguarde enquanto sua sessão é carregada.'
      );
      return;
    }

    if (!token) {
      toast.error(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    if (!productId) {
      toast.error('ID de produto inválido.');
      return;
    }

    const name = form.name.trim();
    const description =
      form.description.trim();
    const category = form.category.trim();

    const price = Number(
      normalizePriceInput(form.price)
    );

    if (!name) {
      toast.error(
        'Informe o nome do produto.'
      );
      return;
    }

    if (!category) {
      toast.error(
        'Informe a categoria do produto.'
      );
      return;
    }

    if (!description) {
      toast.error(
        'Informe a descrição do produto.'
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error('Informe um preço válido.');
      return;
    }

    const images = form.images
      .map((image) => ({
        imageUrl: image.imageUrl.trim(),
        isMain: Boolean(image.isMain),
      }))
      .filter((image) => image.imageUrl);

    if (
      images.length > 0 &&
      !images.some((image) => image.isMain)
    ) {
      images[0] = {
        ...images[0],
        isMain: true,
      };
    }

    const variations = form.variations
      .map((variation) => ({
        size: variation.size.trim(),
        color: variation.color.trim(),
        stock: Math.max(
          0,
          Number.parseInt(
            variation.stock,
            10
          ) || 0
        ),
      }))
      .filter(
        (variation) =>
          variation.size &&
          variation.color
      );

    const hasIncompleteVariation =
      form.variations.some(
        (variation) =>
          !variation.size.trim() ||
          !variation.color.trim()
      );

    if (hasIncompleteVariation) {
      toast.error(
        'Preencha tamanho e cor de todas as variações ou remova as linhas incompletas.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            price,
            description,
            category,
            images,
            variations,
          }),
        }
      );

      const data = await readResponse(response);

      if (response.status === 401) {
        logout();

        throw new Error(
          'Sua sessão expirou. Entre novamente.'
        );
      }

      if (response.status === 403) {
        throw new Error(
          'Você não possui permissão para editar produtos.'
        );
      }

      if (response.status === 404) {
        throw new Error(
          'O produto não foi encontrado.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível salvar o produto.'
        );
      }

      toast.success(
        'Produto atualizado com sucesso.'
      );

      router.push('/admin/produtos');
      router.refresh();
    } catch (requestError) {
      console.error(
        'Erro ao atualizar produto:',
        requestError
      );

      const message =
        requestError?.message ||
        'Não foi possível salvar o produto.';

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div
        className="flex min-h-96 items-center justify-center"
        aria-label="Carregando produto"
      >
        <Loader2
          size={34}
          className="animate-spin text-zinc-400"
        />
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <section
        role="alert"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center"
      >
        <AlertCircle
          size={40}
          className="mx-auto text-red-400"
        />

        <h1 className="mt-5 text-2xl font-bold">
          Não foi possível abrir o produto
        </h1>

        <p className="mt-3 text-red-200/70">
          {error}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => loadProduct()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/20 px-5 py-3 font-bold text-white transition hover:bg-red-500/20"
          >
            <Loader2 size={18} />
            Tentar novamente
          </button>

          <Link
            href="/admin/produtos"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft size={18} />
            Voltar para produtos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/admin/produtos"
            className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Voltar para produtos
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="text-4xl font-black">
            Editar produto
          </h1>

          <p className="mt-3 text-zinc-400">
            Atualize informações, imagens e
            estoque.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Estoque total
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {totalStock}
          </p>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p>{error}</p>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <section className="grid gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 lg:grid-cols-2">
          <Field
            label="Nome"
            value={form.name}
            onChange={(value) =>
              updateField('name', value)
            }
            placeholder="Nome do produto"
            required
            disabled={saving}
          />

          <Field
            label="Categoria"
            value={form.category}
            onChange={(value) =>
              updateField('category', value)
            }
            placeholder="Ex.: Camisetas"
            required
            disabled={saving}
          />

          <Field
            label="Preço"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(value) =>
              updateField('price', value)
            }
            placeholder="79.90"
            inputMode="decimal"
            required
            disabled={saving}
          />

          <div className="lg:col-span-2">
            <label
              htmlFor="product-description"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              Descrição
            </label>

            <textarea
              id="product-description"
              value={form.description}
              onChange={(event) =>
                updateField(
                  'description',
                  event.target.value
                )
              }
              rows={5}
              placeholder="Descrição do produto"
              required
              disabled={saving}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Imagens
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Informe as URLs e marque uma imagem
                como principal.
              </p>
            </div>

            <button
              type="button"
              onClick={addImage}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus size={18} />
              Adicionar imagem
            </button>
          </div>

          <div className="space-y-4">
            {form.images.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
                Nenhuma imagem adicionada.
              </p>
            ) : (
              form.images.map((image) => (
                <div
                  key={image.localId}
                  className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <input
                    type="text"
                    value={image.imageUrl}
                    onChange={(event) =>
                      updateImage(
                        image.localId,
                        'imageUrl',
                        event.target.value
                      )
                    }
                    placeholder="/produtos/trinity/frente.jpeg"
                    aria-label="URL da imagem"
                    disabled={saving}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="radio"
                      name="mainImage"
                      checked={image.isMain}
                      onChange={() =>
                        updateImage(
                          image.localId,
                          'isMain',
                          true
                        )
                      }
                      disabled={saving}
                      className="h-4 w-4 accent-white"
                    />

                    Principal
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(image.localId)
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remover imagem"
                    title="Remover imagem"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Tamanhos e estoque
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Gerencie cor, tamanho e quantidade
                disponível.
              </p>
            </div>

            <button
              type="button"
              onClick={addVariation}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Adicionar variação
            </button>
          </div>

          <div className="space-y-4">
            {form.variations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
                Nenhuma variação cadastrada.
              </p>
            ) : (
              form.variations.map(
                (variation) => (
                  <div
                    key={variation.localId}
                    className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <Field
                      label="Tamanho"
                      value={variation.size}
                      onChange={(value) =>
                        updateVariation(
                          variation.localId,
                          'size',
                          value
                        )
                      }
                      placeholder="M"
                      disabled={saving}
                    />

                    <Field
                      label="Cor"
                      value={variation.color}
                      onChange={(value) =>
                        updateVariation(
                          variation.localId,
                          'color',
                          value
                        )
                      }
                      placeholder="Preto"
                      disabled={saving}
                    />

                    <Field
                      label="Estoque"
                      type="number"
                      min="0"
                      step="1"
                      value={variation.stock}
                      onChange={(value) =>
                        updateVariation(
                          variation.localId,
                          'stock',
                          value
                        )
                      }
                      placeholder="0"
                      inputMode="numeric"
                      disabled={saving}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeVariation(
                          variation.localId
                        )
                      }
                      disabled={saving}
                      className="mt-7 inline-flex h-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remover variação"
                      title="Remover variação"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              )
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/admin/produtos"
            aria-disabled={saving}
            className={`inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-bold text-zinc-300 transition hover:border-white hover:text-white ${
              saving
                ? 'pointer-events-none opacity-50'
                : ''
            }`}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving || authLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <Save size={19} />
            )}

            {saving
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  ...props
}) {
  const inputId = `field-${label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-semibold text-zinc-300"
      >
        {label}
      </label>

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
    </div>
  );
}