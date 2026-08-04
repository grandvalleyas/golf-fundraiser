"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { getSportConfig, isEventConcluded, type SponsorTier } from "@/lib/sports";
import { Check, Pencil, X } from "lucide-react";

type Sponsor = {
  _id: string; userId: string; name: string; tier: string; logo?: string;
  text?: string; websiteLink?: string; freeGolfers: string[]; price: number;
};

function SponsorContent() {
  const { sport } = useParams<{ sport: string }>();
  const config = getSportConfig(sport);
  const concluded = isEventConcluded(config);
  const tiers = config.sponsorTiers;
  const apiBase = `/api/${sport}`;
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form state (shared for create + edit)
  const [name, setName] = useState("");
  const [tier, setTier] = useState(tiers[0].name);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [text, setText] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [freeGolfers, setFreeGolfers] = useState<string[]>([]);

  const selectedTier = tiers.find((t) => t.name === tier);

  const resetForm = () => { setName(""); setTier(tiers[0].name); setLogoFile(null); setLogoPreview(""); setText(""); setWebsiteLink(""); setFreeGolfers([]); };

  const startEdit = () => {
    if (!sponsor) return;
    setName(sponsor.name);
    setTier(sponsor.tier);
    setLogoPreview(sponsor.logo || "");
    setText(sponsor.text || "");
    setWebsiteLink(sponsor.websiteLink || "");
    setFreeGolfers([...sponsor.freeGolfers]);
    setLogoFile(null);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setLogoFile(null); };

  const fetchSponsor = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/sponsor?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch sponsor data");
      setSponsor(await response.json());
    } catch {
      toast({ title: "Error", description: "Failed to load sponsor data", variant: "destructive" });
    } finally { setLoading(false); }
  }, [user?.id, apiBase, toast]);

  useEffect(() => { fetchSponsor(); }, [fetchSponsor]);

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    if (!success || !sessionId) return;
    const handlePaymentSuccess = async () => {
      try {
        const response = await fetch(`${apiBase}/sponsor/retrieve-session?sessionId=${sessionId}`);
        if (!response.ok) throw new Error("Failed to retrieve session");
        const session = await response.json();
        const meta = session.metadata;
        const payload = {
          userId: meta.userId, name: meta.name, tier: meta.tier,
          logo: meta.logo || undefined, text: meta.text || undefined,
          websiteLink: meta.websiteLink || undefined,
          freeGolfers: JSON.parse(meta.freeGolfers || "[]"),
          price: parseFloat(meta.sponsorPrice),
        };
        const isUpgrade = meta.isUpgrade === "true";
        const endpoint = isUpgrade ? `${apiBase}/sponsor/upgrade` : `${apiBase}/sponsor`;
        const method = isUpgrade ? "PUT" : "POST";
        const createResponse = await fetch(endpoint, { method, body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
        if (!createResponse.ok) {
          const err = await createResponse.json();
          if (err.error === "User already has a sponsor") { fetchSponsor(); return; }
          throw new Error(err.error || "Failed to process sponsorship");
        }
        toast({ title: "Success", description: isUpgrade ? "Sponsorship upgraded!" : "Sponsorship created!" });
        fetchSponsor(); resetForm();
      } catch (err) { toast({ title: "Error", description: (err as Error).message, variant: "destructive" }); }
    };
    handlePaymentSuccess();
  }, [searchParams, fetchSponsor, apiBase, tiers, toast]);

  const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "golf_fundraiser");
    const res = await fetch("https://api.cloudinary.com/v1_1/dazxax791/image/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Failed to upload logo");
    if (!data.secure_url) throw new Error("Failed to upload logo");
    return data.secure_url;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); const reader = new FileReader(); reader.onloadend = () => setLogoPreview(reader.result as string); reader.readAsDataURL(file); }
    else { setLogoFile(null); setLogoPreview(""); }
  };

  const isPremiumTier = selectedTier?.category != null;

  const handleCreate = async () => {
    if (!name || !tier) { toast({ title: "Error", description: "Name and tier are required", variant: "destructive" }); return; }
    if (!isPremiumTier && !logoFile && !text) { toast({ title: "Error", description: "At least one of logo or text must be provided", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const logoUrl = logoFile ? await uploadLogo(logoFile) : "";
      const t = tiers.find((t) => t.name === tier)!;
      const response = await fetch(`${apiBase}/sponsor/create-checkout-session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: t.price, userId: user?.id, name, tier: t.name, logo: logoUrl || undefined, text: text || undefined, websiteLink: websiteLink || undefined, freeGolfers, sponsorPrice: t.price }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to create checkout session");
      window.location.href = (await response.json()).url;
    } catch (err) { toast({ title: "Error", description: (err as Error).message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSaveEdit = async () => {
    if (!name || !tier) { toast({ title: "Error", description: "Name and tier are required", variant: "destructive" }); return; }
    if (!isPremiumTier && !logoFile && !logoPreview && !text) { toast({ title: "Error", description: "At least one of logo or text must be provided", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const logoUrl = logoFile ? await uploadLogo(logoFile) : (logoPreview || sponsor?.logo);
      const t = tiers.find((t) => t.name === tier)!;
      const originalPrice = sponsor?.price || 0;
      const additionalAmount = Math.max(0, t.price - originalPrice);
      if (additionalAmount > 0) {
        const response = await fetch(`${apiBase}/sponsor/create-checkout-session`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: additionalAmount, userId: user?.id, name, tier: t.name, logo: logoUrl || undefined, text: text || undefined, websiteLink: websiteLink || undefined, freeGolfers, sponsorPrice: t.price, isUpgrade: true }),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Failed to create checkout session");
        window.location.href = (await response.json()).url;
      } else {
        const response = await fetch(`${apiBase}/sponsor`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, name, tier: t.name, logo: logoUrl || undefined, text: text || undefined, websiteLink: websiteLink || undefined, freeGolfers, price: t.price }),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Failed to update sponsor");
        toast({ title: "Success", description: "Sponsorship updated!" });
        fetchSponsor(); setEditing(false); setLogoFile(null);
      }
    } catch (err) { toast({ title: "Error", description: (err as Error).message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  // Grouped tiers for picker
  const tierGroups = tiers.reduce<Record<string, SponsorTier[]>>((acc, t) => {
    const cat = t.category || "Sponsorship";
    (acc[cat] ||= []).push(t);
    return acc;
  }, {});

  const tierPickerJsx = (
    <>
      {Object.entries(tierGroups).map(([category, categoryTiers]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryTiers.map((t) => {
              const disabled = editing && sponsor && t.price < sponsor.price;
              return (
                <button key={t.name} onClick={() => !disabled && setTier(t.name)} className={`relative text-left p-4 rounded-xl border-2 transition-all ${disabled ? "opacity-40 cursor-not-allowed" : tier === t.name ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-border hover:border-primary/30 bg-card"}`}>
                  {tier === t.name && !disabled && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                  <p className="text-xl font-bold text-primary">${t.price.toLocaleString()}</p>
                  <p className="font-semibold text-sm mt-1">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  {t.freeGolfers > 0 && <p className="text-xs text-primary mt-1 font-medium">Includes {t.freeGolfers} golfer{t.freeGolfers > 1 ? "s" : ""}</p>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  const formFieldsJsx = (
    <div className="bg-card rounded-xl shadow-sm p-6 space-y-5">
      <div><Label>Sponsor Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
      <div><Label>Logo {isPremiumTier ? "(optional)" : "(required)"}</Label><Input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1 cursor-pointer" />{logoPreview && <div className="mt-2"><Image src={logoPreview} alt="Preview" width={80} height={80} className="object-contain rounded" /></div>}</div>
      <div><Label>Text {isPremiumTier ? "(optional)" : !logoFile && !logoPreview ? "(required if no logo)" : "(optional)"}</Label><Textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-1" /></div>
      <div><Label>Website Link (optional)</Label><Input value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} className="mt-1" /></div>
      {selectedTier && selectedTier.freeGolfers > 0 && (
        <div>
          <Label>Free Golfers ({selectedTier.freeGolfers})</Label>
          {Array.from({ length: selectedTier.freeGolfers }).map((_, i) => (
            <Input key={i} placeholder={`Golfer ${i + 1} name`} value={freeGolfers[i] || ""} onChange={(e) => { const g = [...freeGolfers]; g[i] = e.target.value; setFreeGolfers(g); }} className="mt-2" />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          {loading && !sponsor && <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">Loading...</div>}

          {sponsor && !editing ? (
            /* View Mode */
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-8">Your Sponsorship</h1>
              <div className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {sponsor.logo && (
                    <a href={sponsor.logo} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-background">
                        <Image src={sponsor.logo} alt={sponsor.name} fill className="object-contain" />
                      </div>
                    </a>
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{sponsor.name}</h2>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{sponsor.tier}</span>
                    </div>
                    {sponsor.text && <p className="text-sm text-muted-foreground">{sponsor.text}</p>}
                    <p className="text-sm"><span className="text-muted-foreground">Paid:</span> <span className="font-semibold">${sponsor.price.toLocaleString()}</span></p>
                    {sponsor.freeGolfers.length > 0 && <p className="text-sm"><span className="text-muted-foreground">Free Golfers:</span> {sponsor.freeGolfers.join(", ")}</p>}
                    {sponsor.websiteLink && <p className="text-sm"><span className="text-muted-foreground">Website:</span> <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sponsor.websiteLink}</a></p>}
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" onClick={startEdit}><Pencil className="h-4 w-4 mr-2" />Edit Sponsorship</Button>
                </div>
              </div>
            </div>
          ) : sponsor && editing ? (
            /* Edit Mode — inline */
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Edit Sponsorship</h1>
                <Button variant="ghost" onClick={cancelEdit}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
              {tierPickerJsx}
              {formFieldsJsx}
              <div className="mt-6 flex gap-3">
                <Button onClick={handleSaveEdit} size="lg" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : selectedTier && selectedTier.price > (sponsor?.price || 0)
                    ? `Upgrade — Pay $${(selectedTier.price - (sponsor?.price || 0)).toLocaleString()} Difference`
                    : "Save Changes"}
                </Button>
                <Button variant="outline" size="lg" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : !loading && concluded ? (
            /* Concluded — no existing sponsor, new sponsorships closed */
            <div className="bg-card rounded-xl shadow-sm p-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">Sponsorships Closed</h1>
              <p className="text-muted-foreground">This event has concluded and new sponsorships are no longer being accepted.</p>
            </div>
          ) : !loading && (
            /* Create Mode */
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Become a Sponsor</h1>
              <p className="text-muted-foreground mb-8">Choose a tier and customize your sponsorship.</p>
              {tierPickerJsx}
              {formFieldsJsx}
              <div className="mt-6">
                <Button onClick={handleCreate} className="w-full" size="lg" disabled={loading}>
                  {loading ? "Submitting..." : `Submit Sponsorship — $${selectedTier?.price.toLocaleString() || 0}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}

export default function SponsorPage() {
  return <Suspense><SponsorContent /></Suspense>;
}
