import { sql } from "@/lib/db";

export async function getSimilarPapers(paperId: number) {
  return sql`
    SELECT id, title, authors, category,
      1 - (embedding <=> (SELECT embedding FROM papers WHERE id = ${paperId})) AS similarity
    FROM papers
    WHERE id != ${paperId} AND embedding IS NOT NULL
    ORDER BY embedding <=> (SELECT embedding FROM papers WHERE id = ${paperId})
    LIMIT 5
  `;
}
