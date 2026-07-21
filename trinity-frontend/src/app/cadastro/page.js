'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Send,
  User,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function CadastroPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] =
    useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setResendSeconds((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [resendSeconds]);

  function handleChange(event) {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === 'code') {
      nextValue = value
        .replace(/\D/g, '')
        .slice(0, 6);
    }

    setForm((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));
  }

  function getNormalizedEmail() {
    return form.email.trim().toLowerCase();
  }

  function validateAccountFields() {
    const normalizedName = form.name.trim();
    const normalizedEmail = getNormalizedEmail();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !form.password ||
      !form.confirmPassword
    ) {
      toast.error('Preencha todos os campos.');
      return false;
    }

    if (normalizedName.length < 2) {
      toast.error(
        'O nome precisa ter pelo menos 2 caracteres.'
      );
      return false;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error('Informe um e-mail válido.');
      return false;
    }

    if (form.password.length < 6) {
      toast.error(
        'A senha precisa ter pelo menos 6 caracteres.'
      );
      return false;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return false;
    }

    return true;
  }

  async function handleSendCode() {
    if (sendingCode || loading) {
      return;
    }

    if (!validateAccountFields()) {
      return;
    }

    const normalizedEmail = getNormalizedEmail();

    try {
      setSendingCode(true);

      const response = await fetch(
        `${API_URL}/auth/request-email-verification`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível enviar o código.'
        );
      }

      setCodeSent(true);
      setResendSeconds(60);

      toast.success(
        data?.message ||
          'Código enviado para seu e-mail.'
      );
    } catch (requestError) {
      console.error(
        'Erro ao enviar código:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível enviar o código.'
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || sendingCode) {
      return;
    }

    if (!validateAccountFields()) {
      return;
    }

    if (!codeSent) {
      toast.error(
        'Primeiro solicite o código de verificação.'
      );
      return;
    }

    if (form.code.length !== 6) {
      toast.error(
        'Digite o código de 6 números recebido por e-mail.'
      );
      return;
    }

    const normalizedName = form.name.trim();
    const normalizedEmail = getNormalizedEmail();

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            password: form.password,
            code: form.code,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            'Não foi possível criar sua conta.'
        );
      }

      toast.success(
        data?.message ||
          'Conta criada com sucesso.'
      );

      router.replace('/login');
      router.refresh();
    } catch (requestError) {
      console.error(
        'Erro no cadastro:',
        requestError
      );

      toast.error(
        requestError?.message ||
          'Não foi possível criar sua conta.'
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
            <UserPlus size={23} />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Trinity
          </p>

          <h1 className="text-3xl font-black">
            Criar conta
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Preencha seus dados e confirme seu e-mail.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              Nome
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
              <User
                size={18}
                className="shrink-0 text-zinc-500"
              />

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                autoComplete="name"
                disabled={loading || sendingCode}
                required
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

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
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                disabled={
                  loading ||
                  sendingCode ||
                  codeSent
                }
                required
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {codeSent && (
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setForm((current) => ({
                    ...current,
                    code: '',
                  }));
                  setResendSeconds(0);
                }}
                disabled={loading || sendingCode}
                className="mt-2 text-xs font-semibold text-zinc-400 transition hover:text-white disabled:opacity-50"
              >
                Alterar e-mail
              </button>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              Senha
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
              <LockKeyhole
                size={18}
                className="shrink-0 text-zinc-500"
              />

              <input
                id="password"
                name="password"
                type={
                  showPassword ? 'text' : 'password'
                }
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
                disabled={loading || sendingCode}
                minLength={6}
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
                disabled={loading || sendingCode}
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-zinc-300"
            >
              Confirmar senha
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
              <LockKeyhole
                size={18}
                className="shrink-0 text-zinc-500"
              />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repita sua senha"
                autoComplete="new-password"
                disabled={loading || sendingCode}
                minLength={6}
                required
                className="w-full bg-transparent text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                disabled={loading || sendingCode}
                aria-label={
                  showConfirmPassword
                    ? 'Ocultar confirmação de senha'
                    : 'Mostrar confirmação de senha'
                }
                aria-pressed={showConfirmPassword}
                className="shrink-0 text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {!codeSent ? (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 py-3.5 font-bold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingCode ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Enviando código...
                </>
              ) : (
                <>
                  <Send size={19} />
                  Enviar código
                </>
              )}
            </button>
          ) : (
            <>
              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-semibold text-zinc-300"
                >
                  Código de verificação
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 transition focus-within:border-white">
                  <KeyRound
                    size={18}
                    className="shrink-0 text-zinc-500"
                  />

                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={loading || sendingCode}
                    required
                    className="w-full bg-transparent text-center text-lg font-bold tracking-[0.35em] text-white outline-none placeholder:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Digite o código de 6 números enviado
                  para {getNormalizedEmail()}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={
                  resendSeconds > 0 ||
                  sendingCode ||
                  loading
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingCode ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Reenviando...
                  </>
                ) : resendSeconds > 0 ? (
                  <>
                    <RefreshCw size={17} />
                    Reenviar em {resendSeconds}s
                  </>
                ) : (
                  <>
                    <RefreshCw size={17} />
                    Reenviar código
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading || sendingCode}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus size={19} />
                    Criar conta
                  </>
                )}
              </button>
            </>
          )}
        </form>

        <p className="mt-7 text-center text-sm text-zinc-500">
          Já tem uma conta?{' '}
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