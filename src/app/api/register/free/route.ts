import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// Define the schema for registration data
const registrationSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(10, "Phone number is required"),
	preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
	isFirstYearAlumni: z.boolean(),
	payForPreferred: z.array(z.string()).optional(),
});

// Define the Registration model
const Registration = mongoose.model(
	"Registration",
	new mongoose.Schema({
		userId: String,
		name: String,
		email: String,
		phone: String,
		preferredGolfers: [String],
		isFree: Boolean,
		payForPreferred: [String],
		createdAt: { type: Date, default: Date.now },
	}),
	"registrations" // Explicitly specify collection name if needed
);

// Set up email transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	// Restrict to POST requests only
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	// Authenticate the user
	const { userId } = getAuth(req);
	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		// Validate request body
		const data = registrationSchema.parse(req.body);

		// Prevent duplicate registrations
		const existingRegistration = await Registration.findOne({ userId });
		if (existingRegistration) {
			return res.status(400).json({ error: "User already registered" });
		}

		// Create and save new registration
		const registration = new Registration({
			userId, // Use authenticated userId
			name: data.name,
			email: data.email,
			phone: data.phone,
			preferredGolfers: data.preferredGolfers,
			isFree: data.isFirstYearAlumni, // Mark as free based on alumni status
			payForPreferred: data.payForPreferred,
		});
		await registration.save();

		// Send confirmation email
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: data.email,
			subject: "Registration Confirmation",
			text: "Thank you for registering for the golf outing. Your registration is confirmed.",
		});

		// Return success response
		return res.status(200).json({ message: "Registration successful" });
	} catch (error) {
		// Handle validation errors
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors });
		}
		// Log and handle other errors
		console.error("Registration error:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
}
