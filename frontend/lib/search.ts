export type SearchType = "task" | "project" | "event";
export type SearchStatus = "open" | "resolved" | "active" | "scheduled";

export interface SearchDocument {
  id: string;
  type: SearchType;
  status: SearchStatus;
  title: string;
  description: string;
  project: string;
  people: string;
  labels: string;
}

export interface SearchFilters {
  type?: SearchType;
  status?: "open" | "resolved";
  project?: string;
}

export interface SearchHit<T extends SearchDocument> {
  document: T;
  score: number;
  matchedField: "title" | "project" | "people" | "description" | "labels";
  approximate: boolean;
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function withinOneEdit(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 1) return false;
  let a = 0,
    b = 0,
    edits = 0;
  while (a < left.length && b < right.length) {
    if (left[a] === right[b]) {
      a++;
      b++;
      continue;
    }
    if (++edits > 1) return false;
    if (
      left.length === right.length &&
      left[a] === right[b + 1] &&
      left[a + 1] === right[b]
    ) {
      a += 2;
      b += 2;
      continue;
    }
    if (left.length >= right.length) a++;
    if (right.length >= left.length) b++;
  }
  return edits + Number(a < left.length || b < right.length) <= 1;
}

// Every query term must match. Single characters only match title word prefixes;
// description substrings cannot flood the results. Fuzzy matching starts at 4 letters.
export function searchDocuments<T extends SearchDocument>(
  documents: readonly T[],
  query: string,
  filters: SearchFilters = {},
): SearchHit<T>[] {
  const normalized = normalizeSearch(query).slice(0, 200);
  const terms = [...new Set(normalized.split(" ").filter(Boolean))];
  const projectFilter = normalizeSearch(filters.project ?? "");
  const searching = terms.length > 0;
  if (!searching && !filters.type && !filters.status && !projectFilter)
    return [];

  const hits: SearchHit<T>[] = [];
  for (const document of documents) {
    if (filters.type && document.type !== filters.type) continue;
    if (filters.status && document.status !== filters.status) continue;
    if (projectFilter && normalizeSearch(document.project) !== projectFilter)
      continue;
    const fields = [
      { name: "title", value: document.title, weight: 100 },
      { name: "project", value: document.project, weight: 55 },
      { name: "people", value: document.people, weight: 45 },
      { name: "labels", value: document.labels, weight: 30 },
      { name: "description", value: document.description, weight: 15 },
    ] as const;
    const indexed = fields.map((field) => ({
      ...field,
      normalized: normalizeSearch(field.value),
      words: normalizeSearch(field.value).split(" "),
    }));
    let score = 0;
    let approximate = false;
    let matchedField: SearchHit<T>["matchedField"] = "title";
    let bestFieldScore = 0;
    let matches = true;
    for (const term of terms) {
      let best = 0;
      let bestApproximate = false;
      let fieldName: SearchHit<T>["matchedField"] = "title";
      for (const field of indexed) {
        if (term.length === 1 && field.name !== "title") continue;
        let value = 0;
        let fuzzy = false;
        if (field.words.includes(term)) value = field.weight;
        else if (field.words.some((word) => word.startsWith(term)))
          value = field.weight * 0.8;
        else if (
          term.length >= 3 &&
          field.words.some((word) => word.includes(term))
        )
          value = field.weight * 0.45;
        else if (
          term.length >= 4 &&
          field.name !== "description" &&
          field.words.some((word) => withinOneEdit(term, word))
        ) {
          value = field.weight * 0.3;
          fuzzy = true;
        }
        if (value > best) {
          best = value;
          fieldName = field.name;
          bestApproximate = fuzzy;
        }
      }
      if (!best) {
        matches = false;
        break;
      }
      score += best;
      approximate ||= bestApproximate;
      if (best > bestFieldScore) {
        bestFieldScore = best;
        matchedField = fieldName;
      }
    }
    if (!matches) continue;
    const title = indexed[0].normalized;
    if (searching && title === normalized) score += 200;
    else if (searching && title.startsWith(normalized)) score += 80;
    else if (searching && terms.length > 1 && title.includes(normalized))
      score += 40;
    hits.push({ document, score, matchedField, approximate });
  }
  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.document.title.localeCompare(b.document.title) ||
      a.document.id.localeCompare(b.document.id),
  );
}

// Keep original characters and accents in highlighted research titles.
export function highlightMatches(
  value: string,
  query: string,
): { text: string; match: boolean }[] {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  return value
    .split(/([\p{L}\p{N}]+)/u)
    .filter(Boolean)
    .map((part) => {
      const word = normalizeSearch(part);
      return {
        text: part,
        match:
          !!word &&
          terms.some((term) =>
            term.length === 1 ? word.startsWith(term) : word.includes(term),
          ),
      };
    });
}
