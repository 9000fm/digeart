"use client";

import { GENRE_LABELS } from "../types";

interface GenreLabelsProps {
  selected: Set<string>;
  onToggle: (label: string) => void;
}

export function GenreLabels({ selected, onToggle }: GenreLabelsProps) {
  return (
    <div className="mb-2">
      <div className="flex flex-wrap gap-1">
        {GENRE_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => onToggle(label)}
            className={`px-2 py-0.5 text-[12px] rounded-full border transition-all duration-150 ${
              selected.has(label)
                ? "bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-sm"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
