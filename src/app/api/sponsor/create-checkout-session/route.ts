import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  const { price, userId, name, tier, logo, text, websiteLink, freeGolfers, isUpgrade } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";
  const { db } = await connectToDatabase();

  try {
    if (!isUpgrade) {
      const existingSponsor = await db.collection("sponsors").findOne({ userId });
      if (existingSponsor) {
        return NextResponse.json(
          {
            error: "You already have a sponsor. You can edit your existing sponsorship.",
          },
          { status: 400 }
        );
      }
    }

    if (price < 0) {
      return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Golf Outing Sponsorship - ${tier}`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/sponsor?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sponsor?cancel=true`,
      metadata: {
        userId,
        name,
        tier,
        logo: logo || "",
        text: text || "",
        websiteLink: websiteLink || "",
        freeGolfers: JSON.stringify(freeGolfers || []),
        price: price.toString(),
        isUpgrade: isUpgrade ? "true" : "false",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/sponsor/create-checkout-session: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
