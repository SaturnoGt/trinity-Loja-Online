'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';
import {
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

function formatCounter(value) {
  return value > 99 ? '99+' : value;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { cart } = useCart();
  const { favorites } = useFavorites();
  const {
    isAuthenticated,
    loading: authLoading,
    logout,
  } = useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);
  const [scrolled, setScrolled] =
    useState(false);
  const [search, setSearch] = useState('');

  const totalItems = useMemo(() => {
    if (!Array.isArray(cart)) {
      return 0;
    }

    return cart.reduce((total, item) => {
      const quantity = Number(
        item?.quantity || 0
      );

      return (
        total +
        (Number.isFinite(quantity)
          ? Math.max(quantity, 0)
          : 0)
      );
    }, 0);
  }, [cart]);

  const totalFavorites = Array.isArray(
    favorites
  )
    ? favorites.length
    : 0;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    router.replace('/');
  }

  function handleSearch(event) {
    event.preventDefault();

    const term = search.trim();

    if (!term) {
      return;
    }

    router.push(
      `/busca?q=${encodeURIComponent(term)}`
    );

    setSearch('');
    closeMenu();
  }

  function isCurrentRoute(href) {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? 'border-b border-zinc-800 bg-zinc-950/90 shadow-lg shadow-black/20 backdrop-blur-xl'
            : 'bg-zinc-950/70 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="Ir para a página inicial"
            className="shrink-0 text-xl font-black tracking-[0.35em] transition hover:opacity-80 sm:text-2xl"
          >
            TRINITY
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-8 md:flex"
          >
            <DesktopLink
              href="/"
              active={isCurrentRoute('/')}
            >
              Início
            </DesktopLink>

            <DesktopLink
              href="/#produtos"
              active={false}
            >
              Produtos
            </DesktopLink>

            {isAuthenticated && (
              <DesktopLink
                href="/meus-pedidos"
                active={isCurrentRoute(
                  '/meus-pedidos'
                )}
              >
                Pedidos
              </DesktopLink>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <form
              onSubmit={handleSearch}
              role="search"
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition duration-300 focus-within:border-white focus-within:bg-zinc-900"
            >
              <Search
                size={18}
                aria-hidden="true"
                className="shrink-0 text-zinc-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar..."
                aria-label="Buscar produtos"
                autoComplete="off"
                className="w-28 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 transition-all duration-300 focus:w-44"
              />

              <button
                type="submit"
                className="sr-only"
              >
                Buscar
              </button>
            </form>

            <IconLink
              href="/favoritos"
              label="Abrir favoritos"
              counter={totalFavorites}
              active={isCurrentRoute(
                '/favoritos'
              )}
            >
              <Heart
                size={20}
                aria-hidden="true"
                fill={
                  totalFavorites > 0
                    ? 'currentColor'
                    : 'none'
                }
              />
            </IconLink>

            <IconLink
              href="/carrinho"
              label="Abrir carrinho"
              counter={totalItems}
              active={isCurrentRoute(
                '/carrinho'
              )}
            >
              <ShoppingCart
                size={20}
                aria-hidden="true"
              />
            </IconLink>

            {!authLoading &&
              (isAuthenticated ? (
                <>
                  <Link
                    href="/perfil"
                    aria-current={
                      isCurrentRoute('/perfil')
                        ? 'page'
                        : undefined
                    }
                    className={`transition ${
                      isCurrentRoute('/perfil')
                        ? 'text-white'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    Perfil
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-white px-5 py-2 font-semibold text-black transition duration-300 hover:scale-105 hover:bg-zinc-200 active:scale-95"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-white px-5 py-2 font-semibold text-black transition duration-300 hover:scale-105 hover:bg-zinc-200 active:scale-95"
                >
                  Entrar
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <IconLink
              href="/favoritos"
              label="Abrir favoritos"
              counter={totalFavorites}
              mobile
              active={isCurrentRoute(
                '/favoritos'
              )}
            >
              <Heart
                size={19}
                aria-hidden="true"
                fill={
                  totalFavorites > 0
                    ? 'currentColor'
                    : 'none'
                }
              />
            </IconLink>

            <IconLink
              href="/carrinho"
              label="Abrir carrinho"
              counter={totalItems}
              mobile
              active={isCurrentRoute(
                '/carrinho'
              )}
            >
              <ShoppingCart
                size={19}
                aria-hidden="true"
              />
            </IconLink>

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (currentValue) =>
                    !currentValue
                )
              }
              aria-label={
                menuOpen
                  ? 'Fechar menu'
                  : 'Abrir menu'
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="rounded-xl border border-zinc-800 p-2.5 transition hover:border-white hover:bg-zinc-900"
            >
              {menuOpen ? (
                <X
                  size={22}
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  size={22}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        id="mobile-menu"
        aria-label="Menu de navegação"
        aria-hidden={!menuOpen}
        className={`fixed right-0 top-0 z-40 h-dvh w-full max-w-sm overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-6 pb-8 pt-24 shadow-2xl shadow-black transition-transform duration-300 md:hidden ${
          menuOpen
            ? 'translate-x-0'
            : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex min-h-full flex-col">
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-white"
          >
            <Search
              size={21}
              aria-hidden="true"
              className="shrink-0 text-zinc-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar produtos..."
              aria-label="Buscar produtos"
              autoComplete="off"
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
            />

            <button
              type="submit"
              aria-label="Realizar busca"
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <Search
                size={18}
                aria-hidden="true"
              />
            </button>
          </form>

          <nav
            aria-label="Navegação móvel"
            className="mt-8 flex flex-col gap-2"
          >
            <MobileLink
              href="/"
              onClick={closeMenu}
              active={isCurrentRoute('/')}
            >
              Início
            </MobileLink>

            <MobileLink
              href="/#produtos"
              onClick={closeMenu}
            >
              Produtos
            </MobileLink>

            <MobileLink
              href="/favoritos"
              onClick={closeMenu}
              counter={totalFavorites}
              active={isCurrentRoute(
                '/favoritos'
              )}
            >
              Favoritos
            </MobileLink>

            <MobileLink
              href="/carrinho"
              onClick={closeMenu}
              counter={totalItems}
              active={isCurrentRoute(
                '/carrinho'
              )}
            >
              Carrinho
            </MobileLink>

            {!authLoading &&
              isAuthenticated && (
                <>
                  <MobileLink
                    href="/perfil"
                    onClick={closeMenu}
                    icon={
                      <User
                        size={19}
                        aria-hidden="true"
                      />
                    }
                    active={isCurrentRoute(
                      '/perfil'
                    )}
                  >
                    Perfil
                  </MobileLink>

                  <MobileLink
                    href="/meus-pedidos"
                    onClick={closeMenu}
                    active={isCurrentRoute(
                      '/meus-pedidos'
                    )}
                  >
                    Meus pedidos
                  </MobileLink>
                </>
              )}
          </nav>

          <div className="mt-auto border-t border-zinc-800 pt-6">
            {!authLoading &&
              (isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                >
                  <LogOut
                    size={19}
                    aria-hidden="true"
                  />
                  Sair
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block rounded-2xl bg-white py-3.5 text-center font-bold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                >
                  Entrar
                </Link>
              ))}
          </div>
        </div>
      </aside>
    </>
  );
}

function DesktopLink({
  href,
  children,
  active,
}) {
  return (
    <Link
      href={href}
      aria-current={
        active ? 'page' : undefined
      }
      className={`transition ${
        active
          ? 'font-semibold text-white'
          : 'text-zinc-300 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function IconLink({
  href,
  label,
  counter = 0,
  active = false,
  mobile = false,
  children,
}) {
  return (
    <Link
      href={href}
      aria-label={
        counter > 0
          ? `${label}. ${counter} ${
              counter === 1 ? 'item' : 'itens'
            }`
          : label
      }
      aria-current={
        active ? 'page' : undefined
      }
      className={`relative rounded-xl border transition duration-300 ${
        mobile ? 'p-2.5' : 'p-3'
      } ${
        active
          ? 'border-white bg-zinc-900 text-white'
          : 'border-zinc-800 hover:border-white hover:bg-zinc-900'
      }`}
    >
      {children}

      {counter > 0 && (
        <span
          aria-hidden="true"
          className={`absolute flex items-center justify-center rounded-full bg-red-500 px-1 font-bold text-white ${
            mobile
              ? '-right-1.5 -top-1.5 h-4 min-w-4 text-[10px]'
              : '-right-2 -top-2 h-5 min-w-5 text-xs'
          }`}
        >
          {formatCounter(counter)}
        </span>
      )}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  counter = 0,
  icon,
  active = false,
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={
        active ? 'page' : undefined
      }
      className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold transition ${
        active
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-200 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {children}
      </span>

      {counter > 0 && (
        <span
          aria-hidden="true"
          className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white"
        >
          {formatCounter(counter)}
        </span>
      )}
    </Link>
  );
}