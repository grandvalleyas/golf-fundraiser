import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";

// Zod schema for registration data
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
  userId: z.string(),
  createdAt: z.string(),
});

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { registrationData } = await request.json();
    const validated = registerSchema.parse(registrationData);

    const { db } = await connectToDatabase();
    const result = await db.collection("registrations").insertOne({
      ...validated,
      userId,
      paymentStatus: "completed",
      createdAt: new Date(),
    });

    return NextResponse.json({
      ...validated,
      _id: result.insertedId.toString(),
      userId,
      paymentStatus: "completed",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(`Error in POST /api/checkout/free:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
