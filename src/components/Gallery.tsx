"use client";

import { useEffect, useState } from "react";

type GalleryImage = { city: string; dataUrl: string };
type ApiResponse = { images?: GalleryImage[]; error?: string };

const SKELETON_CITIES = ["Paris", "Tokyo", "New York", "London"];

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generate-images")
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.error || !data.images) {
          setError(data.error ?? "No images returned");
          return;
        }
        setImages(data.images);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load images");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="gallery"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Gallery — Hello Kitty Around the World
        </h2>

        {error ? (
          <p className="rounded-lg bg-kitty-white p-6 text-center text-kitty-red">
            Images couldn&rsquo;t load — try refreshing. ({error})
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(images ?? SKELETON_CITIES.map((city) => ({ city, dataUrl: "" }))).map(
              (img) => (
                <figure key={img.city} className="overflow-hidden rounded-2xl bg-kitty-blush shadow">
                  {img.dataUrl ? (
                    <img
                      src={img.dataUrl}
                      alt={`Hello Kitty in ${img.city}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full animate-pulse bg-kitty-pink/40" />
                  )}
                  <figcaption className="bg-kitty-white px-3 py-2 text-center text-sm font-semibold text-kitty-red">
                    {img.city}
                  </figcaption>
                </figure>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
