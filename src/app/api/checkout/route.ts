import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { amount, userId, registrationData } = await request.json();
  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Golf Outing Registration",
            },
            unit_amount: amount * 100, // total amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register?cancel=true`,
      metadata: {
        userId,
        registrationData: JSON.stringify(registrationData),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/checkout: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}