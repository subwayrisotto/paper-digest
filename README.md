# Paper Digest

A full-stack research paper discovery app. It pulls recent papers from arXiv, turns each one into a vector embedding, and uses those embeddings to power "similar papers" and a personalized **For you** feed that learns from what a visitor likes.

The AI part is a retrieval pipeline built from scratch: embeddings stored in Postgres with pgvector, nearest-neighbor search in SQL, and a taste vector computed from a visitor's likes. There is no LLM call in the request path yet (see the roadmap).

## Features

- **Paper feed** with server-side pagination (`/?page=2`)
- **Paper detail pages** with the full abstract, a link to arXiv, and a list of similar papers
- **Similar papers** based on cosine similarity between embeddings, available as an inline preview on feed cards and as a server-rendered list on detail pages
- **Likes** with a public like count and a per-visitor liked state (one like per visitor per paper, toggle to unlike)
- **For you feed** that ranks unliked papers by closeness to the average embedding of the papers a visitor liked, with a "newest papers" fallback for new visitors (cold start)
- **Anonymous visitors**: no sign-up needed, each browser gets a random id in a cookie

## Tech stack

| Layer       | Choice                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack), React, TypeScript                                                |
| Styling     | Tailwind CSS                                                                                         |
| Database    | Postgres on Neon with the `pgvector` extension                                                       |
| DB client   | `@neondatabase/serverless`                                                                           |
| Embeddings  | `Xenova/all-MiniLM-L6-v2` via `@huggingface/transformers` (runs locally, 384 dimensions, no API key) |
| Data source | arXiv API (Atom/XML, parsed with `fast-xml-parser`)                                                  |
| Scripts     | `tsx`                                                                                                |

## How it works

### Data pipeline

1. `scripts/ingest.ts` fetches papers from the arXiv API category by category, in pages of 100, pausing 3 seconds between requests. It extracts the id (without the version suffix), title, authors, abstract, primary category and publish date, then inserts them with `ON CONFLICT (arxiv_id) DO NOTHING`, so the script is safe to re-run.
2. `scripts/embed.ts` loads the embedding model once, selects papers where `embedding IS NULL`, embeds `title + abstract`, and stores the 384-number vector in a `vector(384)` column.

### Similar papers

pgvector's cosine distance operator (`<=>`) finds the nearest neighbors of a paper's embedding. The query lives in `getSimilarPapers()` in `lib/papers.ts` and is shared by the API route (used by the client-side preview button) and the detail page (a server component that calls it directly).

### For you ranking

For a visitor with at least one like:

1. The **taste vector** is `avg(embedding)` over the papers they liked.
2. Papers they have not liked are ranked by cosine distance to that vector.
3. Results are paginated with `LIMIT` / `OFFSET` and a stable tiebreaker on `id`.

For a visitor with no likes, the feed falls back to the newest papers and shows a hint. Whether a visitor is personalized is decided by counting their likes, not by checking whether the results are empty, because a later page can legitimately be empty.

### Anonymous visitors

`proxy.ts` (the Next.js 16 replacement for `middleware.ts`) sets an `httpOnly`, `sameSite=lax` cookie called `visitor_id` containing a random UUID on a visitor's first request. The like routes and the feed queries read it on the server. This is an identifier, not authentication.

### Rendering approach

Next.js 16 prerenders a static shell and requires request-specific data (`params`, `searchParams`, `cookies()`, database queries) to be read inside `<Suspense>` boundaries. Every page in this project is a thin, non-async shell that renders instantly and passes the `params` / `searchParams` promises down to an async child component inside `<Suspense>`, where they are awaited.

## Project structure

```
app/
  page.tsx                          # feed (paginated)
  for-you/page.tsx                  # personalized feed (paginated)
  papers/[id]/page.tsx              # paper detail + similar papers
  api/papers/[id]/similar/route.ts  # GET similar papers (used by the feed preview)
  api/papers/[id]/like/route.ts     # POST like, DELETE unlike
components/                         # PaperCard, PaperList, LikeButton,
                                    # SimilarPapers, Pagination
lib/
  db.ts                             # shared Neon client
  papers.ts                         # getSimilarPapers, getForYou
scripts/
  ingest.ts                         # fetch papers from arXiv
  embed.ts                          # generate embeddings
proxy.ts                            # sets the visitor_id cookie
```

## Getting started

### Prerequisites

- Node.js 20.6 or newer (the scripts use `--env-file`)
- A free [Neon](https://neon.tech) Postgres database

### 1. Install

```bash
npm install
```

### 2. Environment

Create `.env.local` in the project root (it must be git-ignored):

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Database schema

Run this in the Neon SQL Editor. The extension must be created first, in its own run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then:

```sql
CREATE TABLE papers (
  id SERIAL PRIMARY KEY,
  arxiv_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  authors TEXT,
  category TEXT,
  published_at TIMESTAMPTZ,
  embedding vector(384)
);

CREATE TABLE likes (
  visitor_id TEXT NOT NULL,
  paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (visitor_id, paper_id)
);
```

### 4. Load data

```bash
npx tsx --env-file=.env.local scripts/ingest.ts
npx tsx --env-file=.env.local scripts/embed.ts
```

The first embedding run downloads the model (cached afterwards). Embedding around a thousand papers takes a few minutes on a laptop. Both scripts can be re-run safely: ingestion skips existing papers, and embedding only processes rows without a vector.

Check the result in the SQL Editor:

```sql
SELECT category, count(*) FROM papers GROUP BY category;
SELECT count(*) FROM papers WHERE embedding IS NULL;  -- should be 0
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000, like a few papers on one topic, then visit `/for-you`.

## Design decisions

- **Embeddings run locally.** A small open model keeps the project free and key-less, and embeddings are only generated in a script, never during a request.
- **SQL does the ranking.** pgvector answers nearest-neighbor and averaging queries in the database, so there is no separate search service.
- **One row per like**, with a composite primary key, instead of a counter column. That gives a like count, enforces one like per visitor, and keeps the per-visitor data needed for personalization.
- **Shared query functions.** SQL used by more than one entry point lives in `lib/papers.ts` instead of being duplicated across routes and pages.
- **Client components never touch the database.** They call API routes, so the connection string stays on the server.
- **Input is validated on the server**: ids are checked as positive integers, and routes return JSON errors instead of crashing.

## Known limitations

- Visitor ids live in a cookie, so likes do not follow a user across browsers or after clearing cookies. There is no real authentication.
- The API routes have no rate limiting yet.
- `OFFSET` pagination is fine at this size but slows down on very large tables.
- No vector index (HNSW) yet; unnecessary at around a thousand rows.
- Taste is a single average vector, so a visitor with very different interests gets recommendations in the "middle" of them.
- The home feed does not have filters yet, and `Pagination` only carries the `page` parameter.
- No automated tests.

## Roadmap

- [ ] "Because you liked: …" line on recommendations, using the nearest liked paper (computed in SQL, no LLM)
- [ ] LLM-generated one-sentence summaries, generated once by a script and cached in a `summary` column
- [ ] Category filter on the feed
- [ ] HNSW index on `embedding` as the table grows
- [ ] Rate limiting on the like routes
- [ ] Deploy to Vercel with a sample dataset, so the demo works instantly
- [ ] Optional: real authentication to replace anonymous visitor ids
- [ ] Architecture diagram and screenshots

## Data attribution

Paper metadata comes from the [arXiv API](https://info.arxiv.org/help/api/index.html). Thank you to arXiv for use of its open access interoperability. Please respect its request to wait about 3 seconds between API requests.
