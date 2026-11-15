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

const FOR_YOU_PAGE_SIZE = 10;

export async function getForYou(visitorId: string, page: number) {
  const offset = (page - 1) * FOR_YOU_PAGE_SIZE;

  const likeRows = await sql`
    SELECT count(*)::int AS n FROM likes WHERE visitor_id = ${visitorId}
  `;
  const personalized = likeRows[0].n > 0;

  if (personalized) {
    const [papers, totalRows] = await Promise.all([
      sql`
        SELECT p.id, p.title, p.authors, p.category, p.published_at,
          (SELECT count(*)::int FROM likes l WHERE l.paper_id = p.id) AS like_count,
          false AS liked
        FROM papers p,
          (SELECT avg(lp.embedding) AS taste
           FROM likes l
           JOIN papers lp ON lp.id = l.paper_id
           WHERE l.visitor_id = ${visitorId}) t
        WHERE p.embedding IS NOT NULL
          AND t.taste IS NOT NULL
          AND p.id NOT IN (SELECT paper_id FROM likes WHERE visitor_id = ${visitorId})
        ORDER BY p.embedding <=> t.taste, p.id
        LIMIT ${FOR_YOU_PAGE_SIZE} OFFSET ${offset}
      `,
      sql`
        SELECT count(*)::int AS total FROM papers
        WHERE embedding IS NOT NULL
          AND id NOT IN (SELECT paper_id FROM likes WHERE visitor_id = ${visitorId})
      `,
    ]);
    return {
      papers,
      personalized: true,
      totalPages: Math.ceil(totalRows[0].total / FOR_YOU_PAGE_SIZE),
    };
  }

  const [papers, totalRows] = await Promise.all([
    sql`
      SELECT p.id, p.title, p.authors, p.category, p.published_at,
        (SELECT count(*)::int FROM likes l WHERE l.paper_id = p.id) AS like_count,
        false AS liked
      FROM papers p
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT ${FOR_YOU_PAGE_SIZE} OFFSET ${offset}
    `,
    sql`SELECT count(*)::int AS total FROM papers`,
  ]);
  return {
    papers,
    personalized: false,
    totalPages: Math.ceil(totalRows[0].total / FOR_YOU_PAGE_SIZE),
  };
}
