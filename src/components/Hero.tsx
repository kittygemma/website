export default function Hero() {
  return (
    <section
      id="top"
      className="bg-gradient-to-b from-kitty-pink to-kitty-blush px-6 py-24 text-center"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-7xl" aria-hidden="true">🎀</div>
        <h1 className="mb-3 text-5xl font-bold text-kitty-red sm:text-6xl">
          Hello Kitty
        </h1>
        <p className="mb-6 text-lg text-kitty-red/80">
          The world&rsquo;s sweetest little kitty, since 1974.
        </p>
        <span className="inline-block rounded-full bg-kitty-white px-4 py-1.5 text-sm font-semibold text-kitty-red shadow">
          🌸 Fan Made with Love
        </span>
      </div>
    </section>
  );
}
