import { neon } from "@neondatabase/serverless";
import { pipeline } from "@huggingface/transformers";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );

  const rows =
    await sql`SELECT id, title, abstract FROM papers WHERE embedding IS NULL`;
  console.log(`Embedding ${rows.length} papers...`);

  for (const row of rows) {
    const text = `${row.title}. ${row.abstract}`;
    const out = await extractor(text, { pooling: "mean", normalize: true });
    const vec = Array.from(out.data as Float32Array);

    await sql`UPDATE papers SET embedding = ${JSON.stringify(vec)}::vector WHERE id = ${row.id}`;
  }

  console.log("Done");
}

main();
