"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  LoaderCircle,
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

function createFormFromUser(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: formatPhone(user?.phone),
    cpf: formatCpf(user?.cpf),
    birthDate: formatDateForInput(user?.birthDate),
    avatarUrl: user?.avatarUrl || "",
    zipCode: formatZipCode(user?.zipCode),
    street: user?.street || "",
    number: user?.number || "",
    complement: user?.complement || "",
    neighborhood: user?.neighborhood || "",
    city: user?.city || "",
    state: user?.state || "",
  };
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

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
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
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

function isValidCpf(value) {
  const cpf = String(value || "").replace(
    /\D/g,
    ""
  );

  if (!cpf) {
    return true;
  }

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    return false;
  }

  const calculateDigit = (length) => {
    let total = 0;

    for (let index = 0; index < length; index += 1) {
      total +=
        Number(cpf[index]) * (length + 1 - index);
    }

    const remainder = (total * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(cpf[9]) &&
    calculateDigit(10) === Number(cpf[10])
  );
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
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
  const [avatarError, setAvatarError] =
    useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm(createFormFromUser(user));
    setAvatarError(false);
  }, [user]);

  const initials = useMemo(() => {
    const reference =
      form.name.trim() ||
      user?.email ||
      "Trinity";

    return reference
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [form.name, user?.email]);

  const maxBirthDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

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

    if (name === "avatarUrl") {
      setAvatarError(false);
    }

    setForm((current) => ({
      ...current,
      [name]: formattedValue,
    }));
  }

  function resetForm() {
    if (!user) {
      return;
    }

    setForm(createFormFromUser(user));
    setAvatarError(false);
    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name = form.name.trim();
    const phoneNumbers = form.phone.replace(
      /\D/g,
      ""
    );
    const cpfNumbers = form.cpf.replace(/\D/g, "");
    const zipCodeNumbers = form.zipCode.replace(
      /\D/g,
      ""
    );
    const state = form.state.trim();

    if (name.length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }

    if (
      phoneNumbers &&
      ![10, 11].includes(phoneNumbers.length)
    ) {
      toast.error(
        "Informe um telefone com DDD válido."
      );
      return;
    }

    if (!isValidCpf(cpfNumbers)) {
      toast.error("Informe um CPF válido.");
      return;
    }

    if (
      zipCodeNumbers &&
      zipCodeNumbers.length !== 8
    ) {
      toast.error("O CEP precisa ter 8 números.");
      return;
    }

    if (state && state.length !== 2) {
      toast.error(
        "Informe a sigla do estado com 2 letras."
      );
      return;
    }

    if (
      form.birthDate &&
      form.birthDate > maxBirthDate
    ) {
      toast.error(
        "A data de nascimento não pode estar no futuro."
      );
      return;
    }

    if (
      form.avatarUrl.trim() &&
      !isValidUrl(form.avatarUrl.trim())
    ) {
      toast.error(
        "Informe uma URL válida para a foto de perfil."
      );
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        name,
        phone: phoneNumbers || null,
        cpf: cpfNumbers || null,
        birthDate: form.birthDate || null,
        avatarUrl:
          form.avatarUrl.trim() || null,
        zipCode: zipCodeNumbers || null,
        street: form.street.trim() || null,
        number: form.number.trim() || null,
        complement:
          form.complement.trim() || null,
        neighborhood:
          form.neighborhood.trim() || null,
        city: form.city.trim() || null,
        state: state || null,
      });

      setEditing(false);
      toast.success(
        "Perfil atualizado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao salvar perfil:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  if (loading) {
    return <ProfileLoading />;
  }

  if (!isAuthenticated || !user) {
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
            Gerencie seus dados pessoais, endereço,
            segurança e preferências da sua conta
            Trinity.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex items-center gap-4">
                {form.avatarUrl && !avatarError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarUrl}
                    alt={
                      form.name ||
                      "Usuário Trinity"
                    }
                    onError={() =>
                      setAvatarError(true)
                    }
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-black">
                    {initials || "T"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">
                    {form.name ||
                      "Usuário Trinity"}
                  </p>

                  <p className="truncate text-sm text-zinc-500">
                    {form.email ||
                      "E-mail não informado"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-500">
                    Tipo de conta
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-black">
                    {user.role || "CLIENTE"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-500">
                    ID do cliente
                  </span>

                  <span className="max-w-[150px] truncate font-medium text-zinc-300">
                    {user.id || "-"}
                  </span>
                </div>
              </div>
            </section>

            <nav
              aria-label="Menu da conta"
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-3"
            >
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
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 font-bold text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut
                size={19}
                aria-hidden="true"
              />

              Sair da conta
            </button>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
            <div className="flex flex-col gap-4 border-b border-zinc-800 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <User
                    size={22}
                    aria-hidden="true"
                  />

                  <h2 className="text-xl font-bold">
                    Dados do perfil
                  </h2>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  Essas informações serão usadas no
                  checkout e nos seus pedidos.
                </p>
              </div>

              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black transition hover:bg-zinc-200 active:scale-95"
                >
                  <Pencil
                    size={17}
                    aria-hidden="true"
                  />

                  Editar perfil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 font-bold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X
                    size={17}
                    aria-hidden="true"
                  />

                  Cancelar
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-10 p-6"
            >
              <fieldset
                disabled={!editing || saving}
                className="contents"
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
                      icon={<User size={18} />}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      required
                    />

                    <ProfileField
                      label="E-mail"
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                      icon={<Mail size={18} />}
                      helper="O e-mail da conta não pode ser alterado aqui."
                      autoComplete="email"
                    />

                    <ProfileField
                      label="Telefone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      icon={<Phone size={18} />}
                      placeholder="(00) 00000-0000"
                      autoComplete="tel"
                      inputMode="numeric"
                    />

                    <ProfileField
                      label="CPF"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      icon={
                        <ShieldCheck size={18} />
                      }
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />

                    <ProfileField
                      label="Data de nascimento"
                      name="birthDate"
                      type="date"
                      value={form.birthDate}
                      onChange={handleChange}
                      icon={
                        <CalendarDays size={18} />
                      }
                      max={maxBirthDate}
                      autoComplete="bday"
                    />

                    <ProfileField
                      label="URL da foto de perfil"
                      name="avatarUrl"
                      type="url"
                      value={form.avatarUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      autoComplete="url"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <MapPin
                        size={22}
                        aria-hidden="true"
                      />

                      <h3 className="text-xl font-bold">
                        Endereço principal
                      </h3>
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      Este endereço poderá ser usado
                      durante a finalização da compra.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <ProfileField
                      label="CEP"
                      name="zipCode"
                      value={form.zipCode}
                      onChange={handleChange}
                      placeholder="00000-000"
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />

                    <ProfileField
                      label="Rua"
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder="Nome da rua"
                      autoComplete="address-line1"
                    />

                    <ProfileField
                      label="Número"
                      name="number"
                      value={form.number}
                      onChange={handleChange}
                      placeholder="123"
                      autoComplete="address-line2"
                    />

                    <ProfileField
                      label="Complemento"
                      name="complement"
                      value={form.complement}
                      onChange={handleChange}
                      placeholder="Apartamento, bloco..."
                    />

                    <ProfileField
                      label="Bairro"
                      name="neighborhood"
                      value={form.neighborhood}
                      onChange={handleChange}
                      placeholder="Seu bairro"
                    />

                    <ProfileField
                      label="Cidade"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                      autoComplete="address-level2"
                    />

                    <ProfileField
                      label="Estado"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="UF"
                      maxLength={2}
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
              </fieldset>

              {editing && (
                <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 font-bold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Descartar alterações
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    aria-busy={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={18}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <Save
                        size={18}
                        aria-hidden="true"
                      />
                    )}

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
  max,
  autoComplete,
  inputMode,
  required = false,
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
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          >
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
          max={max}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
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
      <div
        aria-hidden="true"
        className="rounded-xl bg-zinc-800 p-2.5 text-zinc-300 transition group-hover:bg-white group-hover:text-black"
      >
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
        aria-hidden="true"
        className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white"
      />
    </Link>
  );
}

function ProfileLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-10 space-y-4">
          <div className="h-4 w-28 rounded bg-zinc-800" />
          <div className="h-10 w-64 rounded-xl bg-zinc-800" />
          <div className="h-5 w-full max-w-xl rounded bg-zinc-900" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="h-80 rounded-3xl bg-zinc-900" />

          <div className="h-[720px] rounded-3xl bg-zinc-900" />
        </div>
      </div>
    </main>
  );
}