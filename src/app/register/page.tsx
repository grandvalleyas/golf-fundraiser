"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const registerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(10, "Phone number is required"),
	preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
	isFirstYearAlumni: z.boolean(),
	payForPreferred: z.array(z.string()).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const { user } = useUser();
	const { toast } = useToast();
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: user?.fullName || "",
			email: user?.primaryEmailAddress?.emailAddress || "",
			phone: "",
			preferredGolfers: ["", "", ""],
			isFirstYearAlumni: false,
			payForPreferred: [],
		},
	});

	const preferredGolfers = watch("preferredGolfers") || ["", "", ""];
	const { isFirstYearAlumni, payForPreferred } = watch();
	const enteredGolfers = preferredGolfers.filter((g) => g.trim() !== "");
	const numPreferredPaid = payForPreferred?.length || 0;
	const totalAmount = isFirstYearAlumni
		? 150 * numPreferredPaid
		: 150 + 150 * numPreferredPaid;

	const onSubmit = async (data: RegisterForm) => {
		if (!user) {
			toast({
				title: "Error",
				description: "Please sign in to register",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		const registrationData = {
			name: data.name,
			email: data.email,
			phone: data.phone,
			preferredGolfers: data.preferredGolfers.filter(
				(g) => g.trim() !== ""
			),
			isFirstYearAlumni: data.isFirstYearAlumni,
			payForPreferred: data.payForPreferred || [],
			userId: user.id,
			createdAt: new Date().toISOString(),
		};

		try {
			if (totalAmount > 0) {
				const response = await fetch("/api/checkout", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						amount: totalAmount,
						userId: user.id,
						registrationData,
					}),
				});
				const { url } = await response.json();
				router.push(url);
			} else {
				const response = await fetch("/api/register/free", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: user.id, registrationData }),
				});
				if (response.ok) {
					toast({
						title: "Success",
						description: "Registration completed for free.",
					});
					router.push("/success");
				} else {
					toast({
						title: "Error",
						description: "Failed to complete registration",
						variant: "destructive",
					});
				}
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "An error occurred",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Register</h1>
			<div className="space-y-6">
				<div>
					<Label htmlFor="name">Name</Label>
					<Controller
						name="name"
						control={control}
						render={({ field }) => <Input id="name" {...field} />}
					/>
					{errors.name && (
						<p className="text-red-500 text-sm">
							{errors.name.message}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="email">Email</Label>
					<Controller
						name="email"
						control={control}
						render={({ field }) => (
							<Input id="email" type="email" {...field} />
						)}
					/>
					{errors.email && (
						<p className="text-red-500 text-sm">
							{errors.email.message}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="phone">Phone</Label>
					<Controller
						name="phone"
						control={control}
						render={({ field }) => <Input id="phone" {...field} />}
					/>
					{errors.phone && (
						<p className="text-red-500 text-sm">
							{errors.phone.message}
						</p>
					)}
				</div>

				<div>
					<Label>Preferred Golfers (up to 3)</Label>
					{[0, 1, 2].map((index) => (
						<div key={index} className="mt-2">
							<Controller
								name={`preferredGolfers.${index}`}
								control={control}
								render={({ field }) => (
									<Input
										placeholder={`Golfer ${index + 1}`}
										{...field}
									/>
								)}
							/>
						</div>
					))}
					{errors.preferredGolfers && (
						<p className="text-red-500 text-sm">
							{errors.preferredGolfers.message}
						</p>
					)}
				</div>

				<div className="flex items-center space-x-2">
					<Controller
						name="isFirstYearAlumni"
						control={control}
						render={({ field }) => (
							<Checkbox
								id="isFirstYearAlumni"
								checked={field.value}
								onCheckedChange={(checked) =>
									field.onChange(checked)
								}
							/>
						)}
					/>
					<Label htmlFor="isFirstYearAlumni">
						I am a first-year alumni (get golf for free)
					</Label>
				</div>

				{enteredGolfers.length > 0 && (
					<div>
						<Label>Pay for Preferred Golfers</Label>
						{enteredGolfers.map((golfer, index) => (
							<div
								key={index}
								className="flex items-center space-x-2 mt-2">
								<Controller
									name="payForPreferred"
									control={control}
									render={({ field }) => (
										<Checkbox
											id={`payFor-${index}`}
											checked={field.value?.includes(
												golfer
											)}
											onCheckedChange={(checked) => {
												if (checked) {
													field.onChange([
														...(field.value || []),
														golfer,
													]);
												} else {
													field.onChange(
														field.value?.filter(
															(name) =>
																name !== golfer
														)
													);
												}
											}}
										/>
									)}
								/>
								<Label htmlFor={`payFor-${index}`}>
									Pay for {golfer} ($150)
								</Label>
							</div>
						))}
					</div>
				)}

				<div>
					<p className="text-lg font-semibold">
						Total Amount: ${totalAmount}
					</p>
				</div>

				<Button
					onClick={handleSubmit(onSubmit)}
					disabled={loading}
					className="w-full">
					{totalAmount > 0
						? "Proceed to Payment"
						: "Complete Registration"}
				</Button>
			</div>
		</div>
	);
}
