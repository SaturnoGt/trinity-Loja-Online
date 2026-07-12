"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images = [] }) {
  const fallback = "/produtos/trinity/frente.jpeg";

  const initialImage =
    images.find((img) => img.isMain)?.imageUrl ||
    images[0]?.imageUrl ||
    fallback;

  const [selectedImage, setSelectedImage] = useState(initialImage);

  return (
    <div className="space-y-5">

      <div className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

        <Image
          src={selectedImage}
          alt="Produto Trinity"
          width={900}
          height={900}
          priority
          className="aspect-square w-full object-cover transition-all duration-700 group-hover:scale-110"
        />

      </div>

      {images.length > 1 && (

        <div className="flex gap-4 overflow-x-auto pb-2">

          {images.map((image) => (

            <button
              key={image.id}
              onClick={() => setSelectedImage(image.imageUrl)}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                selectedImage === image.imageUrl
                  ? "border-white scale-105"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >

              <Image
                src={image.imageUrl}
                alt="Miniatura"
                width={110}
                height={110}
                className="h-24 w-24 object-cover transition duration-300 hover:scale-110"
              />

            </button>

          ))}

        </div>

      )}

    </div>
  );
}