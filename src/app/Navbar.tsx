"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const match = pathname.match(/^\/(football|wbb)/);
  const sport = match?.[1];
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const signedInLinks = [
    { href: "/", label: "Events" },
    ...(sport ? [
      { href: `/${sport}`, label: "Home" },
      { href: `/${sport}/register`, label: "Register" },
      { href: `/${sport}/sponsor`, label: "Sponsor" },
      ...(isAdmin ? [{ href: `/${sport}/admin`, label: "Admin" }] : []),
    ] : []),
  ];

  const isActive = (href: string) => pathname === href;

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive(href) ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-primary/90 border-b border-white/10">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1741935050/hpzwqbwqxeyzgwmhy6zb.png" alt="GVAS Logo" width={48} height={48} className="object-contain" />
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <SignedOut>
            <NavLink href="/" label="Events" />
          </SignedOut>
          <SignedIn>
            {signedInLinks.map((l) => <NavLink key={l.href} href={l.href} label={l.label} />)}
            <div className="ml-3"><UserButton /></div>
          </SignedIn>
        </div>

        {/* Mobile toggle */}
        <button className="sm:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <>
          <div className="sm:hidden fixed inset-0 top-16 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <div className="sm:hidden fixed top-16 left-0 right-0 z-50 bg-primary border-t border-white/10 px-6 pb-4 pt-2 space-y-1">
            <SignedOut>
              <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10">Events</Link>
            </SignedOut>
            <SignedIn>
              {signedInLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.href) ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 px-3 flex items-center gap-3">
                <UserButton />
                {user?.primaryEmailAddress && <span className="text-xs text-white/60 truncate">{user.primaryEmailAddress.emailAddress}</span>}
              </div>
            </SignedIn>
          </div>
        </>
      )}
    </header>
  );
}
