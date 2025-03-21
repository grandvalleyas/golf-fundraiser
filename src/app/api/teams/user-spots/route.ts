import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Mark the route as dynamic to prevent prerendering during build
export const dynamic = "force-dynamic";

// POST: Fetch purchased spots for a user
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.error("No userId provided to /api/teams/user-spots");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const registrations = await db
      .collection("registrations")
      .find({
        userId,
        paymentStatus: "completed",
      })
      .toArray();

    const spots = registrations.flatMap(
      (reg) =>
        reg.spotDetails?.map((spot: any) => ({
          ...spot,
          registrationId: reg._id.toString(),
        })) || []
    );

    console.log(`Fetched spots for user ${userId}:`, spots);
    return NextResponse.json({ spots });
  } catch (err) {
    console.error(`Error in POST /api/teams/user-spots: ${err}`);
    return NextResponse.json({ error: "Failed to fetch spots" }, { status: 500 });
  }
}
