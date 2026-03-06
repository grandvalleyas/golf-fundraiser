import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig } from "@/lib/sports";

interface SponsorData {
  userId: string; name: string; tier: string; createdAt: Date;
  logo?: string; text?: string; websiteLink?: string; freeGolfers: string[]; price: number;
}

export async function GET(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    return NextResponse.json(await db.collection(config.db.sponsors).findOne({ userId }) || null);
  } catch (err) {
    console.error(`Error in GET /api/${sport}/sponsor:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId, name, tier, logo, text, websiteLink, freeGolfers, price } = await request.json();
  if (!userId || !name || !tier || price === undefined) return NextResponse.json({ error: "User ID, name, tier, and price are required" }, { status: 400 });
  const tierConfig = config.sponsorTiers.find((t) => t.name === tier);
  if (!tierConfig) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  if (!tierConfig.category && !logo && !text) return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    if (await db.collection(config.db.sponsors).findOne({ userId })) return NextResponse.json({ error: "User already has a sponsor" }, { status: 400 });
    const sponsorData: SponsorData = { userId, name, tier, createdAt: new Date(), freeGolfers: freeGolfers || [], price: parseFloat(price) };
    if (logo) sponsorData.logo = logo;
    if (text) sponsorData.text = text;
    if (websiteLink) sponsorData.websiteLink = websiteLink;
    const result = await db.collection(config.db.sponsors).insertOne(sponsorData);
    return NextResponse.json({ success: true, sponsorId: result.insertedId });
  } catch (err) {
    console.error(`Error in POST /api/${sport}/sponsor:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId, name, tier, logo, text, websiteLink, freeGolfers, price } = await request.json();
  if (!userId || !name || !tier || price === undefined) return NextResponse.json({ error: "User ID, name, tier, and price are required" }, { status: 400 });
  const tierConfig = config.sponsorTiers.find((t) => t.name === tier);
  if (!tierConfig) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  if (!tierConfig.category && !logo && !text) return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });

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
    console.error(`Error in PUT /api/${sport}/sponsor:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
