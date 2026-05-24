import Image from "next/image";

const IMAGES = [
  { city: "Paris", src: "/gallery/paris.png" },
  { city: "Tokyo", src: "/gallery/tokyo.png" },
  { city: "New York", src: "/gallery/new-york.png" },
  { city: "London", src: "/gallery/london.png" },
];

export default function Gallery() {
  return (
    <section
      id="gallery"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Gallery — Hello Kitty Around the World
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMAGES.map((img) => (
            <figure key={img.city} className="overflow-hidden rounded-2xl bg-kitty-blush shadow">
              <Image
                src={img.src}
                alt={`Hello Kitty in ${img.city}`}
                width={512}
                height={512}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="bg-kitty-white px-3 py-2 text-center text-sm font-semibold text-kitty-red">
                {img.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
