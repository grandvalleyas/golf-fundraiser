import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig } from "@/lib/sports";

export async function PUT(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId, name, tier, logo, text, websiteLink, freeGolfers, price } = await request.json();
  if (!userId || !name || !tier || price === undefined) return NextResponse.json({ error: "User ID, name, tier, and price are required" }, { status: 400 });
  if (!logo && !text) return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    const updateData: Record<string, any> = { name, tier, price: parseFloat(price), updatedAt: new Date(), freeGolfers: freeGolfers || [] };
    const unsetData: Record<string, string> = {};
    if (logo) updateData.logo = logo; else unsetData.logo = "";
    if (text) updateData.text = text; else unsetData.text = "";
    if (websiteLink) updateData.websiteLink = websiteLink; else unsetData.websiteLink = "";
    const result = await db.collection(config.db.sponsors).updateOne({ userId }, { $set: updateData, ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}) });
    if (result.matchedCount === 0) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in PUT /api/${sport}/sponsor/upgrade:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
