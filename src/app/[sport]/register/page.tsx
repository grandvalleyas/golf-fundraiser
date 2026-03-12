"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSportConfig } from "@/lib/sports";
import { Trash2 } from "lucide-react";

const TSHIRT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").regex(/\S/, "Name cannot be empty"),
  email: z.string().email("Invalid email address").regex(/\S/, "Email cannot be empty"),
  phone: z.string().min(10, "Phone number is required"),
  tshirtSize: z.string().optional(),
  preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Registration extends RegisterForm {
  _id: string;
  userId: string;
  paymentStatus: string;
  amount?: number;
  tshirtSize?: string;
}

function RegisterPageContent() {
  const { sport } = useParams<{ sport: string }>();
  const config = getSportConfig(sport);
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [loadingRegistration, setLoadingRegistration] = useState(true);
  const [formReady, setFormReady] = useState(false);
  const maxTotalGolfers = 4;
  const apiBase = `/api/${sport}`;

  const { control, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", tshirtSize: "", preferredGolfers: ["", "", ""], isFirstYearAlumni: false, payForPreferred: [] },
  });

  const currentName = watch("name");
  const currentEmail = watch("email");
  const preferredGolfers = watch("preferredGolfers") || ["", "", ""];
  const { isFirstYearAlumni, payForPreferred } = watch();
  const enteredGolfers = preferredGolfers.filter((g) => g && g.trim() !== "");
  const numPreferredPaid = payForPreferred?.length || 0;
  const totalAmount = isFirstYearAlumni && config.hasFirstYearAlumniFree
    ? config.cost * numPreferredPaid
    : config.cost + config.cost * numPreferredPaid;

  useEffect(() => {
    if (isLoaded && user) {
      setValue("name", user.fullName || "");
      setValue("email", user.primaryEmailAddress?.emailAddress || "");
      setFormReady(true);
    }
  }, [user, isLoaded, setValue]);

  const fetchRegistration = async () => {
    if (!user || !isLoaded) return;
    setLoadingRegistration(true);
    try {
      const response = await fetch(`${apiBase}/checkout`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) { setRegistration(data[0]); setMode("view"); }
        else { setRegistration(null); setMode("create"); }
      }
    } catch {
      toast({ title: "Error", description: "Failed to load registration", variant: "destructive" });
    } finally { setLoadingRegistration(false); }
  };

  useEffect(() => { fetchRegistration(); }, [user, isLoaded]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    toast({ title: "Payment Successful", description: "Your reservation has been updated." });
    router.replace(`/${sport}/register`);
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${apiBase}/checkout`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0 && data[0].paymentStatus === "completed") {
            clearInterval(poll);
            setRegistration(data[0]);
            setMode("view");
            return;
          }
        }
      } catch {}
      if (attempts >= 10) clearInterval(poll);
    }, 1500);
    return () => clearInterval(poll);
  }, [searchParams]);

  const handleDeletePreferredGolfer = async (registrationId: string, golfer: string, isPaid: boolean) => {
    if (isPaid) { toast({ title: "Error", description: "Cannot delete a preferred golfer you paid for.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/checkout`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId, golferToDelete: golfer }) });
      if (response.ok) { toast({ title: "Success", description: "Preferred golfer removed" }); await fetchRegistration(); }
      else toast({ title: "Error", description: "Failed to remove preferred golfer", variant: "destructive" });
    } catch { toast({ title: "Error", description: "An error occurred", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!isLoaded || !user || !formReady) { toast({ title: "Error", description: "User data is still loading. Please wait.", variant: "destructive" }); return; }
    const name = currentName || user.fullName || "";
    const email = currentEmail || user.primaryEmailAddress?.emailAddress || "";
    if (!name || !email) { toast({ title: "Error", description: "Name and email are required.", variant: "destructive" }); return; }
    setLoading(true);
    const registrationData = {
      name, email, phone: data.phone,
      ...(config.hasTshirtSize && data.tshirtSize ? { tshirtSize: data.tshirtSize } : {}),
      preferredGolfers: data.preferredGolfers.filter((g) => g && g.trim() !== ""),
      isFirstYearAlumni: data.isFirstYearAlumni, payForPreferred: data.payForPreferred || [],
      userId: user.id, createdAt: new Date().toISOString(),
    };
    try {
      if (mode === "create") {
        if (1 + (data.payForPreferred?.length || 0) > maxTotalGolfers) { toast({ title: "Error", description: `Maximum is ${maxTotalGolfers} golfers.`, variant: "destructive" }); return; }
        if (totalAmount > 0) {
          const response = await fetch(`${apiBase}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: totalAmount, userId: user.id, registrationData }) });
          router.push((await response.json()).url);
        } else {
          const response = await fetch(`${apiBase}/checkout/free`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, registrationData }) });
          if (response.ok) { toast({ title: "Success", description: "Registration completed for free." }); await fetchRegistration(); setMode("view"); }
          else { const err = await response.json(); toast({ title: "Error", description: err.error || "Failed to complete registration", variant: "destructive" }); }
        }
      } else if (mode === "edit" && editingRegistration) {
        const updatedData = { ...registrationData, _id: editingRegistration._id, paymentStatus: editingRegistration.paymentStatus };
        const originalPaidGolfers = editingRegistration.payForPreferred?.length || 0;
        const newPaidGolfers = data.payForPreferred?.length || 0;
        const addedPaidGolfers = newPaidGolfers - originalPaidGolfers;
        const additionalAmount = addedPaidGolfers > 0 ? addedPaidGolfers * config.cost : 0;
        const wasFree = editingRegistration.isFirstYearAlumni && config.hasFirstYearAlumniFree && originalPaidGolfers === 0;
        const requiresPaymentDueToAlumniChange = wasFree && !data.isFirstYearAlumni;
        if (requiresPaymentDueToAlumniChange || additionalAmount > 0) {
          const paymentAmount = requiresPaymentDueToAlumniChange ? totalAmount : additionalAmount;
          const response = await fetch(`${apiBase}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: paymentAmount, userId: user.id, registrationData: updatedData, isUpdate: true }) });
          router.push((await response.json()).url);
        } else {
          const response = await fetch(`${apiBase}/checkout`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedData) });
          if (response.ok) { toast({ title: "Success", description: "Reservation updated" }); setRegistration(updatedData); setMode("view"); setEditingRegistration(null); }
          else toast({ title: "Error", description: "Failed to update reservation", variant: "destructive" });
        }
      }
    } catch { toast({ title: "Error", description: "An error occurred", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleEdit = (reg: Registration) => {
    reset({ ...reg, preferredGolfers: [...(reg.preferredGolfers || []), "", "", ""].slice(0, 3) });
    setEditingRegistration(reg);
    setMode("edit");
  };

  if (!isLoaded || loadingRegistration) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>;

  if (mode === "view") {
    return (
      <div className="container mx-auto px-6 py-12 max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Your Reservation</h1>
        {registration ? (
          <div className="bg-card rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{registration.name}</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${registration.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{registration.paymentStatus}</span>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>{registration.email}</p>
              <p>{registration.phone}</p>
              {config.hasTshirtSize && registration.tshirtSize && <p>T-Shirt: {registration.tshirtSize}</p>}
            </div>
            {registration.preferredGolfers.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Preferred Golfers</p>
                <div className="space-y-1.5">
                  {registration.preferredGolfers.map((golfer, i) => {
                    const isPaid = registration.payForPreferred?.includes(golfer);
                    return (
                      <div key={i} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-sm">
                        <span>{golfer} {isPaid && <span className="text-xs text-green-600 font-medium">(paid)</span>}</span>
                        {!isPaid && <button onClick={() => handleDeletePreferredGolfer(registration._id, golfer, false)} disabled={loading} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {config.hasFirstYearAlumniFree && <p className="text-sm"><span className="font-medium">First Year Alumni:</span> {registration.isFirstYearAlumni ? "Yes" : "No"}</p>}
            {registration.amount != null && <p className="text-sm"><span className="font-medium">Amount Paid:</span> ${registration.amount.toLocaleString()}</p>}
            <div className="flex gap-3 mt-2">
              <Button onClick={() => handleEdit(registration)} className="flex-1">Edit Reservation</Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                const start = config.schedule[0]?.time || "9:00 a.m.";
                const dateStr = config.date.replace(/^[A-Za-z]+,\s*/, "");
                const dt = new Date(dateStr);
                const pad = (n: number) => String(n).padStart(2, "0");
                const ymd = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
                const hourMatch = start.match(/(\d+):(\d+)\s*(a\.?m\.?|p\.?m\.?)/i);
                let h = hourMatch ? parseInt(hourMatch[1]) : 9;
                const m = hourMatch ? parseInt(hourMatch[2]) : 0;
                if (hourMatch && /p/i.test(hourMatch[3]) && h !== 12) h += 12;
                if (hourMatch && /a/i.test(hourMatch[3]) && h === 12) h = 0;
                const ics = [
                  "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
                  `DTSTART:${ymd}T${pad(h)}${pad(m)}00`,
                  `DTEND:${ymd}T${pad(h + 6)}${pad(m)}00`,
                  `SUMMARY:${config.title}`,
                  `LOCATION:${config.location}, ${config.address}`,
                  `DESCRIPTION:${config.costIncludes}`,
                  "END:VEVENT", "END:VCALENDAR",
                ].join("\r\n");
                const blob = new Blob([ics], { type: "text/calendar" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${sport}_golf_outing.ics`;
                a.click();
              }}>Add to Calendar</Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm p-8 text-center">
            <p className="text-muted-foreground mb-4">No reservation found.</p>
            <Button onClick={() => setMode("create")}>Create Reservation</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{mode === "edit" ? "Edit Reservation" : "Register"}</h1>
      <p className="text-sm text-muted-foreground mb-8">{config.title} — {config.date}</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <Label htmlFor="name">Name</Label>
            <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} className="mt-1" />} />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} className="mt-1" />} />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Controller name="phone" control={control} render={({ field }) => <Input id="phone" {...field} className="mt-1" />} />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {config.hasTshirtSize && (
            <div>
              <Label htmlFor="tshirtSize">T-Shirt Size</Label>
              <Controller name="tshirtSize" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tshirtSize" className="mt-1"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>{TSHIRT_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
          )}

          <div>
            <Label>Preferred Golfers (up to 3)</Label>
            <div className="space-y-2 mt-1">
              {[0, 1, 2].map((index) => (
                <Controller key={index} name={`preferredGolfers.${index}`} control={control} render={({ field }) => <Input placeholder={`Golfer ${index + 1}`} {...field} disabled={mode === "edit" && !!editingRegistration?.payForPreferred?.includes(field.value)} />} />
              ))}
            </div>
          </div>

          {config.hasFirstYearAlumniFree && (
            <div className="flex items-center gap-2">
              <Controller name="isFirstYearAlumni" control={control} render={({ field }) => <Checkbox id="isFirstYearAlumni" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />} />
              <Label htmlFor="isFirstYearAlumni" className="text-sm">I am a first-year alumni (golf free)</Label>
            </div>
          )}

          {enteredGolfers.length > 0 && (
            <div>
              <Label>Pay for Preferred Golfers</Label>
              <div className="space-y-2 mt-1">
                {enteredGolfers.map((golfer, index) => {
                  const alreadyPaid = mode === "edit" && editingRegistration?.payForPreferred?.includes(golfer);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Controller name="payForPreferred" control={control} render={({ field }) => (
                        <Checkbox id={`payFor-${index}`} checked={field.value?.includes(golfer)} disabled={!!alreadyPaid}
                          onCheckedChange={(checked) => { if (checked) field.onChange([...(field.value || []), golfer]); else field.onChange(field.value?.filter((n) => n !== golfer)); }} />
                      )} />
                      <Label htmlFor={`payFor-${index}`} className="text-sm">{alreadyPaid ? `${golfer} (paid)` : `Pay for ${golfer} ($${config.cost})`}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-sm p-6 lg:sticky lg:top-24 space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between"><span>Event</span><span className="text-foreground font-medium">{config.name}</span></div>
              {!(isFirstYearAlumni && config.hasFirstYearAlumniFree) && (
                <div className="flex justify-between"><span>Your registration</span><span>${config.cost}</span></div>
              )}
              {isFirstYearAlumni && config.hasFirstYearAlumniFree && (
                <div className="flex justify-between"><span>Your registration</span><span className="text-green-600">Free</span></div>
              )}
              {numPreferredPaid > 0 && (
                <div className="flex justify-between"><span>Preferred golfers × {numPreferredPaid}</span><span>${config.cost * numPreferredPaid}</span></div>
              )}
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span><span>${totalAmount}</span>
            </div>
            <Button onClick={handleSubmit(onSubmit)} disabled={loading || !isLoaded || !formReady} className="w-full" size="lg">
              {mode === "edit" ? "Update Reservation" : totalAmount > 0 ? `Pay $${totalAmount}` : "Complete Registration"}
            </Button>
            {registration && <Button onClick={() => setMode("view")} variant="ghost" className="w-full">Cancel</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterPageContent /></Suspense>;
}
