'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

function getStoredCart() {
  if (typeof window === 'undefined') {
    return [];
  }

  const possibleKeys = [
    'cart',
    'trinity-cart',
    'cartItems',
  ];

  for (const key of possibleKeys) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        return parsedValue;
      }

      if (Array.isArray(parsedValue?.items)) {
        return parsedValue.items;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems] = useState(() =>
    getStoredCart()
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(
        item.price ||
          item.product?.price ||
          0
      );

      const quantity = Number(
        item.quantity || 1
      );

      return total + price * quantity;
    }, 0);
  }, [cartItems]);

  const shipping = subtotal >= 299 ? 0 : 19.9;
  const total = subtotal + shipping;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function validateForm() {
    const requiredFields = [
      'name',
      'email',
      'phone',
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
    ];

    const missingField = requiredFields.find(
      (field) => !form[field].trim()
    );

    if (missingField) {
      return 'Preencha todos os campos obrigatórios.';
    }

    if (cartItems.length === 0) {
      return 'Seu carrinho está vazio.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'NEXT_PUBLIC_API_URL não configurada.'
        );
      }

      const token = getStoredToken();

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(
        `${apiUrl}/payment/create-preference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              id:
                item.id ||
                item.productId ||
                item.product?.id,
              title:
                item.name ||
                item.product?.name ||
                'Produto Trinity',
              quantity: Number(
                item.quantity || 1
              ),
              unit_price: Number(
                item.price ||
                  item.product?.price ||
                  0
              ),
              variationId:
                item.variationId ||
                item.variation?.id ||
                null,
              size:
                item.size ||
                item.variation?.size ||
                null,
              color:
                item.color ||
                item.variation?.color ||
                null,
            })),
            customer: form,
            shipping: {
              price: shipping,
              address: {
                zipCode: form.zipCode,
                street: form.street,
                number: form.number,
                complement: form.complement,
                neighborhood:
                  form.neighborhood,
                city: form.city,
                state: form.state,
              },
            },
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Não foi possível iniciar o pagamento.'
        );
      }

      const checkoutUrl =
        data?.init_point ||
        data?.sandbox_init_point ||
        data?.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Erro no checkout:', err);

      setError(
        err.message ||
          'Ocorreu um erro ao finalizar a compra.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#08080a] px-4 py-16 text-white">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Pedido iniciado
          </h1>

          <p className="mt-3 leading-7 text-zinc-400">
            Seu pedido foi preparado. Continue para
            o pagamento ou acompanhe pelo painel de
            pedidos.
          </p>

          <Link
            href="/meus-pedidos"
            className="mt-7 rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
          >
            Ver meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080a] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/carrinho"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar ao carrinho
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
            Finalização
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-3 text-zinc-400">
            Revise seus dados antes de seguir para o
            pagamento.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]"
        >
          <div className="space-y-6">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
              <SectionHeader
                icon={Package}
                title="Dados pessoais"
                description="Informações para identificação do pedido."
              />

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <Field
                  label="Nome completo"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                />

                <Field
                  label="E-mail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="voce@email.com"
                  required
                />

                <Field
                  label="Telefone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
              <SectionHeader
                icon={MapPin}
                title="Endereço de entrega"
                description="Local onde o pedido será entregue."
              />

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <Field
                  label="CEP"
                  name="zipCode"
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder="00000-000"
                  required
                />

                <Field
                  label="Rua"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Nome da rua"
                  required
                />

                <Field
                  label="Número"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  placeholder="123"
                  required
                />

                <Field
                  label="Complemento"
                  name="complement"
                  value={form.complement}
                  onChange={handleChange}
                  placeholder="Apartamento, bloco..."
                />

                <Field
                  label="Bairro"
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={handleChange}
                  placeholder="Bairro"
                  required
                />

                <Field
                  label="Cidade"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Cidade"
                  required
                />

                <Field
                  label="Estado"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900/70 lg:sticky lg:top-24">
            <div className="border-b border-zinc-800 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
                  <ShoppingBag size={21} />
                </div>

                <div>
                  <h2 className="font-bold">
                    Resumo do pedido
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {cartItems.length}{' '}
                    {cartItems.length === 1
                      ? 'item'
                      : 'itens'}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-80 space-y-4 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingBag
                    size={32}
                    className="mx-auto text-zinc-600"
                  />

                  <p className="mt-4 font-bold">
                    Carrinho vazio
                  </p>

                  <Link
                    href="/"
                    className="mt-3 inline-block text-sm text-zinc-400 underline"
                  >
                    Continuar comprando
                  </Link>
                </div>
              ) : (
                cartItems.map((item, index) => {
                  const productName =
                    item.name ||
                    item.product?.name ||
                    'Produto Trinity';

                  const quantity = Number(
                    item.quantity || 1
                  );

                  const price = Number(
                    item.price ||
                      item.product?.price ||
                      0
                  );

                  return (
                    <div
                      key={
                        item.id ||
                        item.variationId ||
                        index
                      }
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {productName}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Quantidade: {quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black">
                        {formatCurrency(
                          price * quantity
                        )}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3 border-t border-zinc-800 p-6">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(subtotal)}
              />

              <SummaryRow
                label="Frete"
                value={
                  shipping === 0
                    ? 'Grátis'
                    : formatCurrency(shipping)
                }
              />

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  {formatCurrency(total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={
                  loading || cartItems.length === 0
                }
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Preparando pagamento...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Ir para o pagamento
                  </>
                )}
              </button>

              <div className="grid gap-3 pt-3">
                <TrustItem
                  icon={LockKeyhole}
                  text="Pagamento protegido"
                />

                <TrustItem
                  icon={ShieldCheck}
                  text="Dados tratados com segurança"
                />

                <TrustItem
                  icon={Truck}
                  text="Entrega acompanhada"
                />
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-800 p-6">
      <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
        <Icon size={21} />
      </div>

      <div>
        <h2 className="font-bold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
      />
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">
        {label}
      </span>

      <span className="font-bold text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function TrustItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <Icon size={14} />
      {text}
    </div>
  );
}