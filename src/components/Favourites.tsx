const FAVOURITES = [
  "🥧 Apple pie",
  "🎵 Music",
  "🍪 Cookies",
  "⭐ Stars",
  "✏️ Drawing",
];

export default function Favourites() {
  return (
    <section
      id="favourites"
      className="border-t-[3px] border-kitty-blush bg-kitty-bg px-6 py-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Favourite Things
        </h2>
        <ul className="flex flex-wrap gap-3">
          {FAVOURITES.map((item) => (
            <li
              key={item}
              className="rounded-full bg-kitty-pink px-4 py-2 text-sm font-semibold text-kitty-white shadow-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
