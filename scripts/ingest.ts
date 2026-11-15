import { XMLParser } from "fast-xml-parser";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const parser = new XMLParser({ ignoreAttributes: false });

const categories = ["cs.AI", "cs.LG", "cs.CL", "cs.CV"];
const PAGE_SIZE = 100;
const PAGES_PER_CATEGORY = 3; //3x100=300 papers per category

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toPaper(e: any) {
  const paper = {
    arxiv_id: "",
    title: "",
    authors: "",
    abstract: "",
    category: "",
    published_at: "",
  };
  if (!e) return null;
  if (e.id) paper.arxiv_id = e.id.split("/abs/")[1].replace(/v\d+$/, "");
  if (e.title) paper.title = clean(e.title);
  if (e.author) {
    const list = Array.isArray(e.author) ? e.author : [e.author];
    paper.authors = list.map((a: any) => a.name).join(", ");
  }
  if (e.summary) paper.abstract = clean(e.summary);
  const cat = e["arxiv:primary_category"]?.["@_term"];
  if (cat) paper.category = cat;
  if (e.published) paper.published_at = e.published;
  return paper;
}

async function fetchPapers(category: string, start: number): Promise<number> {
  const url =
    `https://export.arxiv.org/api/query?search_query=cat:${category}` +
    `&sortBy=submittedDate&sortOrder=descending` +
    `&start=${start}&max_results=${PAGE_SIZE}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`arXiv request failed: ${res.status}`);

  const feed = parser.parse(await res.text()).feed;
  if (!feed.entry) return 0;

  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

  for (const e of entries) {
    const p = toPaper(e);
    if (!p || !p.arxiv_id) continue;
    await sql`
      INSERT INTO papers (arxiv_id, title, abstract, authors, category, published_at)
      VALUES (${p.arxiv_id}, ${p.title}, ${p.abstract}, ${p.authors}, ${p.category}, ${p.published_at})
      ON CONFLICT (arxiv_id) DO NOTHING
    `;
  }

  return entries.length;
}

async function main() {
  for (const category of categories) {
    for (let page = 0; page < PAGES_PER_CATEGORY; page++) {
      const start = page * PAGE_SIZE;
      const count = await fetchPapers(category, start);
      console.log(`${category} start=${start}: ${count} papers`);
      if (count === 0) break;
      await sleep(3000);
    }
  }
  console.log("Done");
}

main();
