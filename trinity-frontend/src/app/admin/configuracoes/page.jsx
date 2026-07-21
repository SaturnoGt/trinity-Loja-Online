'use client';

import {
  Bell,
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useState } from 'react';

const INITIAL_FORM = {
  storeName: 'TRINITY',
  storeEmail: '',
  storePhone: '',
  instagram: '',
  website: '',
  supportEmail: '',
  maintenanceMode: false,
  emailNotifications: true,
  orderNotifications: true,
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setSaved(false);

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    localStorage.setItem(
      'trinity-admin-settings',
      JSON.stringify(form)
    );

    setSaved(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader />

      {saved && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          <CheckCircle2 size={20} />

          <p className="text-sm font-bold">
            Configurações salvas neste navegador.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <SectionHeader
              icon={Store}
              title="Informações da loja"
              description="Dados públicos e principais informações da Trinity."
            />

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field
                label="Nome da loja"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="TRINITY"
              />

              <Field
                label="Telefone"
                name="storePhone"
                value={form.storePhone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />

              <Field
                label="E-mail comercial"
                name="storeEmail"
                type="email"
                value={form.storeEmail}
                onChange={handleChange}
                placeholder="contato@trinity.com.br"
              />

              <Field
                label="E-mail de suporte"
                name="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={handleChange}
                placeholder="suporte@trinity.com.br"
              />

              <Field
                label="Instagram"
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@trinity"
              />

              <Field
                label="Site"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://trinity.com.br"
              />
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <SectionHeader
              icon={Bell}
              title="Notificações"
              description="Preferências administrativas."
            />

            <div className="space-y-3 p-5">
              <ToggleItem
                name="emailNotifications"
                checked={form.emailNotifications}
                onChange={handleChange}
                title="Notificações por e-mail"
                description="Receber atualizações importantes da loja."
              />

              <ToggleItem
                name="orderNotifications"
                checked={form.orderNotifications}
                onChange={handleChange}
                title="Novos pedidos"
                description="Avisar quando um novo pedido for criado."
              />

              <ToggleItem
                name="maintenanceMode"
                checked={form.maintenanceMode}
                onChange={handleChange}
                title="Modo manutenção"
                description="Preparação para bloquear temporariamente a loja."
                warning
              />
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={Building2}
            title="Dados comerciais"
            description="Informações principais da empresa."
          />

          <InfoCard
            icon={Globe2}
            title="Presença digital"
            description="Site e redes sociais da marca."
          />

          <InfoCard
            icon={Mail}
            title="Comunicação"
            description="E-mails de atendimento e suporte."
          />

          <InfoCard
            icon={ShieldCheck}
            title="Segurança"
            description="Acesso protegido para administradores."
          />
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
          >
            <Save size={18} />
            Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}

function PageHeader() {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
      <div className="relative p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-500">
            Administração
          </p>

          <h1 className="mt-3 flex items-center gap-3 text-3xl font-black text-white sm:text-4xl">
            <Settings size={32} />
            Configurações
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            Organize as informações gerais,
            notificações e preferências da loja.
          </p>
        </div>
      </div>
    </section>
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
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
      />
    </label>
  );
}

function ToggleItem({
  name,
  checked,
  onChange,
  title,
  description,
  warning = false,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div>
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className={`h-5 w-5 shrink-0 accent-white ${
          warning ? 'accent-amber-400' : ''
        }`}
      />
    </label>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300">
        <Icon size={20} />
      </div>

      <h2 className="mt-4 font-bold text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </article>
  );
}