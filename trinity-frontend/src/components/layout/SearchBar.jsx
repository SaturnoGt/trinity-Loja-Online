'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();

  const [search, setSearch] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!search.trim()) return;

    router.push(`/busca?q=${search}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex
        items-center
        gap-2
        rounded-xl
        border
        border-zinc-800
        bg-zinc-900/60
        px-3
        py-2
        transition
        duration-300
        focus-within:border-white
        focus-within:bg-zinc-900
      "
    >
      <Search
        size={18}
        className="text-zinc-400"
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar produtos..."
        className="
          w-32
          bg-transparent
          text-sm
          text-white
          outline-none
          placeholder:text-zinc-500
          transition-all
          duration-300
          focus:w-52
        "
      />
    </form>
  );
}