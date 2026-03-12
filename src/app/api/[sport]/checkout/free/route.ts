import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getSportConfig } from "@/lib/sports";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  tshirtSize: z.string().optional(),
  preferredGolfers: z.array(z.string()).max(3),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
  userId: z.string(),
  createdAt: z.string(),
});

export async function POST(request: Request, { params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const config = getSportConfig(sport);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { registrationData } = await request.json();
    const validated = registerSchema.parse(registrationData);
    const { db } = await connectToDatabase(config.db.name);
    const result = await db.collection(config.db.registrations).insertOne({
      ...validated, userId, paymentStatus: "completed", createdAt: new Date(),
    });
    return NextResponse.json({ ...validated, _id: result.insertedId.toString(), userId, paymentStatus: "completed" });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    console.error(`Error in POST /api/${sport}/checkout/free:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
