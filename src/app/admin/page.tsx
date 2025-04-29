"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";

type Registration = {
	_id: string;
	userId: string;
	paymentStatus: string;
	name: string;
	email: string;
	phone: string;
	preferredGolfers: string[];
	isFirstYearAlumni: boolean;
	payForPreferred: string[];
	amount: number;
};

type Sponsor = {
	_id: string;
	userId: string;
	name: string;
	price: number;
	logo: string;
	websiteLink: string;
};

type TableRowData = {
	type: "Reservation" | "Sponsor";
	name: string;
	email: string;
	phone: string;
	paymentStatus: string;
	preferredGolfers?: string;
	isFirstYearAlumni?: boolean;
	payForPreferred?: string;
	amountPaid?: number;
	sponsorPrice?: number;
	sponsorLogo?: string;
	sponsorWebsite?: string;
};

export default function AdminDashboard() {
	const { user, isLoaded } = useUser();
	const { toast } = useToast();
	const [registrations, setRegistrations] = useState<Registration[]>([]);
	const [sponsors, setSponsors] = useState<Sponsor[]>([]);
	const [loading, setLoading] = useState(true);
	const [tableData, setTableData] = useState<TableRowData[]>([]);
	const [reservationTotal, setReservationTotal] = useState<number>(0);
	const [sponsorshipTotal, setSponsorshipTotal] = useState<number>(0);

	useEffect(() => {
		const fetchData = async () => {
			if (!user || !isLoaded) return;

			const isAdmin = user.publicMetadata?.role === "admin";
			if (!isAdmin) {
				setLoading(false);
				return;
			}

			try {
				const regResponse = await fetch("/api/admin/registrations");
				const regData = await regResponse.json();
				setRegistrations(regData || []);

				const sponsorResponse = await fetch("/api/admin/sponsors");
				const sponsorData = await sponsorResponse.json();
				setSponsors(sponsorData || []);
			} catch (err) {
				console.error("Error fetching admin data:", err);
				toast({
					title: "Error",
					description: "Failed to load data",
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user, isLoaded, toast]);

	useEffect(() => {
		const buildTableData = () => {
			const data: TableRowData[] = [];

			// Registrations
			registrations.forEach((reg) => {
				data.push({
					type: "Reservation",
					name: reg.name || "N/A",
					email: reg.email || "N/A",
					phone: reg.phone || "N/A",
					paymentStatus: reg.paymentStatus,
					preferredGolfers:
						reg.preferredGolfers?.join(", ") || "None",
					isFirstYearAlumni: reg.isFirstYearAlumni,
					payForPreferred: reg.payForPreferred?.join(", ") || "None",
					amountPaid: reg.amount || 0,
				});
			});

			// Sponsors
			sponsors.forEach((sponsor) => {
				data.push({
					type: "Sponsor",
					name: sponsor.name,
					email: "N/A",
					phone: "N/A",
					paymentStatus: "N/A",
					sponsorPrice: sponsor.price,
					sponsorLogo: sponsor.logo,
					sponsorWebsite: sponsor.websiteLink,
				});
			});

			setTableData(data);

			// Calculate totals
			const reservationTotal = registrations.reduce(
				(sum, reg) => sum + (reg.amount || 0),
				0
			);
			const sponsorshipTotal = sponsors.reduce(
				(sum, sponsor) => sum + (sponsor.price || 0),
				0
			);
			setReservationTotal(reservationTotal);
			setSponsorshipTotal(sponsorshipTotal);
		};

		if (!loading) {
			buildTableData();
		}
	}, [registrations, sponsors, loading]);

	const exportToExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet([
			...tableData,
			{ type: "Reservation Grand Total", amountPaid: reservationTotal },
			{ type: "Sponsorship Grand Total", sponsorPrice: sponsorshipTotal },
		]);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Admin Data");
		XLSX.writeFile(workbook, "admin_data.xlsx");
	};

	const sendEmailWithAttachment = async () => {
		try {
			const response = await fetch("/api/admin/send-report", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: user?.primaryEmailAddress?.emailAddress,
				}),
			});
			if (response.ok) {
				toast({
					title: "Success",
					description: "Report sent to your email.",
				});
			} else {
				const errorData = await response.json();
				toast({
					title: "Error",
					description: errorData.error || "Failed to send report",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "An error occurred while sending the report",
				variant: "destructive",
			});
		}
	};

	if (!isLoaded) {
		return <div>Loading...</div>;
	}

	const isAdmin = user?.publicMetadata?.role === "admin";
	if (!isAdmin) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold">Unauthorized</h1>
				<p className="text-muted-foreground">
					You do not have access to this dashboard.
				</p>
			</div>
		);
	}

	return (
		<div>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<div className="flex items-center gap-2">
					<Separator orientation="vertical" className="mr-2 h-4" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink href="/admin">
									Admin
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Dashboard</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-4 p-4">
				{loading ? (
					<p className="text-muted-foreground">Loading data...</p>
				) : (
					<Card>
						<CardHeader>
							<CardTitle className="pb-4">
								Admin Data Overview
							</CardTitle>
							<div className="flex space-x-2">
								<Button onClick={exportToExcel}>
									Export to Excel
								</Button>
								<Button onClick={sendEmailWithAttachment}>
									Send Report via Email
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Type</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead>Payment Status</TableHead>
										<TableHead>Preferred Golfers</TableHead>
										<TableHead>First Year Alumni</TableHead>
										<TableHead>Pay for Preferred</TableHead>
										<TableHead>Amount Paid</TableHead>
										<TableHead>Sponsor Price</TableHead>
										<TableHead>Sponsor Logo</TableHead>
										<TableHead>Sponsor Website</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tableData.map((row, index) => (
										<TableRow key={index}>
											<TableCell>{row.type}</TableCell>
											<TableCell>{row.name}</TableCell>
											<TableCell>{row.email}</TableCell>
											<TableCell>{row.phone}</TableCell>
											<TableCell>
												{row.paymentStatus}
											</TableCell>
											<TableCell>
												{row.preferredGolfers || "N/A"}
											</TableCell>
											<TableCell>
												{row.isFirstYearAlumni !==
												undefined
													? row.isFirstYearAlumni
														? "Yes"
														: "No"
													: "N/A"}
											</TableCell>
											<TableCell>
												{row.payForPreferred || "N/A"}
											</TableCell>
											<TableCell>
												{row.amountPaid !== undefined
													? `$${row.amountPaid.toLocaleString()}`
													: "N/A"}
											</TableCell>
											<TableCell>
												{row.sponsorPrice !== undefined
													? `$${row.sponsorPrice.toLocaleString()}`
													: "N/A"}
											</TableCell>
											<TableCell>
												{row.sponsorLogo || "N/A"}
											</TableCell>
											<TableCell>
												{row.sponsorWebsite ? (
													<a
														href={
															row.sponsorWebsite
														}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-500 hover:underline">
														{row.sponsorWebsite}
													</a>
												) : (
													"N/A"
												)}
											</TableCell>
										</TableRow>
									))}
									<TableRow>
										<TableCell
											colSpan={8}
											className="text-right font-semibold">
											Reservation Grand Total:
										</TableCell>
										<TableCell className="font-semibold">
											${reservationTotal.toLocaleString()}
										</TableCell>
										<TableCell colSpan={3}></TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											colSpan={8}
											className="text-right font-semibold">
											Sponsorship Grand Total:
										</TableCell>
										<TableCell colSpan={1}></TableCell>
										<TableCell className="font-semibold">
											${sponsorshipTotal.toLocaleString()}
										</TableCell>
										<TableCell colSpan={2}></TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
