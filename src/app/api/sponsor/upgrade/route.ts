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
    console.error(`Error in PUT /api/sponsor/upgrade: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
