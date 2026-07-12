import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-32 border-t border-white/10 bg-black/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex transition hover:opacity-80"
            >
              <Image
                src="/logo-full.png"
                alt="TRINITY"
                width={160}
                height={40}
                className="h-auto w-auto object-contain"
                priority
              />
            </Link>

            <p className="max-w-sm text-sm font-light leading-7 text-zinc-400">
              Streetwear minimalista desenvolvido para quem busca identidade,
              qualidade e autenticidade.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Contato da Trinity"
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black"
              >
                <MessageCircle size={19} />
              </a>

              <a
                href="mailto:contato@trinity.com"
                aria-label="E-mail da Trinity"
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black"
              >
                <Mail size={19} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Navegação
            </h3>

            <nav className="flex flex-col gap-3 text-sm text-zinc-400">
              <Link href="/" className="transition hover:text-white">
                Início
              </Link>

              <Link
                href="/#produtos"
                className="transition hover:text-white"
              >
                Produtos
              </Link>

              <Link
                href="/favoritos"
                className="transition hover:text-white"
              >
                Favoritos
              </Link>

              <Link
                href="/carrinho"
                className="transition hover:text-white"
              >
                Carrinho
              </Link>

              <Link
                href="/meus-pedidos"
                className="transition hover:text-white"
              >
                Meus pedidos
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Atendimento
            </h3>

            <nav className="flex flex-col gap-3 text-sm text-zinc-400">
              <Link
                href="/contato"
                className="transition hover:text-white"
              >
                Fale conosco
              </Link>

              <Link
                href="/trocas"
                className="transition hover:text-white"
              >
                Trocas e devoluções
              </Link>

              <Link
                href="/envios"
                className="transition hover:text-white"
              >
                Entregas e prazos
              </Link>

              <Link
                href="/privacidade"
                className="transition hover:text-white"
              >
                Política de privacidade
              </Link>

              <Link
                href="/termos"
                className="transition hover:text-white"
              >
                Termos de uso
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Compra segura
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-zinc-300"
                />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Pagamento protegido
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Seus dados são tratados com segurança.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <Truck
                  size={21}
                  className="mt-0.5 shrink-0 text-zinc-300"
                />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Envio acompanhado
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Acompanhe seu pedido em todas as etapas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <CreditCard
                  size={21}
                  className="mt-0.5 shrink-0 text-zinc-300"
                />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Mercado Pago
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Pagamento rápido e confiável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-zinc-800 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {currentYear} Trinity. Todos os direitos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <MapPin size={16} />

            <span>Brasil</span>

            <span className="text-zinc-700">•</span>

            <span>Feito para vestir identidade.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}