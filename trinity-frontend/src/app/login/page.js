'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error('Preencha e-mail e senha.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível fazer login.'
        );
      }

      const token =
        data?.token ||
        data?.accessToken;

      if (!token) {
        throw new Error(
          'A API não retornou o token de acesso.'
        );
      }

      await login(token);

      toast.success(
        data?.message ||
          'Login realizado com sucesso.'
      );

      router.replace('/');
      router.refresh();
    } catch (requestError) {
      console.error(
        'Erro no login:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível entrar.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-16 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-200">
            <LogIn size={23} />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Trinity
          </p>

          <h1 className="text-3xl font-black">
            Entrar na conta
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Acesse seus pedidos, favoritos e dados da
            conta.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              E-mail
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
              <Mail
                size={18}
                className="shrink-0 text-zinc-500"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="voce@email.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                disabled={loading}
                required
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-zinc-300"
              >
                Senha
              </label>

              <Link
                href="/esqueci-senha"
                className="text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                Esqueci minha senha
              </Link>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
              <LockKeyhole
                size={18}
                className="shrink-0 text-zinc-500"
              />

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={loading}
                required
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
                aria-pressed={showPassword}
                className="shrink-0 text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  size={19}
                  className="animate-spin"
                />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={19} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-zinc-500">
          Ainda não tem conta?{' '}
          <Link
            href="/cadastro"
            className="font-semibold text-white transition hover:text-zinc-300"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}