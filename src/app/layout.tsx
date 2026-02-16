import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/app/Navbar";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
	title: "45th Annual GVAS Golf Outing",
	description: "Sign up today for the 45th annual GVAS Golf Outing.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<html lang="en" className="h-full">
				<body className="h-full flex flex-col">
					<Navbar />
					<main className="flex-1">{children}</main>
					<footer className="bg-primary text-primary-foreground py-2 text-center text-sm sm:text-base">
						<p>
							© 2025 Grand Valley Athletic Society. All rights
							reserved.
						</p>
					</footer>
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	);
}
