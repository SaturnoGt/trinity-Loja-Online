'use client';

import { useEffect, useState } from 'react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

export default function AdminLayout({
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          pathname
        )}`
      );
      return;
    }

    if (!isAdmin) {
      router.replace('/');
    }
  }, [
    loading,
    isAuthenticated,
    isAdmin,
    pathname,
    router,
  ]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  if (loading) {
    return <AdminLoading />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader
        pathname={pathname}
        user={user}
        onOpenMenu={() =>
          setMenuOpen(true)
        }
      />

      {menuOpen && (
        <>
          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            aria-label="Fechar menu"
          />

          <div className="fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] lg:hidden">
            <AdminSidebar
              pathname={pathname}
              user={user}
              onLogout={handleLogout}
              mobile
              onClose={() =>
                setMenuOpen(false)
              }
            />
          </div>
        </>
      )}

      <div className="mx-auto flex max-w-[1700px]">
        <AdminSidebar
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
        />

        <main className="min-w-0 flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-white" />

        <p className="mt-5 text-sm font-semibold text-zinc-400">
          Verificando acesso administrativo...
        </p>
      </div>
    </div>
  );
}