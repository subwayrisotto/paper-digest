import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isInteger(paperId) || paperId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { liked } = body;
  if (typeof liked !== "boolean") {
    return NextResponse.json({ error: "Invalid liked value" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO feedback (paper_id, liked)
    VALUES (${paperId}, ${liked})
    ON CONFLICT (paper_id) DO UPDATE SET liked = EXCLUDED.liked
  `;

  console.log(`Feedback for paper ${paperId}: liked = ${liked}`);

  return NextResponse.json({
    rows,
    message: "Feedback submitted successfully",
  });
}
