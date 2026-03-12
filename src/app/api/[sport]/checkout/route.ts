import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig } from "@/lib/sports";
import { ObjectId } from "mongodb";

const updateSchema = z.object({
  _id: z.string(),
  name: z.string().min(1).regex(/\S/),
  email: z.string().email().regex(/\S/),
  phone: z.string().min(10),
  tshirtSize: z.string().optional(),
  preferredGolfers: z.array(z.string()).max(3),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
  userId: z.string(),
  createdAt: z.string(),
  paymentStatus: z.string(),
});

export async function GET(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    const registrations = await db.collection(config.db.registrations).find({ userId }).toArray();
    return NextResponse.json(registrations);
  } catch (error) {
    console.error(`Error in GET /api/${sport}/checkout:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, userId: requestUserId, registrationData, isUpdate } = await request.json();
  if (userId !== requestUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { db } = await connectToDatabase(config.db.name);
    if (!isUpdate) {
      const existing = await db.collection(config.db.registrations).findOne({ userId });
      if (existing) return NextResponse.json({ error: "User already has a registration." }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: { currency: "usd", product_data: { name: `${config.stripeProductPrefix} Registration` }, unit_amount: amount * 100 },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/${sport}/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${sport}/register?cancel=true`,
      metadata: { userId, registrationData: JSON.stringify(registrationData), isUpdate: isUpdate ? "true" : "false", sport },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/${sport}/checkout:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = updateSchema.parse(await request.json());
    const { db } = await connectToDatabase(config.db.name);
    const existing = await db.collection(config.db.registrations).findOne({ _id: new ObjectId(data._id), userId });
    if (!existing) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

    // Preserve already-paid golfers — payForPreferred can only grow, never shrink
    const existingPaid: string[] = existing.payForPreferred || [];
    const mergedPaid = [...new Set([...existingPaid, ...(data.payForPreferred || [])])];

    const result = await db.collection(config.db.registrations).updateOne(
      { _id: new ObjectId(data._id), userId },
      { $set: { name: data.name, email: data.email, phone: data.phone, tshirtSize: data.tshirtSize, preferredGolfers: data.preferredGolfers, isFirstYearAlumni: data.isFirstYearAlumni, payForPreferred: mergedPaid, updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Registration updated" });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(`Error in PUT /api/${sport}/checkout:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { registrationId, golferToDelete } = await request.json();
    if (!registrationId || !golferToDelete) return NextResponse.json({ error: "Registration ID and golfer name are required" }, { status: 400 });

    const { db } = await connectToDatabase(config.db.name);
    const registration = await db.collection(config.db.registrations).findOne({ _id: new ObjectId(registrationId), userId });
    if (!registration) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    if (registration.payForPreferred?.includes(golferToDelete)) return NextResponse.json({ error: "Cannot delete a preferred golfer you paid for" }, { status: 400 });

    const updatedGolfers = registration.preferredGolfers.filter((g: string) => g !== golferToDelete);
    await db.collection(config.db.registrations).updateOne({ _id: new ObjectId(registrationId), userId }, { $set: { preferredGolfers: updatedGolfers, updatedAt: new Date() } });
    return NextResponse.json({ message: "Preferred golfer removed" });
  } catch (error) {
    console.error(`Error in PATCH /api/${sport}/checkout:`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
