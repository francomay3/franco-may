/**
 * English display names for the filter families.
 *
 * These used to be generated into filterFamilies.ts from `FAMILY_LABEL` in the
 * pipeline's families.py. They live here now because they are UI copy in one
 * language: with the string in the export, this page could not be translated
 * without re-running a data build, and changing a word meant regenerating
 * 10,000 features. The export ships the id; the wording is the frontend's.
 *
 * Keyed by the ids in FILTER_FAMILIES. A missing id falls back to the id
 * itself, which is ugly but visible -- better than an empty checkbox label.
 */
export const FAMILY_LABEL: Record<string, string> = {
  graves: "Graves & burial grounds",
  rockart: "Rune stones & rock art",
  forts: "Forts & castles",
  religious: "Churches & sacred places",
  settlement: "Settlements & dwellings",
  farming: "Farming & earthworks",
  industry: "Mining, iron & industry",
  transport: "Roads, bridges & boundaries",
  maritime: "Coast & seafaring",
  hunting: "Hunting traps",
  misc: "Other & uncertain",
};

export function familyLabel(id: string): string {
  return FAMILY_LABEL[id] ?? id;
}
