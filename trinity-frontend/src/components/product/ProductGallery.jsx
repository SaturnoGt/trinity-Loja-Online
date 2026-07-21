"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function ProductGallery({
  images = [],
  productName = "Produto Trinity",
}) {
  const fallback = "/produtos/trinity/frente.jpeg";

  const initialImage = useMemo(() => {
    return (
      images.find((img) => img.isMain)?.imageUrl ||
      images[0]?.imageUrl ||
      fallback
    );
  }, [images]);

  const [selectedImage, setSelectedImage] =
    useState(initialImage);

  useEffect(() => {
    setSelectedImage(initialImage);
  }, [initialImage]);

  return (
    <div className="space-y-5">
      <div className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <Image
          src={selectedImage}
          alt={productName}
          width={900}
          height={900}
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          className="aspect-square w-full object-cover transition-all duration-700 group-hover:scale-110"
        />
      </div>

      {images.length > 1 && (
        <div
          className="flex gap-4 overflow-x-auto pb-2"
          role="list"
          aria-label="Imagens do produto"
        >
          {images.map((image, index) => {
            const active =
              selectedImage === image.imageUrl;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImage(image.imageUrl)
                }
                aria-label={`Imagem ${
                  index + 1
                } do produto`}
                aria-pressed={active}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  active
                    ? "scale-105 border-white"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt={`${productName} ${index + 1}`}
                  width={110}
                  height={110}
                  sizes="110px"
                  className="h-24 w-24 object-cover transition duration-300 hover:scale-110"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}