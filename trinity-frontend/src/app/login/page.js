'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Erro ao fazer login'
        );
      }

      await login(data.token);

      toast.success('Login realizado com sucesso');

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Erro no login:', error);

      toast.error(
        error.message || 'Não foi possível entrar'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-16 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Trinity
          </p>

          <h1 className="text-3xl font-black">
            Entrar na conta
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            Acesse seus pedidos, favoritos e dados da conta.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
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
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="voce@email.com"
                autoComplete="email"
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Sua senha"
                autoComplete="current-password"
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
                className="shrink-0 text-zinc-500 transition hover:text-white"
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
            className="w-full rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
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