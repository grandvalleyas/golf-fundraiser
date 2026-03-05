import { allSports } from "@/lib/sports";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ChevronDown } from "lucide-react";
import { SignedOut, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero — full viewport */}
      <section className="relative h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <Image priority src="https://res.cloudinary.com/dazxax791/image/upload/v1742003002/bcwj55qveh68sgtw2u2i.jpg" alt="Golf Course" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative text-center px-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">GVAS Golf Outings</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-lg mx-auto">Supporting Grand Valley athletics through golf.</p>
        </div>
        <a href="#events" className="absolute bottom-8 flex flex-col items-center gap-1 text-foreground hover:text-foreground/70 transition-colors">
          <span className="text-sm font-medium">View Events</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* Sport Cards */}
      <section id="events" className="py-16 sm:py-24 scroll-mt-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Upcoming Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {allSports.map((sport) => (
              <Link key={sport.slug} href={`/${sport.slug}`} className="group block rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-56 overflow-hidden">
                  <Image src={sport.heroImage} alt={sport.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{sport.name}</h3>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />{sport.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />{sport.location}
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2">{sport.description}</p>
                  <p className="text-sm font-semibold text-primary pt-1 group-hover:underline">View Event →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SignedOut>
        <section className="pb-16 text-center">
          <SignUpButton mode="redirect">
            <Button size="lg">Sign Up to Register</Button>
          </SignUpButton>
        </section>
      </SignedOut>
    </div>
  );
}
