import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[500px] overflow-hidden px-6 py-24 text-center sm:min-h-[600px]"
    >
      <Image
        src="/hero/main.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-kitty-pink/40 via-kitty-pink/30 to-kitty-blush/70"
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="mb-3 text-5xl font-bold text-kitty-red drop-shadow-md sm:text-6xl">
          Hello Kitty
        </h1>
        <p className="mb-6 text-lg text-kitty-red/80 drop-shadow-sm">
          The world&rsquo;s sweetest little kitty, since 1974.
        </p>
        <span className="inline-block rounded-full bg-kitty-white px-4 py-1.5 text-sm font-semibold text-kitty-red shadow">
          🌸 Fan Made with Love
        </span>
      </div>
    </section>
  );
}
