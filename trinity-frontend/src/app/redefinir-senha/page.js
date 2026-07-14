"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<ResetLoading />}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(
    searchParams.get("email") || ""
  );
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !normalizedEmail ||
      !code.trim() ||
      !password ||
      !confirmPassword
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (code.trim().length !== 6) {
      toast.error(
        "O código deve conter 6 dígitos"
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        "A senha precisa ter pelo menos 6 caracteres"
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            code: code.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível redefinir a senha"
        );
      }

      toast.success(
        data?.message ||
          "Senha redefinida com sucesso"
      );

      router.push("/login");
    } catch (error) {
      console.error(
        "Erro ao redefinir senha:",
        error
      );

      toast.error(
        error.message ||
          "Não foi possível redefinir a senha"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      toast.error("Informe seu e-mail");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível reenviar o código"
        );
      }

      toast.success("Novo código enviado");
    } catch (error) {
      toast.error(
        error.message ||
          "Não foi possível reenviar o código"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-16 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/30">
        <Link
          href="/esqueci-senha"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Segurança
          </p>

          <h1 className="text-3xl font-black">
            Criar nova senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Informe o código recebido no e-mail e
            escolha uma nova senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Field
            label="E-mail"
            icon={<Mail size={18} />}
          >
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="voce@email.com"
              autoComplete="email"
              className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
            />
          </Field>

          <Field
            label="Código de 6 dígitos"
            icon={<ShieldCheck size={18} />}
          >
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              className="w-full bg-transparent tracking-[0.3em] text-white outline-none placeholder:text-zinc-600"
            />
          </Field>

          <Field
            label="Nova senha"
            icon={<KeyRound size={18} />}
            action={
              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                className="text-zinc-500 transition hover:text-white"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            }
          >
            <input
              type={
                showPassword ? "text" : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
            />
          </Field>

          <Field
            label="Confirmar nova senha"
            icon={<KeyRound size={18} />}
          >
            <input
              type={
                showPassword ? "text" : "password"
              }
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Redefinindo..."
              : "Redefinir senha"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="mt-5 w-full text-center text-sm font-semibold text-zinc-400 transition hover:text-white disabled:opacity-50"
        >
          Não recebeu? Reenviar código
        </button>
      </section>
    </main>
  );
}

function Field({
  label,
  icon,
  action,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-300">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
        <span className="shrink-0 text-zinc-500">
          {icon}
        </span>

        {children}

        {action}
      </div>
    </div>
  );
}

function ResetLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Carregando...
    </main>
  );
}