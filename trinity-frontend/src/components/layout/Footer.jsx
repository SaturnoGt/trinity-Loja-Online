import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";

const navigationLinks = [
  {
    label: "Início",
    href: "/",
  },
  {
    label: "Produtos",
    href: "/#produtos",
  },
  {
    label: "Favoritos",
    href: "/favoritos",
  },
  {
    label: "Carrinho",
    href: "/carrinho",
  },
  {
    label: "Meus pedidos",
    href: "/meus-pedidos",
  },
];

const supportLinks = [
  {
    label: "Fale conosco",
    href: "/contato",
  },
  {
    label: "Trocas e devoluções",
    href: "/trocas",
  },
  {
    label: "Entregas e prazos",
    href: "/envios",
  },
  {
    label: "Política de privacidade",
    href: "/privacidade",
  },
  {
    label: "Termos de uso",
    href: "/termos",
  },
];

const securityItems = [
  {
    title: "Pagamento protegido",
    description:
      "Seus dados são tratados com segurança durante toda a compra.",
    icon: ShieldCheck,
  },
  {
    title: "Envio acompanhado",
    description:
      "Acompanhe o andamento do seu pedido em todas as etapas.",
    icon: Truck,
  },
  {
    title: "Mercado Pago",
    description:
      "Pagamento rápido, protegido e processado pelo Mercado Pago.",
    icon: CreditCard,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-32 border-t border-white/10 bg-black/50 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <Link
              href="/"
              aria-label="Ir para a página inicial da Trinity"
              className="inline-flex rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
            >
              <Image
                src="/logo-full.png"
                alt="Trinity"
                width={160}
                height={40}
                sizes="160px"
                className="h-auto w-auto object-contain"
              />
            </Link>

            <p className="max-w-sm text-sm font-light leading-7 text-zinc-400">
              Streetwear minimalista desenvolvido para quem busca
              identidade, qualidade e autenticidade.
            </p>

            <div
              className="flex items-center gap-3"
              aria-label="Canais de atendimento"
            >
              <Link
                href="/contato"
                aria-label="Falar com a Trinity"
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <MessageCircle
                  size={19}
                  aria-hidden="true"
                />
              </Link>

              <a
                href="mailto:contato@trinity.com"
                aria-label="Enviar e-mail para a Trinity"
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Mail
                  size={19}
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          <FooterLinks
            title="Navegação"
            ariaLabel="Links de navegação"
            links={navigationLinks}
          />

          <FooterLinks
            title="Atendimento"
            ariaLabel="Links de atendimento"
            links={supportLinks}
          />

          <div>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Compra segura
            </h2>

            <div className="space-y-4">
              {securityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <Icon
                      size={21}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-zinc-300"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-zinc-800 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {currentYear} Trinity. Todos os direitos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <MapPin
              size={16}
              aria-hidden="true"
            />

            <span>Brasil</span>

            <span
              aria-hidden="true"
              className="text-zinc-700"
            >
              •
            </span>

            <span>Feito para vestir identidade.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  ariaLabel,
  links,
}) {
  return (
    <div>
      <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
        {title}
      </h2>

      <nav
        aria-label={ariaLabel}
        className="flex flex-col items-start gap-3 text-sm text-zinc-400"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}