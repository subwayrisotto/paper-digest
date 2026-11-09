import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

async function getContext(params: Ctx["params"]) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isInteger(paperId) || paperId < 1) {
    return {
      error: NextResponse.json({ error: "Invalid id" }, { status: 400 }),
    };
  }

  const visitorId = (await cookies()).get("visitor_id")?.value;
  if (!visitorId) {
    return {
      error: NextResponse.json({ error: "No visitor id" }, { status: 400 }),
    };
  }

  const rows = await sql`
      SELECT count(*)::int AS count FROM likes WHERE paper_id = ${paperId}
    `;

  return { paperId, visitorId, row: rows[0] };
}

export async function POST(_req: Request, { params }: Ctx) {
  const ctx = await getContext(params);
  if ("error" in ctx) return ctx.error;
  const { paperId, visitorId } = ctx;

  try {
    await sql`
      INSERT INTO likes (visitor_id, paper_id)
      VALUES (${visitorId}, ${paperId})
      ON CONFLICT DO NOTHING
    `;
    const rows = await sql`
      SELECT count(*)::int AS count FROM likes WHERE paper_id = ${paperId}
    `;
    return NextResponse.json({ ok: true, count: rows[0].count });
  } catch (err) {
    console.error("Like error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await getContext(params);
  if ("error" in ctx) return ctx.error;
  const { paperId, visitorId, row } = ctx;

  try {
    await sql`
      DELETE FROM likes 
      WHERE visitor_id = ${visitorId} AND paper_id = ${paperId}
    `;
    return NextResponse.json({ ok: true, count: row.count });
  } catch (err) {
    console.error("Like error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
