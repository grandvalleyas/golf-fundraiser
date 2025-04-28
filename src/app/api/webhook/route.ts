import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!sig) {
    console.error("No Stripe signature");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook secret not set");
    return NextResponse.json({ error: "Secret missing" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const meta = session.metadata || {};
    const userId = meta.userId;
    if (!userId) {
      console.error("No userId in metadata");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Parse registrationData for regular reservations
    let registrationData;
    try {
      registrationData = JSON.parse(meta.registrationData || "{}");
    } catch {
      console.error("Bad registrationData JSON");
      // Not a registration, might be a sponsor
    }

    // Handle sponsor-related metadata
    const isSponsorRelated = meta.name && meta.tier;
    if (isSponsorRelated) {
      const name = meta.name || "";
      const tier = meta.tier || "";
      const logo = meta.logo || "";
      const text = meta.text || "";
      const websiteLink = meta.websiteLink || "";
      let freeGolfers: string[] = [];
      try {
        freeGolfers = JSON.parse(meta.freeGolfers || "[]");
      } catch {
        console.warn("freeGolfers not JSON");
      }
      const sponsorPrice = parseFloat(meta.sponsorPrice || "0");
      const isUpgrade = meta.isUpgrade === "true";

      if (!name || !tier) {
        console.error("Name or tier missing in sponsor metadata");
        return NextResponse.json({ error: "Name and tier are required for sponsor" }, { status: 400 });
      }

      if (isUpgrade) {
        // Update existing sponsor (tier upgrade)
        const updateData: { [key: string]: any } = {
          name,
          tier,
          price: sponsorPrice,
          updatedAt: new Date(),
          freeGolfers,
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
          console.error("Sponsor not found for upgrade");
          return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
        }
        console.log("Upgraded sponsor for", userId);
      } else {
        // Create new sponsor
        const sponsorData: { [key: string]: any } = {
          userId,
          name,
          tier,
          price: sponsorPrice,
          createdAt: new Date(),
          freeGolfers,
        };
        if (logo) sponsorData.logo = logo;
        if (text) sponsorData.text = text;
        if (websiteLink) sponsorData.websiteLink = websiteLink;

        await db.collection("sponsors").insertOne(sponsorData);
        console.log("Inserted new sponsor for", userId);
      }
    } else if (registrationData && Object.keys(registrationData).length > 0) {
      // Handle regular registration
      const name = registrationData.name || "";
      const email = registrationData.email || "";
      const phone = registrationData.phone || "";
      let preferredGolfers: string[] = registrationData.preferredGolfers || [];
      let payForPreferred: string[] = registrationData.payForPreferred || [];
      const isFirstYearAlumni = registrationData.isFirstYearAlumni === true;
      const registrationId = registrationData._id;

      if (!name || !email) {
        console.error("Name or email missing in registrationData");
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      const isUpdate = meta.isUpdate === "true";

      if (isUpdate) {
        if (!registrationId) {
          console.error("Registration ID missing for update");
          return NextResponse.json({ error: "Registration ID missing" }, { status: 400 });
        }

        const existing = await db.collection("registrations").findOne({ _id: new ObjectId(registrationId), userId });
        if (!existing) {
          console.error("Registration not found for update");
          return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        await db.collection("registrations").updateOne(
          { _id: new ObjectId(registrationId), userId },
          {
            $set: {
              name,
              email,
              phone,
              preferredGolfers,
              payForPreferred,
              isFirstYearAlumni,
              paymentStatus: "completed",
              amount: session.amount_total / 100,
              stripeSessionId: session.id,
              updatedAt: new Date(),
            },
          }
        );
        console.log("Updated registration for", userId);
      } else {
        await db.collection("registrations").insertOne({
          userId,
          name,
          email,
          phone,
          preferredGolfers,
          payForPreferred,
          isFirstYearAlumni,
          paymentStatus: "completed",
          amount: session.amount_total / 100,
          stripeSessionId: session.id,
          createdAt: new Date(),
        });
        console.log("Inserted new registration for", userId);
      }
    } else {
      console.error("Invalid metadata structure");
      return NextResponse.json({ error: "Invalid metadata structure" }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
