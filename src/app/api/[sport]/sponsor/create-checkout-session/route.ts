import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig, isEventConcluded } from "@/lib/sports";

export async function POST(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { price, userId, name, tier, logo, text, websiteLink, freeGolfers, sponsorPrice, isUpgrade } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const { db } = await connectToDatabase(config.db.name);
    if (!isUpgrade) {
      if (isEventConcluded(config)) return NextResponse.json({ error: "This event has concluded. Sponsorships are closed." }, { status: 400 });
      if (await db.collection(config.db.sponsors).findOne({ userId })) {
        return NextResponse.json({ error: "You already have a sponsor. Edit your existing sponsorship." }, { status: 400 });
      }
    }
    if (price < 0) return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "usd", product_data: { name: `${config.stripeProductPrefix} Sponsorship - ${tier}` }, unit_amount: price * 100 }, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/${sport}/sponsor?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${sport}/sponsor?cancel=true`,
      metadata: { userId, name, tier, logo: logo || "", text: text || "", websiteLink: websiteLink || "", freeGolfers: JSON.stringify(freeGolfers || []), sponsorPrice: sponsorPrice.toString(), isUpgrade: isUpgrade ? "true" : "false", sport },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/${sport}/sponsor/create-checkout-session:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
