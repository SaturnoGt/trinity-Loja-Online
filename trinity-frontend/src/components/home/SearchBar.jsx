"use client";

import { Search } from "lucide-react";

export default function SearchBar({
  value = "",
  onChange = () => {},
}) {
  return (
    <section className="mx-auto -mt-10 mb-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">

      <div className="relative">

        <Search
          size={22}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          type="text"
          placeholder="Pesquisar produtos..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            h-16
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900/80
            pl-14
            pr-5
            text-base
            text-white
            outline-none
            backdrop-blur
            transition-all
            duration-300
            placeholder:text-zinc-500
            focus:border-white
            focus:ring-2
            focus:ring-white/20
          "
        />

      </div>

    </section>
  );
}