import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig } from "@/lib/sports";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Secret missing" }, { status: 500 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as any;
  const meta = session.metadata || {};
  const userId = meta.userId;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Determine sport — fallback to football for backward compat with old sessions
  const sport = meta.sport || "football";
  const config = getSportConfig(sport);
  const { db } = await connectToDatabase(config.db.name);

  // Sponsor flow
  const isSponsor = meta.name && meta.tier;
  if (isSponsor) {
    const { name, tier, logo, text, websiteLink, sponsorPrice } = meta;
    let freeGolfers: string[] = [];
    try { freeGolfers = JSON.parse(meta.freeGolfers || "[]"); } catch {}
    const isUpgrade = meta.isUpgrade === "true";

    if (!name || !tier) return NextResponse.json({ error: "Name and tier required" }, { status: 400 });

    const updateData: Record<string, any> = { name, tier, price: parseFloat(sponsorPrice || "0"), updatedAt: new Date(), freeGolfers };
    if (logo) updateData.logo = logo;
    if (text) updateData.text = text;
    if (websiteLink) updateData.websiteLink = websiteLink;

    if (isUpgrade) {
      const unsetData: Record<string, string> = {};
      if (!logo) unsetData.logo = "";
      if (!text) unsetData.text = "";
      if (!websiteLink) unsetData.websiteLink = "";
      await db.collection(config.db.sponsors).updateOne({ userId }, { $set: updateData, ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}) });
    } else {
      await db.collection(config.db.sponsors).insertOne({ ...updateData, userId, createdAt: new Date() });
    }
    return NextResponse.json({ received: true });
  }

  // Registration flow
  let registrationData;
  try { registrationData = JSON.parse(meta.registrationData || "{}"); } catch { registrationData = {}; }
  if (!registrationData || !Object.keys(registrationData).length) return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });

  const { name, email, phone, preferredGolfers = [], payForPreferred = [], isFirstYearAlumni, tshirtSize, _id: registrationId } = registrationData;
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  const isUpdate = meta.isUpdate === "true";
  const docData = {
    name, email, phone, preferredGolfers, payForPreferred,
    isFirstYearAlumni: isFirstYearAlumni === true,
    ...(tshirtSize ? { tshirtSize } : {}),
    paymentStatus: "completed",
    amount: session.amount_total / 100,
    stripeSessionId: session.id,
  };

  if (isUpdate && registrationId) {
    await db.collection(config.db.registrations).updateOne(
      { _id: new ObjectId(registrationId), userId },
      { $set: { ...docData, updatedAt: new Date() } }
    );
  } else {
    await db.collection(config.db.registrations).insertOne({ ...docData, userId, createdAt: new Date() });
  }

  return NextResponse.json({ received: true });
}
