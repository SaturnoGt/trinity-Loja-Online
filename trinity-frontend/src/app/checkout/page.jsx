'use client';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

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

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import toast from 'react-hot-toast';

import {
  useAuth,
} from '@/context/AuthContext';

import {
  useCart,
} from '@/context/CartContext';

// ==========================================
// HELPERS
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  ).format(
    Number(value || 0)
  );
}

function onlyNumbers(value) {
  return String(value || '')
    .replace(/\D/g, '');
}

function formatPhone(value) {
  const numbers =
    onlyNumbers(value)
      .slice(0, 11);

  if (numbers.length <= 10) {
    return numbers
      .replace(
        /^(\d{2})(\d)/,
        '($1) $2'
      )
      .replace(
        /(\d{4})(\d)/,
        '$1-$2'
      );
  }

  return numbers
    .replace(
      /^(\d{2})(\d)/,
      '($1) $2'
    )
    .replace(
      /(\d{5})(\d)/,
      '$1-$2'
    );
}

function formatZipCode(value) {
  return onlyNumbers(value)
    .slice(0, 8)
    .replace(
      /^(\d{5})(\d)/,
      '$1-$2'
    );
}

function normalizeApiUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '');
}

function getShippingCompanyName(option) {
  if (
    typeof option?.company ===
    'string'
  ) {
    return option.company;
  }

  return (
    option?.company?.name ||
    ''
  );
}

function getShippingDeadline(option) {
  const value =
    option?.customDeliveryTime ??
    option?.deliveryTime ??
    option?.deadline;

  const deadline =
    Number(value);

  return Number.isFinite(deadline)
    ? deadline
    : null;
}

function getShippingPrice(option) {
  const value =
    option?.customPrice ??
    option?.price;

  const price =
    Number(value);

  return Number.isFinite(price)
    ? price
    : 0;
}

// ==========================================
// FORM
// ==========================================

const INITIAL_FORM = {
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
};

// ==========================================
// CHECKOUT
// ==========================================

export default function CheckoutPage() {
  const router = useRouter();

  const {
    user,
    token,
    loading: authLoading,
    isAuthenticated,
    updateProfile,
  } = useAuth();

  const {
    cart,
  } = useCart();

  const cartItems =
    Array.isArray(cart)
      ? cart
      : [];

  // ========================================
  // ESTADOS
  // ========================================

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    shippingLoading,
    setShippingLoading,
  ] = useState(false);

  const [
    shippingOptions,
    setShippingOptions,
  ] = useState([]);

  const [
    selectedShipping,
    setSelectedShipping,
  ] = useState(null);

  const [
    shippingMessage,
    setShippingMessage,
  ] = useState('');

  // ========================================
  // AUTENTICAÇÃO
  // ========================================

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.replace(
        '/login'
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  // ========================================
  // CARREGAR DADOS DO USUÁRIO
  // ========================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      name:
        user.name || '',

      email:
        user.email || '',

      phone:
        formatPhone(
          user.phone
        ),

      zipCode:
        formatZipCode(
          user.zipCode
        ),

      street:
        user.street || '',

      number:
        user.number || '',

      complement:
        user.complement || '',

      neighborhood:
        user.neighborhood || '',

      city:
        user.city || '',

      state:
        String(
          user.state || ''
        )
          .trim()
          .toUpperCase()
          .slice(0, 2),
    });
  }, [user]);

  // ========================================
  // SUBTOTAL
  // ========================================

  const subtotal =
    useMemo(() => {
      return cartItems.reduce(
        (
          accumulator,
          item
        ) => {
          const price =
            Number(
              item?.product?.price ??
              item?.price ??
              0
            );

          const quantity =
            Number(
              item?.quantity ||
              1
            );

          if (
            !Number.isFinite(price) ||
            !Number.isFinite(quantity) ||
            price < 0 ||
            quantity <= 0
          ) {
            return accumulator;
          }

          return (
            accumulator +
            price * quantity
          );
        },
        0
      );
    }, [cartItems]);

  const shippingPrice =
    selectedShipping
      ? getShippingPrice(
          selectedShipping
        )
      : 0;

  const total =
    Number(
      (
        subtotal +
        shippingPrice
      ).toFixed(2)
    );

  // ========================================
  // ALTERAR FORM
  // ========================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    let nextValue =
      value;

    if (name === 'phone') {
      nextValue =
        formatPhone(value);
    }

    if (name === 'zipCode') {
      nextValue =
        formatZipCode(value);

      // CEP mudou.
      // A cotação antiga não vale mais.
      setShippingOptions(
        []
      );

      setSelectedShipping(
        null
      );

      setShippingMessage(
        ''
      );
    }

    if (name === 'state') {
      nextValue =
        String(value)
          .toUpperCase()
          .replace(
            /[^A-Z]/g,
            ''
          )
          .slice(0, 2);
    }

    setForm(
      (current) => ({
        ...current,
        [name]:
          nextValue,
      })
    );

    setError('');
  }

  // ========================================
  // VALIDAR FORM
  // ========================================

  function validateForm() {
    if (
      cartItems.length === 0
    ) {
      return (
        'Seu carrinho está vazio.'
      );
    }

    const requiredFields = [
      {
        field: 'name',
        label: 'nome',
      },

      {
        field: 'phone',
        label: 'telefone',
      },

      {
        field: 'zipCode',
        label: 'CEP',
      },

      {
        field: 'street',
        label: 'rua',
      },

      {
        field: 'number',
        label: 'número',
      },

      {
        field:
          'neighborhood',
        label: 'bairro',
      },

      {
        field: 'city',
        label: 'cidade',
      },

      {
        field: 'state',
        label: 'estado',
      },
    ];

    const missingField =
      requiredFields.find(
        ({ field }) =>
          !String(
            form[field] || ''
          ).trim()
      );

    if (missingField) {
      return (
        `Preencha o campo ${missingField.label} para continuar.`
      );
    }

    const phone =
      onlyNumbers(
        form.phone
      );

    if (
      phone.length < 10 ||
      phone.length > 11
    ) {
      return (
        'Informe um telefone válido.'
      );
    }

    const zipCode =
      onlyNumbers(
        form.zipCode
      );

    if (
      zipCode.length !== 8
    ) {
      return (
        'Informe um CEP válido com 8 números.'
      );
    }

    if (
      form.state
        .trim()
        .length !== 2
    ) {
      return (
        'Informe uma UF válida, como SP, RJ ou MG.'
      );
    }

    const invalidItem =
      cartItems.find(
        (item) => {
          const productId =
            Number(
              item?.product?.id
            );

          const variationId =
            Number(
              item?.variation?.id
            );

          const quantity =
            Number(
              item?.quantity
            );

          return (
            !Number.isInteger(
              productId
            ) ||
            productId <= 0 ||
            !Number.isInteger(
              variationId
            ) ||
            variationId <= 0 ||
            !Number.isInteger(
              quantity
            ) ||
            quantity <= 0
          );
        }
      );

    if (invalidItem) {
      return (
        'Existe um produto ou uma variação inválida no carrinho.'
      );
    }

    return '';
  }

  // ========================================
  // CALCULAR FRETE
  // ========================================

  async function handleCalculateShipping() {
    if (shippingLoading) {
      return;
    }

    const zipCode =
      onlyNumbers(
        form.zipCode
      );

    if (
      zipCode.length !== 8
    ) {
      const message =
        'Informe um CEP válido antes de calcular o frete.';

      setShippingMessage(
        message
      );

      toast.error(
        message
      );

      return;
    }

    if (
      cartItems.length === 0
    ) {
      const message =
        'Seu carrinho está vazio.';

      setShippingMessage(
        message
      );

      toast.error(
        message
      );

      return;
    }

    if (!token) {
      router.push(
        '/login'
      );

      return;
    }

    try {
      setShippingLoading(
        true
      );

      setShippingMessage(
        ''
      );

      setShippingOptions(
        []
      );

      setSelectedShipping(
        null
      );

      const apiUrl =
        normalizeApiUrl(
          process.env
            .NEXT_PUBLIC_API_URL
        );

      if (!apiUrl) {
        throw new Error(
          'NEXT_PUBLIC_API_URL não configurada.'
        );
      }

      const response =
        await fetch(
          `${apiUrl}/shipping/calculate`,
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                zipCode,

                items:
                  cartItems.map(
                    (item) => ({
                      productId:
                        Number(
                          item
                            .product
                            .id
                        ),

                      quantity:
                        Number(
                          item.quantity
                        ),
                    })
                  ),
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        response.status ===
        401
      ) {
        throw new Error(
          'Sua sessão expirou. Entre novamente.'
        );
      }

      if (
        response.status ===
          503 &&
        data?.code ===
          'MELHOR_ENVIO_NOT_CONFIGURED'
      ) {
        setShippingMessage(
          'A estrutura de frete está pronta. Falta apenas conectar a conta do Melhor Envio do cliente.'
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Não foi possível calcular o frete.'
        );
      }

      const options =
        Array.isArray(
          data?.options
        )
          ? data.options
          : [];

      setShippingOptions(
        options
      );

      if (
        options.length === 0
      ) {
        setShippingMessage(
          'Nenhuma opção de entrega foi encontrada para esse CEP.'
        );

        return;
      }

      setShippingMessage(
        `${options.length} ${
          options.length === 1
            ? 'opção encontrada'
            : 'opções encontradas'
        }. Selecione uma entrega para continuar.`
      );
    } catch (err) {
      console.error(
        'Erro ao calcular frete:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível calcular o frete.';

      setShippingMessage(
        message
      );

      toast.error(
        message
      );
    } finally {
      setShippingLoading(
        false
      );
    }
  }  // ========================================
  // FINALIZAR CHECKOUT
  // ========================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      toast.error(
        validationError
      );

      return;
    }

    if (!token) {
      router.push(
        '/login'
      );

      return;
    }

    try {
      setLoading(true);
      setError('');

      const apiUrl =
        normalizeApiUrl(
          process.env
            .NEXT_PUBLIC_API_URL
        );

      if (!apiUrl) {
        throw new Error(
          'NEXT_PUBLIC_API_URL não configurada.'
        );
      }

      // ====================================
      // 1. SALVAR DADOS NO PERFIL
      // ====================================
      //
      // Mantemos CPF, nascimento e avatar
      // já existentes no usuário.
      // ====================================

      if (
        typeof updateProfile ===
        'function'
      ) {
        await updateProfile({
          name:
            form.name.trim(),

          phone:
            onlyNumbers(
              form.phone
            ),

          cpf:
            user?.cpf || '',

          birthDate:
            user?.birthDate || '',

          avatarUrl:
            user?.avatarUrl || '',

          zipCode:
            onlyNumbers(
              form.zipCode
            ),

          street:
            form.street.trim(),

          number:
            form.number.trim(),

          complement:
            form.complement
              .trim(),

          neighborhood:
            form.neighborhood
              .trim(),

          city:
            form.city.trim(),

          state:
            form.state
              .trim()
              .toUpperCase(),
        });
      }

      // ====================================
      // 2. CRIAR PEDIDO
      // ====================================

      const orderResponse =
        await fetch(
          `${apiUrl}/orders`,
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                items:
                  cartItems.map(
                    (item) => ({
                      productId:
                        Number(
                          item
                            .product
                            .id
                        ),

                      variationId:
                        Number(
                          item
                            .variation
                            .id
                        ),

                      quantity:
                        Number(
                          item.quantity
                        ),
                    })
                  ),

                // Quando o Melhor Envio
                // estiver conectado,
                // o backend poderá usar
                // esses dados para validar
                // a opção escolhida.
                shipping:
                  selectedShipping
                    ? {
                        serviceId:
                          selectedShipping
                            .id,

                        service:
                          selectedShipping
                            .name ||
                          null,

                        company:
                          getShippingCompanyName(
                            selectedShipping
                          ) ||
                          null,

                        price:
                          getShippingPrice(
                            selectedShipping
                          ),

                        deadline:
                          getShippingDeadline(
                            selectedShipping
                          ),
                      }
                    : null,
              }),
          }
        );

      const orderData =
        await orderResponse
          .json()
          .catch(
            () => null
          );

      if (
        orderResponse.status ===
        401
      ) {
        throw new Error(
          'Sua sessão expirou. Entre novamente.'
        );
      }

      if (!orderResponse.ok) {
        if (
          orderData?.code ===
          'INCOMPLETE_SHIPPING_ADDRESS'
        ) {
          throw new Error(
            'Complete todos os dados de entrega antes de continuar.'
          );
        }

        if (
          orderData?.code ===
          'INVALID_SHIPPING_ZIP_CODE'
        ) {
          throw new Error(
            'O CEP salvo na sua conta é inválido.'
          );
        }

        throw new Error(
          orderData?.message ||
            orderData?.error ||
            'Não foi possível criar o pedido.'
        );
      }

      const order =
        orderData?.order ||
        orderData;

      if (!order?.id) {
        throw new Error(
          'O pedido foi criado sem um identificador válido.'
        );
      }

      // ====================================
      // 3. CRIAR PREFERÊNCIA MERCADO PAGO
      // ====================================

      const paymentResponse =
        await fetch(
          `${apiUrl}/payment/create-preference`,
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                orderId:
                  order.id,
              }),
          }
        );

      const paymentData =
        await paymentResponse
          .json()
          .catch(
            () => null
          );

      if (
        paymentResponse.status ===
        401
      ) {
        throw new Error(
          'Sua sessão expirou. Entre novamente.'
        );
      }

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData?.message ||
            paymentData?.error ||
            'Não foi possível iniciar o pagamento.'
        );
      }

      const checkoutUrl =
        paymentData
          ?.checkoutUrl ||
        paymentData
          ?.init_point ||
        paymentData
          ?.sandbox_init_point;

      if (
        !checkoutUrl ||
        typeof checkoutUrl !==
          'string'
      ) {
        console.error(
          'Resposta do pagamento sem checkoutUrl:',
          paymentData
        );

        throw new Error(
          'O Mercado Pago não retornou a página de pagamento.'
        );
      }

      toast.success(
        'Redirecionando para o Mercado Pago...'
      );

      window.location.assign(
        checkoutUrl
      );
    } catch (err) {
      console.error(
        'Erro no checkout:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao finalizar a compra.';

      setError(
        message
      );

      toast.error(
        message
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // LOADING DA AUTENTICAÇÃO
  // ========================================

  if (
    authLoading ||
    !isAuthenticated
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080a] text-white">
        <Loader2
          size={32}
          className="animate-spin text-zinc-500"
        />
      </main>
    );
  }

  // ========================================
  // SUCESSO
  // ========================================

  if (success) {
    return (
      <main className="min-h-screen bg-[#08080a] px-4 py-16 text-white">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <CheckCircle2
              size={32}
            />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Pedido iniciado
          </h1>

          <p className="mt-3 leading-7 text-zinc-400">
            Seu pedido foi preparado com sucesso.
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
            Confirme seus dados, calcule o frete e siga para o pagamento.
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
                description="Esses dados estão vinculados à sua conta."
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
                  disabled
                />

                <Field
                  label="Telefone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
              <SectionHeader
                icon={MapPin}
                title="Endereço de entrega"
                description="O endereço será salvo na sua conta e registrado neste pedido."
              />

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <Field
                  label="CEP"
                  name="zipCode"
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder="00000-000"
                  maxLength={9}
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

            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
              <SectionHeader
                icon={Truck}
                title="Entrega"
                description="Calcule o frete usando o CEP informado acima."
              />

              <div className="space-y-5 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-bold text-zinc-300">
                      CEP para cálculo
                    </p>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                      {form.zipCode || 'Informe o CEP acima'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateShipping}
                    disabled={
                      shippingLoading ||
                      cartItems.length === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-sm font-black text-white transition hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {shippingLoading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />

                        Calculando...
                      </>
                    ) : (
                      <>
                        <Truck size={18} />
                        Calcular frete
                      </>
                    )}
                  </button>
                </div>

                {shippingMessage && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-6 text-zinc-400">
                    {shippingMessage}
                  </div>
                )}

                {shippingOptions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-300">
                      Escolha uma opção de entrega
                    </p>

                    {shippingOptions.map(
                      (option, index) => {
                        const companyName =
                          getShippingCompanyName(
                            option
                          );

                        const deadline =
                          getShippingDeadline(
                            option
                          );

                        const price =
                          getShippingPrice(
                            option
                          );

                        const optionId =
                          option?.id ??
                          index;

                        const isSelected =
                          String(
                            selectedShipping?.id
                          ) ===
                          String(option?.id);

                        return (
                          <button
                            key={optionId}
                            type="button"
                            onClick={() =>
                              setSelectedShipping(
                                option
                              )
                            }
                            className={`w-full rounded-2xl border p-5 text-left transition ${
                              isSelected
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-white">
                                  {option?.name ||
                                    'Opção de entrega'}
                                </p>

                                {companyName && (
                                  <p className="mt-1 text-sm text-zinc-500">
                                    {companyName}
                                  </p>
                                )}

                                {deadline !== null && (
                                  <p className="mt-2 text-sm text-zinc-300">
                                    Prazo estimado:{' '}
                                    <strong>
                                      {deadline}{' '}
                                      {deadline === 1
                                        ? 'dia útil'
                                        : 'dias úteis'}
                                    </strong>
                                  </p>
                                )}
                              </div>

                              <div className="text-right">
                                <p className="font-black text-emerald-300">
                                  {price === 0
                                    ? 'Grátis'
                                    : formatCurrency(
                                        price
                                      )}
                                </p>

                                {isSelected && (
                                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
                                    Selecionado
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {selectedShipping && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-white">
                          Frete selecionado
                        </p>

                        <p className="mt-1 text-sm text-zinc-300">
                          {selectedShipping.name ||
                            'Entrega'}
                        </p>

                        {getShippingCompanyName(
                          selectedShipping
                        ) && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {getShippingCompanyName(
                              selectedShipping
                            )}
                          </p>
                        )}
                      </div>

                      <span className="font-black text-emerald-300">
                        {getShippingPrice(
                          selectedShipping
                        ) === 0
                          ? 'Grátis'
                          : formatCurrency(
                              getShippingPrice(
                                selectedShipping
                              )
                            )}
                      </span>
                    </div>
                  </div>
                )}
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
                cartItems.map(
                  (item, index) => {
                    const productName =
                      item?.product?.name ||
                      item?.name ||
                      'Produto Trinity';

                    const quantity =
                      Number(
                        item?.quantity || 1
                      );

                    const price =
                      Number(
                        item?.product?.price ??
                          item?.price ??
                          0
                      );

                    const variation =
                      item?.variation ||
                      null;

                    return (
                      <div
                        key={
                          variation?.id ||
                          `${item?.product?.id || index}-${index}`
                        }
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {productName}
                          </p>

                          {variation && (
                            <p className="mt-1 text-xs text-zinc-500">
                              {variation.size || ''}

                              {variation.color
                                ? ` • ${variation.color}`
                                : ''}
                            </p>
                          )}

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
                  }
                )
              )}
            </div>

            <div className="space-y-3 border-t border-zinc-800 p-6">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(
                  subtotal
                )}
              />

              <SummaryRow
                label="Frete"
                value={
                  selectedShipping
                    ? shippingPrice === 0
                      ? 'Grátis'
                      : formatCurrency(
                          shippingPrice
                        )
                    : 'A calcular'
                }
              />

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  {formatCurrency(
                    total
                  )}
                </span>
              </div>

              {!selectedShipping && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
                  Calcule o frete antes de finalizar.
                  Enquanto a conta do Melhor Envio não
                  estiver conectada, a cotação real ficará
                  indisponível.
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  cartItems.length === 0
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
                    <CreditCard
                      size={18}
                    />

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

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

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
  disabled = false,
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
        disabled={disabled}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
}) {
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

function TrustItem({
  icon: Icon,
  text,
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <Icon size={14} />

      {text}
    </div>
  );
}