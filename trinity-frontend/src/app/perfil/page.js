"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birthDate: "",
  avatarUrl: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function formatCpf(value) {
  const numbers = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  return numbers
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(value) {
  const numbers = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZipCode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

export default function PerfilPage() {
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
    logout,
    updateProfile,
  } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: formatPhone(user.phone),
      cpf: formatCpf(user.cpf),
      birthDate: formatDateForInput(user.birthDate),
      avatarUrl: user.avatarUrl || "",
      zipCode: formatZipCode(user.zipCode),
      street: user.street || "",
      number: user.number || "",
      complement: user.complement || "",
      neighborhood: user.neighborhood || "",
      city: user.city || "",
      state: user.state || "",
    });
  }, [user]);

  const initials = useMemo(() => {
    const name = form.name.trim() || user?.email || "Trinity";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [form.name, user?.email]);

  function handleChange(event) {
    const { name, value } = event.target;

    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = formatCpf(value);
    }

    if (name === "phone") {
      formattedValue = formatPhone(value);
    }

    if (name === "zipCode") {
      formattedValue = formatZipCode(value);
    }

    if (name === "state") {
      formattedValue = value
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase();
    }

    setForm((current) => ({
      ...current,
      [name]: formattedValue,
    }));
  }

  function resetForm() {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: formatPhone(user.phone),
      cpf: formatCpf(user.cpf),
      birthDate: formatDateForInput(user.birthDate),
      avatarUrl: user.avatarUrl || "",
      zipCode: formatZipCode(user.zipCode),
      street: user.street || "",
      number: user.number || "",
      complement: user.complement || "",
      neighborhood: user.neighborhood || "",
      city: user.city || "",
      state: user.state || "",
    });

    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Informe seu nome");
      return;
    }

    const cpfNumbers = form.cpf.replace(/\D/g, "");

    if (cpfNumbers && cpfNumbers.length !== 11) {
      toast.error("O CPF precisa ter 11 números");
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, "") || null,
        cpf: cpfNumbers || null,
        birthDate: form.birthDate || null,
        avatarUrl: form.avatarUrl.trim() || null,
        zipCode: form.zipCode.replace(/\D/g, "") || null,
        street: form.street.trim() || null,
        number: form.number.trim() || null,
        complement: form.complement.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
      });

      setEditing(false);
      toast.success("Perfil atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);

      toast.error(
        error.message || "Não foi possível atualizar o perfil"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (loading) {
    return <ProfileLoading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Minha conta
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            Meu perfil
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Gerencie seus dados pessoais, endereço, segurança e
            preferências da sua conta Trinity.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex items-center gap-4">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt={form.name || "Usuário Trinity"}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-black">
                    {initials || "T"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">
                    {form.name || "Usuário Trinity"}
                  </p>

                  <p className="truncate text-sm text-zinc-500">
                    {form.email || "E-mail não informado"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    Tipo de conta
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-black">
                    {user?.role || "CLIENTE"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    ID do cliente
                  </span>

                  <span className="max-w-[150px] truncate font-medium text-zinc-300">
                    {user?.id || "-"}
                  </span>
                </div>
              </div>
            </section>

            <nav className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-3">
              <AccountLink
                href="/meus-pedidos"
                icon={<Package size={20} />}
                title="Meus pedidos"
                description="Acompanhe suas compras"
              />

              <AccountLink
                href="/favoritos"
                icon={<Heart size={20} />}
                title="Favoritos"
                description="Veja seus produtos salvos"
              />

              <AccountLink
                href="/redefinir-senha"
                icon={<LockKeyhole size={20} />}
                title="Alterar senha"
                description="Atualize sua senha de acesso"
              />
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 font-bold text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
            >
              <LogOut size={19} />
              Sair da conta
            </button>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <div className="flex flex-col gap-4 border-b border-zinc-800 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <User size={22} />

                  <h2 className="text-xl font-bold">
                    Dados do perfil
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Essas informações serão usadas no checkout e
                  nos seus pedidos.
                </p>
              </div>

              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200 active:scale-95"
                >
                  <Pencil size={17} />
                  Editar perfil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-bold text-white transition hover:border-white"
                >
                  <X size={17} />
                  Cancelar
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-10 p-6"
            >
              <div>
                <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Informações pessoais
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <ProfileField
                    label="Nome completo"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!editing}
                    icon={<User size={18} />}
                    placeholder="Seu nome completo"
                  />

                  <ProfileField
                    label="E-mail"
                    name="email"
                    type="email"
                    value={form.email}
                    disabled
                    icon={<Mail size={18} />}
                    helper="O e-mail da conta não pode ser alterado aqui."
                  />

                  <ProfileField
                    label="Telefone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    icon={<Phone size={18} />}
                    placeholder="(00) 00000-0000"
                  />

                  <ProfileField
                    label="CPF"
                    name="cpf"
                    value={form.cpf}
                    onChange={handleChange}
                    disabled={!editing}
                    icon={<ShieldCheck size={18} />}
                    placeholder="000.000.000-00"
                  />

                  <ProfileField
                    label="Data de nascimento"
                    name="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={handleChange}
                    disabled={!editing}
                    icon={<CalendarDays size={18} />}
                  />

                  <ProfileField
                    label="URL da foto de perfil"
                    name="avatarUrl"
                    value={form.avatarUrl}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-8">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin size={22} />

                    <h3 className="text-xl font-bold">
                      Endereço principal
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    Este endereço poderá ser usado durante a
                    finalização da compra.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <ProfileField
                    label="CEP"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="00000-000"
                  />

                  <ProfileField
                    label="Rua"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Nome da rua"
                  />

                  <ProfileField
                    label="Número"
                    name="number"
                    value={form.number}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="123"
                  />

                  <ProfileField
                    label="Complemento"
                    name="complement"
                    value={form.complement}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Apartamento, bloco..."
                  />

                  <ProfileField
                    label="Bairro"
                    name="neighborhood"
                    value={form.neighborhood}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Seu bairro"
                  />

                  <ProfileField
                    label="Cidade"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Sua cidade"
                  />

                  <ProfileField
                    label="Estado"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              {editing && (
                <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 font-bold text-white transition hover:border-white disabled:opacity-50"
                  >
                    Descartar alterações
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={18} />

                    {saving
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  helper,
  icon,
  disabled = false,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
            icon ? "pl-12" : ""
          } ${
            disabled
              ? "cursor-not-allowed border-zinc-800 bg-zinc-950/50 text-zinc-400"
              : "border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-white"
          }`}
        />
      </div>

      {helper && (
        <p className="mt-2 text-xs text-zinc-600">
          {helper}
        </p>
      )}
    </div>
  );
}

function AccountLink({
  href,
  icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl px-4 py-4 transition hover:bg-zinc-800"
    >
      <div className="rounded-xl bg-zinc-800 p-2.5 text-zinc-300 transition group-hover:bg-white group-hover:text-black">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white"
      />
    </Link>
  );
}

function ProfileLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-10 h-10 w-64 rounded-xl bg-zinc-800" />

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="h-80 rounded-3xl bg-zinc-900" />

          <div className="h-[720px] rounded-3xl bg-zinc-900" />
        </div>
      </div>
    </main>
  );
}