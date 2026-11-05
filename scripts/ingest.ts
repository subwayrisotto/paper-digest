import { XMLParser } from "fast-xml-parser";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

const url =
  "https://export.arxiv.org/api/query?search_query=cat:cs.AI" +
  "&sortBy=submittedDate&sortOrder=descending&start=0&max_results=20";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

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

async function main() {
  const res = await fetch(url);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml).feed;
  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

  for (const e of entries) {
    const p = toPaper(e);
    if (!p) continue;
    if (!p.arxiv_id) continue;
    await sql`
        INSERT INTO papers (arxiv_id, title, abstract, authors, category, published_at)
        VALUES (${p.arxiv_id}, ${p.title}, ${p.abstract}, ${p.authors}, ${p.category}, ${p.published_at})
        ON CONFLICT (arxiv_id) DO NOTHING
    `;
  }
}

main();
