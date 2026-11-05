import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isInteger(paperId) || paperId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const rows = await sql`SELECT id, title,
       1 - (embedding <=> (SELECT embedding FROM papers WHERE id = ${paperId})) AS similarity
        FROM papers
        WHERE id != ${paperId} AND embedding IS NOT NULL
        ORDER BY embedding <=> (SELECT embedding FROM papers WHERE id = ${paperId})
        LIMIT 5;
    `;

  return NextResponse.json(rows);
}
