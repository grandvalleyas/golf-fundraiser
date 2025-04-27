"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

type SponsorTier = {
	name: string;
	price: number;
	freeGolfers: number;
	description: string;
};

const sponsorTiers: SponsorTier[] = [
	{
		name: "Hole Sponsor",
		price: 200,
		freeGolfers: 0,
		description: "Includes tee box sign",
	},
	{
		name: "Cart Sponsor",
		price: 1000,
		freeGolfers: 1,
		description:
			"Includes one golfer, recognition on all carts, hole sponsor sign",
	},
	{
		name: "Beverage Sponsor",
		price: 1000,
		freeGolfers: 1,
		description: "Includes one golfer, recognition, hole sponsor sign",
	},
	{
		name: "Dinner Sponsor",
		price: 3000,
		freeGolfers: 4,
		description:
			"Includes foursome, recognition at dinner, hole sponsor sign",
	},
	{
		name: "Title Sponsor",
		price: 10000,
		freeGolfers: 4,
		description:
			"Includes foursome, outing recognition, hole sponsor sign, sponsor gift",
	},
];

type Sponsor = {
	_id: string;
	userId: string;
	name: string;
	tier: string;
	logo?: string;
	text?: string;
	websiteLink?: string;
	freeGolfers: string[];
};

export default function Sponsor() {
	const { user } = useUser();
	const { toast } = useToast();
	const searchParams = useSearchParams();
	const [sponsor, setSponsor] = useState<Sponsor | null>(null);
	const [name, setName] = useState("");
	const [tier, setTier] = useState<string>(sponsorTiers[0].name);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string>("");
	const [text, setText] = useState("");
	const [websiteLink, setWebsiteLink] = useState("");
	const [freeGolfers, setFreeGolfers] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);

	const fetchSponsor = useCallback(async () => {
		if (!user?.id) return;
		setLoading(true);
		try {
			const response = await fetch(`/api/sponsor?userId=${user.id}`);
			const data = await response.json();
			setSponsor(data);
			setLoading(false);
		} catch (err) {
			console.error("Error fetching sponsor:", err);
			setLoading(false);
		}
	}, [user?.id]);

	useEffect(() => {
		fetchSponsor();
	}, [fetchSponsor]);

	useEffect(() => {
		const success = searchParams.get("success");
		const sessionId = searchParams.get("session_id");
		if (success && sessionId) {
			const createSponsorAfterPayment = async () => {
				try {
					const response = await fetch(
						`/api/sponsor/retrieve-session?sessionId=${sessionId}`
					);
					if (!response.ok)
						throw new Error("Failed to retrieve session");
					const session = await response.json();
					const {
						userId,
						name,
						tier,
						logo,
						text,
						websiteLink,
						freeGolfers,
					} = session.metadata;

					const createResponse = await fetch("/api/sponsor", {
						method: "POST",
						body: JSON.stringify({
							userId,
							name,
							tier,
							logo,
							text,
							websiteLink,
							freeGolfers: JSON.parse(freeGolfers),
						}),
						headers: { "Content-Type": "application/json" },
					});

					if (!createResponse.ok) {
						const error = await createResponse.json();
						throw new Error(
							error.error || "Failed to create sponsor"
						);
					}

					toast({
						title: "Success",
						description: "Sponsor created successfully!",
					});
					fetchSponsor();
					setName("");
					setTier(sponsorTiers[0].name);
					setLogoFile(null);
					setLogoPreview("");
					setText("");
					setWebsiteLink("");
					setFreeGolfers([]);
				} catch (err) {
					console.error("Error creating sponsor after payment:", err);
				}
			};
			createSponsorAfterPayment();
		}
	}, [searchParams, fetchSponsor, toast]);

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setLogoFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setLogoPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setLogoFile(null);
			setLogoPreview("");
		}
	};

	const handleSubmit = async () => {
		if (!name || !tier) {
			toast({
				title: "Error",
				description: "Name and tier are required",
				variant: "destructive",
			});
			return;
		}

		if (!logoFile && !text) {
			toast({
				title: "Error",
				description: "At least one of logo or text must be provided",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		try {
			let logoUrl = "";
			if (logoFile) {
				const formData = new FormData();
				formData.append("file", logoFile);
				formData.append("upload_preset", "golf_fundraiser");
				const uploadResponse = await fetch(
					"https://api.cloudinary.com/v1_1/dazxax791/image/upload",
					{
						method: "POST",
						body: formData,
					}
				);
				const uploadData = await uploadResponse.json();
				if (!uploadData.secure_url)
					throw new Error("Failed to upload logo");
				logoUrl = uploadData.secure_url;
			}

			const selectedTier = sponsorTiers.find((t) => t.name === tier);
			if (!selectedTier) throw new Error("Invalid tier selected");

			const response = await fetch(
				"/api/sponsor/create-checkout-session",
				{
					method: "POST",
					body: JSON.stringify({
						price: selectedTier.price,
						userId: user?.id,
						name,
						tier: selectedTier.name,
						logo: logoUrl || undefined,
						text: text || undefined,
						websiteLink: websiteLink || undefined,
						freeGolfers,
					}),
					headers: { "Content-Type": "application/json" },
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					error.error || "Failed to create checkout session"
				);
			}

			const { url } = await response.json();
			window.location.href = url;
		} catch (err) {
			console.error("Error creating checkout session:", err);
			toast({
				title: "Error",
				description:
					(err as Error).message || "Failed to initiate payment",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEditSponsorChange = (field: keyof Sponsor, value: string) => {
		if (!editSponsor) return;
		setEditSponsor({ ...editSponsor, [field]: value });
	};

	const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setLogoFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setLogoPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setLogoFile(null);
			setLogoPreview("");
		}
	};

	const handleSubmitEditSponsor = async () => {
		if (!editSponsor || !editSponsor.name) {
			toast({
				title: "Error",
				description: "Name is required",
				variant: "destructive",
			});
			return;
		}

		if (!logoFile && !editSponsor.logo && !editSponsor.text) {
			toast({
				title: "Error",
				description: "At least one of logo or text must be provided",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);
		try {
			let logoUrl = editSponsor.logo;
			if (logoFile) {
				const formData = new FormData();
				formData.append("file", logoFile);
				formData.append("upload_preset", "golf_fundraiser");
				const uploadResponse = await fetch(
					"https://api.cloudinary.com/v1_1/dazxax791/image/upload",
					{
						method: "POST",
						body: formData,
					}
				);
				const uploadData = await uploadResponse.json();
				if (!uploadData.secure_url)
					throw new Error("Failed to upload logo");
				logoUrl = uploadData.secure_url;
			}

			const response = await fetch("/api/sponsor", {
				method: "PUT",
				body: JSON.stringify({
					userId: user?.id,
					name: editSponsor.name,
					logo: logoUrl || undefined,
					text: editSponsor.text || undefined,
					websiteLink: editSponsor.websiteLink || undefined,
					freeGolfers: editSponsor.freeGolfers || [],
				}),
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update sponsor");
			}

			toast({
				title: "Success",
				description: "Sponsor updated successfully!",
			});
			fetchSponsor();
			setEditSponsor(null);
			setLogoFile(null);
			setLogoPreview("");
		} catch (err) {
			console.error("Error updating sponsor:", err);
			toast({
				title: "Error",
				description:
					(err as Error).message || "Failed to update sponsor",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const selectedTier = sponsorTiers.find((t) => t.name === tier);

	return (
		<div className="bg-background">
			<section className="relative h-64 sm:h-80">
				<Image
					src="https://res.cloudinary.com/dazxax791/image/upload/v1741935541/wvjbv64sllc38p7y042e.webp"
					alt="Stadium View"
					fill
					className="object-cover opacity-50"
				/>
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 px-4">
					<h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">
						Sponsor the Golf Outing
					</h1>
				</div>
			</section>

			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
			<SignedIn>
				<div className="container mx-auto px-4 py-4 sm:py-8 w-full sm:w-[65%]">
					{loading && (
						<p className="text-muted-foreground text-sm sm:text-base">
							Loading sponsor data...
						</p>
					)}

					{sponsor ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg sm:text-xl">
									Your Sponsorship
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
									{sponsor.logo && (
										<div className="relative w-24 h-24 sm:w-32 sm:h-32">
											<Image
												src={sponsor.logo}
												alt={`${sponsor.name} logo`}
												fill
												className="object-contain"
											/>
										</div>
									)}
									<div className="space-y-2">
										<h3 className="text-lg sm:text-xl font-semibold">
											{sponsor.name}
										</h3>
										{sponsor.text && (
											<p className="text-sm sm:text-base">
												<strong>Text:</strong>{" "}
												{sponsor.text}
											</p>
										)}
										<p className="text-sm sm:text-base">
											<strong>Tier:</strong>{" "}
											{sponsor.tier}
										</p>
										<p className="text-sm sm:text-base">
											<strong>Free Golfers:</strong>{" "}
											{sponsor && sponsor.freeGolfers
												? sponsor.freeGolfers.length
												: 0}
										</p>
										{sponsor.websiteLink && (
											<p className="text-sm sm:text-base">
												<strong>Website:</strong>{" "}
												<a
													href={sponsor.websiteLink}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-500 hover:underline">
													{sponsor.websiteLink}
												</a>
											</p>
										)}
									</div>
								</div>
								<Dialog
									open={editSponsor !== null}
									onOpenChange={(open) =>
										setEditSponsor(open ? sponsor : null)
									}>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											className="text-sm sm:text-base px-2 py-1 sm:px-4 sm:py-2">
											Edit Sponsor
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle className="text-lg sm:text-xl">
												Edit Sponsor
											</DialogTitle>
										</DialogHeader>
										<div className="space-y-4">
											<div>
												<Label
													htmlFor="edit-name"
													className="text-sm sm:text-base">
													Sponsor Name
												</Label>
												<Input
													id="edit-name"
													value={
														editSponsor?.name || ""
													}
													onChange={(e) =>
														handleEditSponsorChange(
															"name",
															e.target.value
														)
													}
													placeholder="Sponsor Name"
													className="w-full text-sm sm:text-base mt-1"
												/>
											</div>
											<div>
												<Label
													htmlFor="edit-logo"
													className="text-sm sm:text-base">
													Logo (optional)
												</Label>
												<Input
													id="edit-logo"
													type="file"
													accept="image/*"
													onChange={
														handleEditLogoChange
													}
													className="w-full text-sm sm:text-base mt-1"
												/>
												{(logoPreview ||
													editSponsor?.logo) && (
													<div className="mt-2">
														<Image
															src={
																logoPreview ||
																editSponsor?.logo ||
																""
															}
															alt="Logo Preview"
															width={80}
															height={80}
															className="object-contain sm:w-[100px] sm:h-[100px]"
														/>
													</div>
												)}
											</div>
											<div>
												<Label
													htmlFor="edit-text"
													className="text-sm sm:text-base">
													Text (optional)
												</Label>
												<Textarea
													id="edit-text"
													value={
														editSponsor?.text || ""
													}
													onChange={(e) =>
														handleEditSponsorChange(
															"text",
															e.target.value
														)
													}
													placeholder="Enter a short text message (e.g., a tagline or message)"
													className="w-full text-sm sm:text-base mt-1"
												/>
											</div>
											<div>
												<Label
													htmlFor="edit-website"
													className="text-sm sm:text-base">
													Website Link (optional)
												</Label>
												<Input
													id="edit-website"
													value={
														editSponsor?.websiteLink ||
														""
													}
													onChange={(e) =>
														handleEditSponsorChange(
															"websiteLink",
															e.target.value
														)
													}
													placeholder="Website URL"
													className="w-full text-sm sm:text-base mt-1"
												/>
											</div>
											<Button
												onClick={
													handleSubmitEditSponsor
												}
												className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base py-2">
												Save Changes
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg sm:text-xl">
									Become a Sponsor
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 grid grid-cols-1 gap-2 sm:gap-4">
								<div className="col-span-1">
									<Label
										htmlFor="name"
										className="text-sm sm:text-base">
										Sponsor Name
									</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										placeholder="Sponsor Name"
										className="w-full text-sm sm:text-base mt-1"
									/>
								</div>
								<div>
									<Label
										htmlFor="tier"
										className="text-sm sm:text-base">
										Sponsorship Tier
									</Label>
									<Select
										value={tier}
										onValueChange={setTier}>
										<SelectTrigger
											id="tier"
											className="w-full text-sm sm:text-base mt-1">
											<SelectValue placeholder="Select a tier" />
										</SelectTrigger>
										<SelectContent>
											{sponsorTiers.map((tier) => (
												<SelectItem
													key={tier.name}
													value={tier.name}>
													{tier.name} - ${tier.price}{" "}
													({tier.description})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label
										htmlFor="logo"
										className="text-sm sm:text-base">
										Logo (optional)
									</Label>
									<Input
										id="logo"
										type="file"
										accept="image/*"
										onChange={handleLogoChange}
										className="w-full hover:cursor-pointer text-sm sm:text-base mt-1"
									/>
									{logoPreview && (
										<div className="mt-2">
											<Image
												src={logoPreview}
												alt="Logo Preview"
												width={80}
												height={80}
												className="object-contain sm:w-[100px] sm:h-[100px]"
											/>
										</div>
									)}
								</div>
								<div>
									<Label
										htmlFor="text"
										className="text-sm sm:text-base">
										Text (optional)
									</Label>
									<Textarea
										id="text"
										value={text}
										onChange={(e) =>
											setText(e.target.value)
										}
										placeholder="Enter a short text message (e.g., a tagline or message)"
										className="w-full text-sm sm:text-base mt-1"
									/>
								</div>
								<div>
									<Label
										htmlFor="website"
										className="text-sm sm:text-base">
										Website Link (optional)
									</Label>
									<Input
										id="website"
										value={websiteLink}
										onChange={(e) =>
											setWebsiteLink(e.target.value)
										}
										placeholder="Website URL"
										className="w-full text-sm sm:text-base mt-1"
									/>
								</div>
								{selectedTier &&
									selectedTier.freeGolfers > 0 && (
										<div>
											<Label>
												Free Golfers (
												{selectedTier.freeGolfers})
											</Label>
											{Array.from({
												length: selectedTier.freeGolfers,
											}).map((_, index) => (
												<Input
													key={index}
													placeholder={`Golfer ${
														index + 1
													} name`}
													value={
														freeGolfers[index] || ""
													}
													onChange={(e) => {
														const newGolfers = [
															...freeGolfers,
														];
														newGolfers[index] =
															e.target.value;
														setFreeGolfers(
															newGolfers
														);
													}}
													className="mt-2"
												/>
											))}
										</div>
									)}
								<Button
									onClick={handleSubmit}
									className="w-full bg-primary hover:bg-primary/90 col-span-1 text-sm sm:text-base py-2"
									disabled={loading}>
									{loading
										? "Submitting..."
										: "Submit Sponsorship"}
								</Button>
							</CardContent>
						</Card>
					)}
				</div>
			</SignedIn>
		</div>
	);
}
