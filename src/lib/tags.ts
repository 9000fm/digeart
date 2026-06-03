// Single source of truth for status tag metadata.
// Labels stay English across all locales by design (badge-style identifiers,
// like brand chips). Only the descriptions in About are translated, via descKey.

export type TagId = "hot" | "gem" | "new";

export interface TagMeta {
  id: TagId;
  label: string;
  color: string;     // Tailwind bg-* class for dots/badges
  descKey: string;   // i18n key for the description shown in the About panel
}

export const TAGS: readonly TagMeta[] = [
  { id: "hot", label: "Hot", color: "bg-red-500",    descKey: "about.trending" },
  { id: "gem", label: "Gem", color: "bg-pink-500",   descKey: "about.hiddenGems" },
  { id: "new", label: "New", color: "bg-emerald-500", descKey: "about.addedRecently" },
] as const;

export const TAG_BY_ID: Record<TagId, TagMeta> = Object.fromEntries(
  TAGS.map((t) => [t.id, t])
) as Record<TagId, TagMeta>;
