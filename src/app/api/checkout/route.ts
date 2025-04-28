import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Zod schema for registration data
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").regex(/\S/, "Name cannot be empty"),
  email: z.string().email("Invalid email address").regex(/\S/, "Email cannot be empty"),
  phone: z.string().min(10, "Phone number is required"),
  preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
  userId: z.string(),
  createdAt: z.string(),
});

// Zod schema for updating registration
const updateSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Name is required").regex(/\S/, "Name cannot be empty"),
  email: z.string().email("Invalid email address").regex(/\S/, "Email cannot be empty"),
  phone: z.string().min(10, "Phone number is required"),
  preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
  userId: z.string(),
  createdAt: z.string(),
  paymentStatus: z.string(),
});

// GET: Fetch all registrations for the user
export async function GET(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const registrations = await db.collection("registrations").find({ userId }).toArray();
    return NextResponse.json(registrations);
  } catch (error) {
    console.error(`Error in GET /api/checkout: ${error}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Create a new paid registration or redirect for payment during update
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, userId: requestUserId, registrationData, isUpdate } = await request.json();
  if (userId !== requestUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();

    // Check if the user already has a registration
    if (!isUpdate) {
      const existingRegistration = await db.collection("registrations").findOne({ userId });
      if (existingRegistration) {
        return NextResponse.json({ error: "User already has a registration. Only one reservation is allowed." }, { status: 400 });
      }
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
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
        isUpdate: isUpdate ? "true" : "false", // Indicate if this is an update
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(`Error in POST /api/checkout: ${err}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update an existing registration without payment
export async function PUT(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const validatedData = updateSchema.parse(data);

    const { db } = await connectToDatabase();
    const result = await db.collection("registrations").updateOne(
      { _id: new ObjectId(validatedData._id), userId },
      {
        $set: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          preferredGolfers: validatedData.preferredGolfers,
          isFirstYearAlumni: validatedData.isFirstYearAlumni,
          payForPreferred: validatedData.payForPreferred || [],
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Registration updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Error in PUT /api/checkout: ${error}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH: Remove an unpaid preferred golfer from a registration
export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { registrationId, golferToDelete } = await request.json();
    if (!registrationId || !golferToDelete) {
      return NextResponse.json({ error: "Registration ID and golfer name are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const registration = await db.collection("registrations").findOne({ _id: new ObjectId(registrationId), userId });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.payForPreferred?.includes(golferToDelete)) {
      return NextResponse.json({ error: "Cannot delete a preferred golfer you paid for" }, { status: 400 });
    }

    const updatedPreferredGolfers = registration.preferredGolfers.filter((golfer: string) => golfer !== golferToDelete);
    await db.collection("registrations").updateOne({ _id: new ObjectId(registrationId), userId }, { $set: { preferredGolfers: updatedPreferredGolfers, updatedAt: new Date() } });

    return NextResponse.json({ message: "Preferred golfer removed" });
  } catch (error) {
    console.error(`Error in PATCH /api/checkout: ${error}`);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
