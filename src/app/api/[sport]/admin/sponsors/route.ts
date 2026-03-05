import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { getSportConfig } from "@/lib/sports";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    return NextResponse.json(await db.collection(config.db.sponsors).find().toArray());
  } catch (err) {
    console.error(`Error in GET /api/${sport}/admin/sponsors:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
