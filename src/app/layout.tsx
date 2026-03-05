import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "GVAS Golf Outings",
  description: "Grand Valley Athletic Society Golf Outings — register and sponsor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${inter.variable} font-sans h-full flex flex-col`}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-card">
            <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">© 2025 Grand Valley Athletic Society. All rights reserved.</p>
              <a href="mailto:schmidtk@gvsu.edu" className="text-sm text-muted-foreground hover:text-foreground transition-colors">schmidtk@gvsu.edu</a>
            </div>
          </footer>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
