"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(src)}
            className="relative aspect-square overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <Image
              src={src}
              alt={`${name} photo ${i + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute right-5 top-5 text-white/80 hover:text-white"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image src={active} alt={name} fill className="object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
