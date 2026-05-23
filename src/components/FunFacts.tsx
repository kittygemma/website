const FACTS = [
  { emoji: "🎂", text: "She was created in 1974 by Yuko Shimizu at Sanrio." },
  { emoji: "📏", text: "Her height is officially measured as 5 apples tall." },
  { emoji: "👯", text: "She has a twin sister named Mimmy who wears a yellow bow." },
  { emoji: "🇬🇧", text: "She was born in the suburbs of London, England." },
  { emoji: "🍎", text: "Her favourite food is her mama's homemade apple pie." },
];

export default function FunFacts() {
  return (
    <section
      id="facts"
      className="border-t-[3px] border-kitty-blush bg-kitty-white px-6 py-16"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-kitty-pink">
          Fun Facts
        </h2>
        <ul className="space-y-3">
          {FACTS.map((fact) => (
            <li
              key={fact.text}
              className="flex items-start gap-3 rounded-xl bg-kitty-bg p-4"
            >
              <span className="text-2xl" aria-hidden="true">{fact.emoji}</span>
              <span className="text-base text-neutral-800">{fact.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
