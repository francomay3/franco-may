import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';
import Fuse from 'fuse.js';
import { placeUuidOf, placeUuidsByPrefix } from '@/lib/lamning';

/**
 * Find a place from whatever was typed into the admin search.
 *
 * An id opens the place: a register number, a full uuid, or the eight
 * characters the table shows, when only one place has them. Anything else
 * is a text search. Titles come before descriptions, and a literal match
 * comes before an approximate one, in Swedish and in English. One hit is
 * the same as an id: the caller opens the place and skips the list.
 */

export type SearchKind =
  | 'title'
  | 'title-fuzzy'
  | 'description'
  | 'description-fuzzy'
  | 'id';

export type SearchHit = {
  id: string;
  name: string;
  kind: SearchKind;
  lang: 'sv' | 'en' | null;
  snippet: string;
};

export type SearchOutcome =
  | { redirect: string }
  | { hits: SearchHit[]; total: number };

type Lang = 'sv' | 'en';

type Doc = {
  id: string;
  name: string;
  svTitle: string;
  enTitle: string;
  svBody: string;
  enBody: string;
  svTitleFold: string;
  enTitleFold: string;
  svBodyFold: string;
  enBodyFold: string;
};

type Candidate = SearchHit & { rank: number; score: number };

const SHOWN = 300;
const PREFIX_LIMIT = 20;
const FUZZY_LIMIT = 80;

let corpus: { docs: Doc[]; byId: Map<string, Doc> } | null = null;
let titleSv: Fuse<Doc> | null = null;
let titleEn: Fuse<Doc> | null = null;
let bodySv: Fuse<Doc> | null = null;
let bodyEn: Fuse<Doc> | null = null;

function fold(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase('sv-SE');
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= 180) {
    return flat;
  }
  return `${flat.slice(0, 177)}…`;
}

function around(text: string, at: number, len: number): string {
  if (fold(text).length !== text.length) {
    return clip(text);
  }
  const start = Math.max(0, at - 48);
  const end = Math.min(text.length, at + Math.max(len, 8) + 100);
  let s = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) {
    s = `…${s}`;
  }
  if (end < text.length) {
    s = `${s}…`;
  }
  return s;
}

function loadCorpus() {
  if (corpus) {
    return corpus;
  }
  const byId = new Map<string, Doc>();
  const blank = (id: string): Doc => ({
    id,
    name: '',
    svTitle: '',
    enTitle: '',
    svBody: '',
    enBody: '',
    svTitleFold: '',
    enTitleFold: '',
    svBodyFold: '',
    enBodyFold: '',
  });
  const dir = join(process.cwd(), 'public', 'descriptions');
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const bag = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<
      string,
      { title?: string; content?: string }
    >;
    for (const [id, desc] of Object.entries(bag)) {
      const doc = blank(id);
      doc.svTitle = desc.title?.trim() || '';
      doc.svBody = desc.content?.trim() || '';
      doc.svTitleFold = fold(doc.svTitle);
      doc.svBodyFold = fold(doc.svBody);
      doc.name = doc.svTitle;
      byId.set(id, doc);
    }
  }

  const enPath = join(process.cwd(), 'data', 'descriptions.en.db');
  if (existsSync(enPath)) {
    const db = new DatabaseSync(enPath, { readOnly: true });
    try {
      const rows = db
        .prepare('SELECT uuid, title, content FROM descriptions')
        .all() as {
        uuid: string;
        title: string | null;
        content: string | null;
      }[];
      for (const row of rows) {
        const doc = byId.get(row.uuid) ?? blank(row.uuid);
        doc.enTitle = row.title?.trim() || '';
        doc.enBody = row.content?.trim() || '';
        doc.enTitleFold = fold(doc.enTitle);
        doc.enBodyFold = fold(doc.enBody);
        if (!doc.name) {
          doc.name = doc.enTitle;
        }
        byId.set(row.uuid, doc);
      }
    } finally {
      db.close();
    }
  }

  corpus = { docs: [...byId.values()], byId };
  return corpus;
}

function fuseFor(
  docs: Doc[],
  key: 'svTitle' | 'enTitle' | 'svBody' | 'enBody',
  threshold: number
) {
  return new Fuse(docs, {
    keys: [key],
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
    ignoreDiacritics: true,
    ignoreFieldNorm: true,
    // A title is one short line, so a typo can sit a little further from the
    // word. A description is a page, and the same slack matches a different
    // place that merely shares an ending.
    threshold,
    minMatchCharLength: 3,
    useTokenSearch: true,
    tokenMatch: 'all',
  });
}

function indexes() {
  const { docs } = loadCorpus();
  titleSv ||= fuseFor(
    docs.filter(d => d.svTitle),
    'svTitle',
    0.25
  );
  titleEn ||= fuseFor(
    docs.filter(d => d.enTitle),
    'enTitle',
    0.25
  );
  bodySv ||= fuseFor(
    docs.filter(d => d.svBody),
    'svBody',
    0.15
  );
  bodyEn ||= fuseFor(
    docs.filter(d => d.enBody),
    'enBody',
    0.15
  );
  return { titleSv, titleEn, bodySv, bodyEn };
}

function isHexPrefix(q: string): boolean {
  if (!/^[0-9a-f-]{8,}$/i.test(q)) {
    return false;
  }
  const hex = q.replace(/-/g, '');
  return hex.length >= 8 && /^[0-9a-f]+$/i.test(hex);
}

function prefixIds(prefix: string): string[] | null {
  const found = placeUuidsByPrefix(prefix, PREFIX_LIMIT);
  if (found === null) {
    return null;
  }
  const { byId } = loadCorpus();
  const seen = new Set(found);
  const p = prefix.toLowerCase();
  for (const id of byId.keys()) {
    if (!id.startsWith(p) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    if (seen.size > PREFIX_LIMIT) {
      return null;
    }
  }
  return [...seen];
}

function idHit(id: string): SearchHit {
  const doc = loadCorpus().byId.get(id);
  return {
    id,
    name: doc?.name || '',
    kind: 'id',
    lang: null,
    snippet: '',
  };
}

function locate(
  hay: string,
  needle: string,
  words: string[]
): { kind: 'phrase' | 'terms'; at: number } | null {
  if (!hay) {
    return null;
  }
  const at = hay.indexOf(needle);
  if (at >= 0) {
    return { kind: 'phrase', at };
  }
  if (words.length === 0) {
    return null;
  }
  if (words.length === 1 && words[0] === needle) {
    return null;
  }
  let first = -1;
  for (const word of words) {
    const i = hay.indexOf(word);
    if (i < 0) {
      return null;
    }
    if (first < 0 || i < first) {
      first = i;
    }
  }
  return { kind: 'terms', at: first };
}

function titleSnippet(doc: Doc, lang: Lang): string {
  const matched = lang === 'sv' ? doc.svTitle : doc.enTitle;
  const body = lang === 'sv' ? doc.svBody : doc.enBody;
  if (matched && fold(matched) !== fold(doc.name)) {
    return clip(matched);
  }
  return clip(body) || clip(matched);
}

function consider(
  bag: Map<string, Candidate>,
  doc: Doc,
  rank: number,
  score: number,
  kind: SearchKind,
  lang: Lang | null,
  snippet: string
) {
  const prev = bag.get(doc.id);
  if (
    prev &&
    (prev.rank < rank || (prev.rank === rank && prev.score <= score))
  ) {
    return;
  }
  bag.set(doc.id, {
    id: doc.id,
    name: doc.name,
    kind,
    lang,
    snippet,
    rank,
    score,
  });
}

function addDirect(
  bag: Map<string, Candidate>,
  docs: Doc[],
  needle: string,
  words: string[],
  field: 'title' | 'body'
) {
  const phraseRank = field === 'title' ? 0 : 3;
  const termsRank = field === 'title' ? 1 : 4;
  const kind: SearchKind = field === 'title' ? 'title' : 'description';
  for (const doc of docs) {
    if (field === 'body' && bag.has(doc.id)) {
      continue;
    }
    const sv = locate(
      field === 'title' ? doc.svTitleFold : doc.svBodyFold,
      needle,
      words
    );
    const en = locate(
      field === 'title' ? doc.enTitleFold : doc.enBodyFold,
      needle,
      words
    );
    const pick = better(sv, en);
    if (!pick) {
      continue;
    }
    const lang = pick.lang;
    const rank = pick.hit.kind === 'phrase' ? phraseRank : termsRank;
    const text = textOf(doc, field, lang);
    const snippet =
      field === 'title'
        ? titleSnippet(doc, lang)
        : around(text, pick.hit.at, needle.length);
    consider(bag, doc, rank, pick.hit.at, kind, lang, snippet);
  }
}

function better(
  sv: { kind: 'phrase' | 'terms'; at: number } | null,
  en: { kind: 'phrase' | 'terms'; at: number } | null
): { lang: Lang; hit: { kind: 'phrase' | 'terms'; at: number } } | null {
  if (!sv) {
    return en ? { lang: 'en', hit: en } : null;
  }
  if (!en) {
    return { lang: 'sv', hit: sv };
  }
  if (sv.kind !== en.kind) {
    return sv.kind === 'phrase'
      ? { lang: 'sv', hit: sv }
      : { lang: 'en', hit: en };
  }
  if (en.at < sv.at) {
    return { lang: 'en', hit: en };
  }
  return { lang: 'sv', hit: sv };
}

function textOf(doc: Doc, field: 'title' | 'body', lang: Lang): string {
  if (field === 'title') {
    return lang === 'sv' ? doc.svTitle : doc.enTitle;
  }
  return lang === 'sv' ? doc.svBody : doc.enBody;
}

function addFuzzy(
  bag: Map<string, Candidate>,
  needle: string,
  field: 'title' | 'body'
) {
  const rank = field === 'title' ? 2 : 5;
  const kind: SearchKind =
    field === 'title' ? 'title-fuzzy' : 'description-fuzzy';
  const idx = indexes();
  const pairs: [Fuse<Doc>, Lang][] =
    field === 'title'
      ? [
          [idx.titleSv, 'sv'],
          [idx.titleEn, 'en'],
        ]
      : [
          [idx.bodySv, 'sv'],
          [idx.bodyEn, 'en'],
        ];
  for (const [fuse, lang] of pairs) {
    for (const hit of fuse.search(needle, { limit: FUZZY_LIMIT })) {
      const doc = hit.item;
      const at = hit.matches?.[0]?.indices?.[0]?.[0] ?? 0;
      const span = hit.matches?.[0]?.indices?.[0];
      const len = span ? span[1] - span[0] + 1 : needle.length;
      const text = textOf(doc, field, lang);
      const snippet =
        field === 'title' ? titleSnippet(doc, lang) : around(text, at, len);
      consider(bag, doc, rank, hit.score ?? 1, kind, lang, snippet);
    }
  }
}

function textHits(raw: string): SearchHit[] {
  const needle = fold(raw);
  const words = needle.split(/\s+/).filter(w => w.length >= 2);
  const { docs } = loadCorpus();
  const bag = new Map<string, Candidate>();
  addDirect(bag, docs, needle, words, 'title');
  if (needle.length >= 3) {
    addFuzzy(bag, raw, 'title');
  }
  addDirect(bag, docs, needle, words, 'body');
  if (needle.length >= 3) {
    addFuzzy(bag, raw, 'body');
  }
  return [...bag.values()]
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.score - b.score ||
        a.name.localeCompare(b.name, 'sv') ||
        a.id.localeCompare(b.id)
    )
    .map(({ id, name, kind, lang, snippet }) => ({
      id,
      name,
      kind,
      lang,
      snippet,
    }));
}

export function searchPlaces(raw: string): SearchOutcome {
  const q = raw.trim().slice(0, 200);
  if (!q) {
    return { hits: [], total: 0 };
  }

  const id = placeUuidOf(q);
  if (id) {
    return { redirect: id };
  }

  if (isHexPrefix(q)) {
    const ids = prefixIds(q);
    if (ids && ids.length === 1) {
      return { redirect: ids[0] };
    }
    if (ids && ids.length > 1) {
      const hits = ids
        .map(idHit)
        .sort(
          (a, b) =>
            a.name.localeCompare(b.name, 'sv') || a.id.localeCompare(b.id)
        );
      return { hits, total: hits.length };
    }
  }

  const hits = textHits(q);
  if (hits.length === 1) {
    return { redirect: hits[0].id };
  }
  return { hits: hits.slice(0, SHOWN), total: hits.length };
}
