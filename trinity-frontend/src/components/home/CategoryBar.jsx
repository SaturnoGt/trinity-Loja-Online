'use client';

export default function CategoryBar({
  selectedCategory,
  onSelectCategory,
}) {
  const categories = [
    'Todos',
    'Camisetas',
    'Oversized',
    'Moletons',
    'Acessórios',
  ];

  return (
    <section className="mx-auto mb-12 flex max-w-7xl gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8">

      {categories.map((category) => {
        const active = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300 ${
              active
                ? 'border-white bg-white text-black'
                : 'border-zinc-700 bg-zinc-900 hover:border-white hover:bg-white hover:text-black'
            }`}
          >
            {category}
          </button>
        );
      })}

    </section>
  );
}