import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

interface SponsorData {
  userId: string;
  name: string;
  tier: string;
  createdAt: Date;
  logo?: string;
  text?: string;
  websiteLink?: string;
  freeGolfers: string[];
  price: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const sponsor = await db.collection("sponsors").findOne({ userId });
    return NextResponse.json(sponsor || null);
  } catch (err) {
    console.error(`Error in GET /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, name, tier, logo, text, websiteLink, freeGolfers, price } = await request.json();

  if (!userId || !name || !tier || price === undefined) {
    return NextResponse.json({ error: "User ID, name, tier, and price are required" }, { status: 400 });
  }

  if (!logo && !text) {
    return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const existingSponsor = await db.collection("sponsors").findOne({ userId });
    if (existingSponsor) {
      return NextResponse.json({ error: "User already has a sponsor" }, { status: 400 });
    }

    const sponsorData: SponsorData = {
      userId,
      name,
      tier,
      createdAt: new Date(),
      freeGolfers: freeGolfers || [],
      price: parseFloat(price),
    };
    if (logo) sponsorData.logo = logo;
    if (text) sponsorData.text = text;
    if (websiteLink) sponsorData.websiteLink = websiteLink;

    const result = await db.collection("sponsors").insertOne(sponsorData);
    return NextResponse.json({
      success: true,
      sponsorId: result.insertedId,
    });
  } catch (err) {
    console.error(`Error in POST /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId, name, tier, logo, text, websiteLink, freeGolfers, price } = await request.json();

  if (!userId || !name || !tier || price === undefined) {
    return NextResponse.json({ error: "User ID, name, tier, and price are required" }, { status: 400 });
  }

  if (!logo && !text) {
    return NextResponse.json({ error: "At least one of logo or text must be provided" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    const updateData: { [key: string]: any } = {
      name,
      tier,
      price: parseFloat(price),
      updatedAt: new Date(),
      freeGolfers: freeGolfers || [],
    };
    if (logo) updateData.logo = logo;
    if (text) updateData.text = text;
    if (websiteLink) updateData.websiteLink = websiteLink;

    const unsetData: { [key: string]: string } = {};
    if (!logo) unsetData.logo = "";
    if (!text) unsetData.text = "";
    if (!websiteLink) unsetData.websiteLink = "";

    const result = await db.collection("sponsors").updateOne(
      { userId },
      {
        $set: updateData,
        ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}),
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in PUT /api/sponsor: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
