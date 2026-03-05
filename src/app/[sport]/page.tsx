"use client";

import { useState } from "react";
import { getSportConfig } from "@/lib/sports";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, DollarSign, Shirt, ChevronLeft, ChevronRight } from "lucide-react";

export default function SportPage() {
  const { sport } = useParams<{ sport: string }>();
  const config = getSportConfig(sport);
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center">
        <Image priority src={config.heroImage} alt={config.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative text-center px-6 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 text-balance">{config.title}</h1>
          <p className="text-base sm:text-lg text-white/80 mb-8 max-w-lg mx-auto">{config.description}</p>
          <SignedOut>
            <div className="flex gap-3 justify-center">
              <SignUpButton mode="redirect" forceRedirectUrl={`/${sport}/register`}>
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">Sign Up</Button>
              </SignUpButton>
              <SignInButton mode="redirect" forceRedirectUrl={`/${sport}/register`}>
                <Button size="lg" variant="outline" className="border-white text-white bg-white/20 hover:bg-white/30 hover:!text-white">Sign In</Button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex gap-3 justify-center">
              <Link href={`/${sport}/register`}><Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">Register Now</Button></Link>
              <Link href={`/${sport}/sponsor`}><Button size="lg" variant="outline" className="border-white text-white bg-white/20 hover:bg-white/30 hover:!text-white">Sponsor</Button></Link>
            </div>
          </SignedIn>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: CalendarDays, label: "Date", value: config.date },
              { icon: MapPin, label: "Location", value: config.location },
              { icon: DollarSign, label: "Cost", value: `$${config.cost}/person` },
              { icon: Shirt, label: "Attire", value: config.attire },
            ].map((fact) => (
              <div key={fact.label} className="bg-card rounded-xl p-5 shadow-sm text-center">
                <fact.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{fact.label}</p>
                <p className="text-sm font-semibold">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-12 sm:py-16 bg-card">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Schedule</h2>
          <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
            {config.schedule.map((s, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[2.3rem] top-1 w-4 h-4 rounded-full bg-primary border-4 border-card" />
                <p className="text-sm font-semibold text-primary">{s.time}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-6 max-w-2xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Details</h2>
          <div className="bg-card rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-semibold">Includes</p><p className="text-sm text-muted-foreground">{config.costIncludes}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-semibold">Address</p><p className="text-sm text-muted-foreground">{config.address}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-semibold">Sponsorships</p><p className="text-sm text-muted-foreground">Starting at ${Math.min(...config.sponsorTiers.map((t) => t.price))}</p></div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">All proceeds benefit the {config.proceedsBenefit}.</p>
          <div className="text-center text-sm text-muted-foreground">
            <p>Questions? Contact <a href={`mailto:${config.contactEmail}`} className="text-primary hover:underline">{config.contactEmail}</a>
            {config.contactPhone && <> or call {config.contactPhone}</>}</p>
          </div>
        </div>
      </section>

      {/* Sponsor Tiers Preview */}
      <section className="py-12 sm:py-16 bg-card">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Sponsorship Tiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.sponsorTiers.filter((t) => !t.category).map((tier) => (
              <div key={tier.name} className="bg-background rounded-xl p-5 shadow-sm border text-center">
                <p className="text-2xl font-bold text-primary">${tier.price.toLocaleString()}</p>
                <p className="font-semibold mt-1">{tier.name}</p>
                <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                {tier.freeGolfers > 0 && <p className="text-xs text-primary mt-2 font-medium">Includes {tier.freeGolfers} golfer{tier.freeGolfers > 1 ? "s" : ""}</p>}
              </div>
            ))}
          </div>
          {config.sponsorTiers.some((t) => t.category) && (
            <>
              <h3 className="text-xl font-bold text-center mt-10 mb-6">Premium Sponsorships</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {config.sponsorTiers.filter((t) => t.category).map((tier) => (
                  <div key={tier.name} className="bg-background rounded-xl p-5 shadow-sm border text-center">
                    <p className="text-2xl font-bold text-primary">${tier.price.toLocaleString()}</p>
                    <p className="font-semibold mt-1">{tier.name}</p>
                    <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="text-center mt-8">
            <SignedIn>
              <Link href={`/${sport}/sponsor`}><Button size="lg">Become a Sponsor</Button></Link>
            </SignedIn>
            <SignedOut>
              <SignUpButton mode="redirect" forceRedirectUrl={`/${sport}/sponsor`}>
                <Button size="lg">Become a Sponsor</Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {config.galleryImages.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Event Highlights</h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {config.galleryImages.map((image, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl group break-inside-avoid cursor-pointer" onClick={() => setLightbox(i)}>
                  <Image src={image.url} alt={image.title} width={600} height={400} className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
          <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
            <DialogContent className="max-w-4xl p-2" aria-describedby={undefined}>
              <DialogTitle className="sr-only">Image Preview</DialogTitle>
              {lightbox !== null && (
                <div className="relative">
                  <Image src={config.galleryImages[lightbox].url} alt={config.galleryImages[lightbox].title} width={1200} height={800} className="w-full h-auto rounded-lg" />
                  {lightbox > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                  {lightbox < config.galleryImages.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}
                  <p className="text-center text-xs text-muted-foreground mt-2">{lightbox + 1} / {config.galleryImages.length}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 bg-primary text-white text-center">
        <div className="container mx-auto px-6 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to join?</h2>
          <p className="text-white/80 mb-8">Register for the outing or become a sponsor today.</p>
          <SignedIn>
            <div className="flex gap-3 justify-center">
              <Link href={`/${sport}/register`}><Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">Register</Button></Link>
              <Link href={`/${sport}/sponsor`}><Button size="lg" variant="outline" className="border-white text-white bg-white/20 hover:bg-white/30 hover:!text-white">Sponsor</Button></Link>
            </div>
          </SignedIn>
          <SignedOut>
            <SignUpButton mode="redirect" forceRedirectUrl={`/${sport}/register`}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">Get Started</Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </section>
    </div>
  );
}
