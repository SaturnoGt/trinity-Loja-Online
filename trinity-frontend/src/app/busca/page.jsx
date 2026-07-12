import { Suspense } from 'react';

import BuscaContent from './BuscaContent';

function BuscaLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-16 sm:px-6">
      <div className="animate-pulse">
        <div className="mb-10 h-9 w-80 rounded-lg bg-zinc-800" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[480px] rounded-3xl border border-zinc-800 bg-zinc-900"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<BuscaLoading />}>
      <BuscaContent />
    </Suspense>
  );
}