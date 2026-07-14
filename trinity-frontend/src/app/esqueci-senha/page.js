"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function EsqueciSenhaPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

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
            "Não foi possível enviar o código"
        );
      }

      toast.success(
        data?.message ||
          "Código enviado para seu e-mail"
      );

      router.push(
        `/redefinir-senha?email=${encodeURIComponent(
          normalizedEmail
        )}`
      );
    } catch (error) {
      console.error(
        "Erro ao solicitar redefinição:",
        error
      );

      toast.error(
        error.message ||
          "Não foi possível enviar o código"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-16 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/30">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar para o login
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Segurança
          </p>

          <h1 className="text-3xl font-black">
            Esqueci minha senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Digite o e-mail da sua conta. Enviaremos
            um código de 6 dígitos para redefinir sua
            senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              E-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="voce@email.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Enviando código..."
              : "Enviar código"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-zinc-500">
          Lembrou sua senha?{" "}
          <Link
            href="/login"
            className="font-semibold text-white transition hover:text-zinc-300"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}