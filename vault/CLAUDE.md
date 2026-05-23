# Website Project Wiki — Schema

This is the schema document for the Website project wiki. It tells the LLM how the wiki is structured and what workflows to follow.

## Purpose

This vault is a persistent, compounding knowledge base for building a first test website. All research, learnings, design references, technical notes, and decisions are maintained here by the LLM. The human sources and asks questions; the LLM writes and maintains everything.

## Directory Structure

```
vault/
├── CLAUDE.md       ← this file (schema)
├── index.md        ← content catalog (update on every ingest)
├── log.md          ← append-only chronological record
├── raw/            ← immutable source documents (articles, screenshots, references)
└── wiki/           ← LLM-maintained pages (summaries, entities, concepts)
```

## Wiki Page Types

- **Overview pages** — high-level summaries of a topic (e.g. `wiki/overview-site-goals.md`)
- **Entity pages** — specific tools, frameworks, hosting platforms (e.g. `wiki/entity-vercel.md`)
- **Concept pages** — techniques, patterns, design decisions (e.g. `wiki/concept-responsive-design.md`)
- **Source summaries** — one page per ingested raw source (e.g. `wiki/source-html-css-basics.md`)

## Conventions

- All wiki pages use `[[wiki links]]` for cross-references.
- Frontmatter on every wiki page:
  ```yaml
  ---
  tags: [entity|concept|overview|source]
  updated: YYYY-MM-DD
  sources: 0
  ---
  ```
- Source files in `raw/` are never modified — they are the source of truth.
- The LLM updates `index.md` and `log.md` on every ingest or significant query.

## Operations

### Ingest
When a new source is added to `raw/`:
1. Read the source
2. Discuss key takeaways
3. Write a source summary page in `wiki/`
4. Update relevant entity and concept pages
5. Update `index.md`
6. Append to `log.md`: `## [YYYY-MM-DD] ingest | Source Title`

### Query
1. Read `index.md` to find relevant pages
2. Drill into relevant wiki pages
3. Synthesize answer with citations
4. If the answer is valuable, file it as a new wiki page

### Lint
Periodically check for:
- Contradictions between pages
- Stale claims superseded by newer sources
- Orphan pages with no inbound links
- Concepts mentioned but lacking their own page
- Missing cross-references

## Domain Focus Areas

- Site goals & purpose
- HTML / CSS / JavaScript fundamentals
- Hosting & deployment
- Design & layout
- Domain & DNS
- Performance & accessibility
