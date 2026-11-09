import { NextResponse } from "next/server";
import { getSimilarPapers } from "@/lib/papers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isInteger(paperId) || paperId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const rows = await getSimilarPapers(paperId);
  return NextResponse.json(rows);
}
