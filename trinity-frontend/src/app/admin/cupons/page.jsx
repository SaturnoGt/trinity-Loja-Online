'use client';

import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  TicketPercent,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const INITIAL_COUPONS = [];

export default function CuponsPage() {
  const [coupons, setCoupons] = useState(
    INITIAL_COUPONS
  );
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiration, setExpiration] =
    useState('');
  const [copiedCode, setCopiedCode] =
    useState('');

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return coupons;
    }

    return coupons.filter((coupon) =>
      coupon.code
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [coupons, search]);

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedCode = code
      .trim()
      .toUpperCase();

    const normalizedDiscount =
      Number(discount);

    if (
      !normalizedCode ||
      normalizedDiscount <= 0 ||
      normalizedDiscount > 100
    ) {
      return;
    }

    setCoupons((currentCoupons) => [
      {
        id: Date.now(),
        code: normalizedCode,
        discount: normalizedDiscount,
        expiration: expiration || null,
        active: true,
      },
      ...currentCoupons,
    ]);

    setCode('');
    setDiscount('');
    setExpiration('');
  }

  function removeCoupon(id) {
    setCoupons((currentCoupons) =>
      currentCoupons.filter(
        (coupon) => coupon.id !== id
      )
    );
  }

  function toggleCoupon(id) {
    setCoupons((currentCoupons) =>
      currentCoupons.map((coupon) =>
        coupon.id === id
          ? {
              ...coupon,
              active: !coupon.active,
            }
          : coupon
      )
    );
  }

  async function copyCoupon(codeToCopy) {
    try {
      await navigator.clipboard.writeText(
        codeToCopy
      );

      setCopiedCode(codeToCopy);

      setTimeout(() => {
        setCopiedCode('');
      }, 1500);
    } catch {
      setCopiedCode('');
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
              Promoções
            </p>

            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Cupons de desconto
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              Crie campanhas promocionais e organize
              os códigos de desconto da loja.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Cupons criados"
          value={coupons.length}
          icon={TicketPercent}
        />

        <MetricCard
          label="Cupons ativos"
          value={
            coupons.filter(
              (coupon) => coupon.active
            ).length
          }
          icon={CheckCircle2}
        />

        <MetricCard
          label="Maior desconto"
          value={
            coupons.length > 0
              ? `${Math.max(
                  ...coupons.map(
                    (coupon) =>
                      coupon.discount
                  )
                )}%`
              : '0%'
          }
          icon={BadgePercent}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <article className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="font-bold text-white">
              Criar cupom
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Configure um novo código promocional.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6"
          >
            <Field
              label="Código"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder="TRINITY10"
            />

            <Field
              label="Desconto em porcentagem"
              type="number"
              min="1"
              max="100"
              value={discount}
              onChange={(event) =>
                setDiscount(event.target.value)
              }
              placeholder="10"
            />

            <Field
              label="Data de validade"
              type="date"
              value={expiration}
              onChange={(event) =>
                setExpiration(
                  event.target.value
                )
              }
            />

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
            >
              <Plus size={18} />
              Criar cupom
            </button>

            <p className="text-xs leading-5 text-zinc-600">
              Os cupons desta tela ainda não são
              aplicados no checkout. A página está
              pronta para futura integração com o
              banco e pagamentos.
            </p>
          </form>
        </article>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-white">
                Cupons cadastrados
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Gerencie campanhas e validade.
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
                placeholder="Buscar cupom"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                <TicketPercent size={30} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Nenhum cupom criado
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Crie o primeiro código promocional
                usando o formulário ao lado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="p-5 transition hover:bg-zinc-800/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black tracking-wider text-white">
                          {coupon.code}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            copyCoupon(
                              coupon.code
                            )
                          }
                          className="text-zinc-500 transition hover:text-white"
                          aria-label="Copiar cupom"
                        >
                          {copiedCode ===
                          coupon.code ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            coupon.active
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {coupon.active
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
                        <span className="inline-flex items-center gap-2">
                          <BadgePercent
                            size={15}
                          />
                          {coupon.discount}% de
                          desconto
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <CalendarDays
                            size={15}
                          />
                          {coupon.expiration
                            ? new Intl.DateTimeFormat(
                                'pt-BR'
                              ).format(
                                new Date(
                                  `${coupon.expiration}T12:00:00`
                                )
                              )
                            : 'Sem validade'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleCoupon(coupon.id)
                        }
                        className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-700"
                      >
                        {coupon.active
                          ? 'Desativar'
                          : 'Ativar'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeCoupon(coupon.id)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-500 transition hover:border-red-500/30 hover:text-red-300"
                        aria-label={`Excluir ${coupon.code}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black text-white">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-800 p-3 text-zinc-300">
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
      </span>

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />
    </label>
  );
}