'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function Navbar() {
  const router = useRouter();

  const { cart } = useCart();
  const { favorites } = useFavorites();
  const { isAuthenticated, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');

  const totalItems =
    cart?.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0
    ) || 0;

  const totalFavorites = favorites?.length || 0;

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    router.push('/');
  }

  function handleSearch(event) {
    event.preventDefault();

    const term = search.trim();

    if (!term) return;

    router.push(`/busca?q=${encodeURIComponent(term)}`);

    setSearch('');
    closeMenu();
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? 'border-b border-zinc-800 bg-zinc-950/90 shadow-lg shadow-black/20 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-xl font-black tracking-[0.35em] transition hover:opacity-80 sm:text-2xl"
          >
            TRINITY
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-zinc-300 transition hover:text-white"
            >
              Início
            </Link>

            <Link
              href="/#produtos"
              className="text-zinc-300 transition hover:text-white"
            >
              Produtos
            </Link>

            {isAuthenticated && (
              <Link
                href="/meus-pedidos"
                className="text-zinc-300 transition hover:text-white"
              >
                Pedidos
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition duration-300 focus-within:border-white focus-within:bg-zinc-900"
            >
              <Search
                size={18}
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
                className="w-28 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 transition-all duration-300 focus:w-44"
              />
            </form>

            <Link
              href="/favoritos"
              aria-label="Abrir favoritos"
              className="relative rounded-xl border border-zinc-800 p-3 transition duration-300 hover:border-white hover:bg-zinc-900"
            >
              <Heart
                size={20}
                fill={
                  totalFavorites > 0
                    ? 'currentColor'
                    : 'none'
                }
              />

              {totalFavorites > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {totalFavorites}
                </span>
              )}
            </Link>

            <Link
              href="/carrinho"
              aria-label="Abrir carrinho"
              className="relative rounded-xl border border-zinc-800 p-3 transition duration-300 hover:border-white hover:bg-zinc-900"
            >
              <ShoppingCart size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/perfil"
                  className="text-zinc-300 transition hover:text-white"
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
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/favoritos"
              aria-label="Favoritos"
              className="relative rounded-xl border border-zinc-800 p-2.5"
            >
              <Heart size={19} />

              {totalFavorites > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                  {totalFavorites}
                </span>
              )}
            </Link>

            <Link
              href="/carrinho"
              aria-label="Carrinho"
              className="relative rounded-xl border border-zinc-800 p-2.5"
            >
              <ShoppingCart size={19} />

              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={
                menuOpen ? 'Fechar menu' : 'Abrir menu'
              }
              aria-expanded={menuOpen}
              className="rounded-xl border border-zinc-800 p-2.5 transition hover:border-white hover:bg-zinc-900"
            >
              {menuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        aria-hidden={!menuOpen}
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-40 h-dvh w-full max-w-sm border-l border-zinc-800 bg-zinc-950 px-6 pb-8 pt-24 shadow-2xl shadow-black transition-transform duration-300 md:hidden ${
          menuOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-white"
          >
            <Search
              size={21}
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
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
            />
          </form>

          <nav className="mt-8 flex flex-col gap-2">
            <MobileLink href="/" onClick={closeMenu}>
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
            >
              Favoritos
            </MobileLink>

            <MobileLink
              href="/carrinho"
              onClick={closeMenu}
              counter={totalItems}
            >
              Carrinho
            </MobileLink>

            {isAuthenticated && (
              <>
                <MobileLink
                  href="/perfil"
                  onClick={closeMenu}
                  icon={<User size={19} />}
                >
                  Perfil
                </MobileLink>

                <MobileLink
                  href="/meus-pedidos"
                  onClick={closeMenu}
                >
                  Meus pedidos
                </MobileLink>
              </>
            )}
          </nav>

          <div className="mt-auto border-t border-zinc-800 pt-6">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
              >
                <LogOut size={19} />
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
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  counter,
  icon,
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold text-zinc-200 transition hover:bg-zinc-900 hover:text-white"
    >
      <span className="flex items-center gap-3">
        {icon}
        {children}
      </span>

      {counter > 0 && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
          {counter}
        </span>
      )}
    </Link>
  );
}