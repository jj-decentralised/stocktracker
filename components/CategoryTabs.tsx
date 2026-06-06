import { CATEGORIES, type Category } from "@/lib/universe";

export function CategoryTabs({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-1" aria-label="Asset category">
      {CATEGORIES.map((c) => {
        const isActive = c.key === active;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-current={isActive ? "page" : undefined}
            className={`relative -mb-px border-b-2 pb-2 pt-1 text-lg transition-colors cursor-pointer ${
              isActive
                ? "border-ink text-ink"
                : "border-transparent text-faint hover:text-muted"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </nav>
  );
}
