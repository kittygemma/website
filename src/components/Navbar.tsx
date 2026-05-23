const SECTIONS = [
  { id: "about", label: "About" },
  { id: "gallery", label: "Gallery" },
  { id: "facts", label: "Fun Facts" },
  { id: "favourites", label: "Favourites" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-kitty-pink shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a href="#top" className="text-lg font-bold uppercase tracking-wider text-kitty-white">
          🎀 Hello Kitty
        </a>
        <ul className="flex gap-6 text-sm font-semibold text-kitty-white">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-kitty-red transition-colors">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
