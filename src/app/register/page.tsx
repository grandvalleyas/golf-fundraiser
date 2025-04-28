"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Stricter validation to prevent empty strings
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").regex(/\S/, "Name cannot be empty"),
  email: z.string().email("Invalid email address").regex(/\S/, "Email cannot be empty"),
  phone: z.string().min(10, "Phone number is required"),
  preferredGolfers: z.array(z.string()).max(3, "Maximum 3 preferred golfers"),
  isFirstYearAlumni: z.boolean(),
  payForPreferred: z.array(z.string()).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Registration extends RegisterForm {
  _id: string;
  userId: string;
  paymentStatus: string;
}

export default function RegisterPage() {
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferredGolfers: ["", "", ""],
      isFirstYearAlumni: false,
      payForPreferred: [],
    },
  });

  // Watch current form values to ensure they're populated before submission
  const currentName = watch("name");
  const currentEmail = watch("email");

  // Update form values when user data becomes available
  useEffect(() => {
    if (isLoaded && user) {
      setValue("name", user.fullName || "");
      setValue("email", user.primaryEmailAddress?.emailAddress || "");
      setFormReady(true);
    }
  }, [user, isLoaded, setValue]);

  useEffect(() => {
    const fetchRegistration = async () => {
      if (!user || !isLoaded) return;
      setLoadingRegistration(true);
      try {
        const response = await fetch("/api/checkout");
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setRegistration(data[0]); // Only take the first registration
            setMode("view");
          } else {
            setMode("create");
          }
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
        toast({
          title: "Error",
          description: "Failed to load registration",
          variant: "destructive",
        });
      } finally {
        setLoadingRegistration(false);
      }
    };
    fetchRegistration();
  }, [user, isLoaded, toast]);

  // Handle redirect from Stripe after successful payment
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast({
        title: "Payment Successful",
        description: "Your reservation has been updated.",
      });
      fetchRegistration(); // Refresh the reservation data
      router.replace("/register"); // Clear query parameters
    }
  }, [searchParams, router, toast]);

  const preferredGolfers = watch("preferredGolfers") || ["", "", ""];
  const { isFirstYearAlumni, payForPreferred } = watch();
  const enteredGolfers = preferredGolfers.filter((g) => g && g.trim() !== "");
  const numPreferredPaid = payForPreferred?.length || 0;
  const totalAmount = isFirstYearAlumni ? 150 * numPreferredPaid : 150 + 150 * numPreferredPaid;

  const fetchRegistration = async () => {
    if (!user || !isLoaded) return;
    setLoadingRegistration(true);
    try {
      const response = await fetch("/api/checkout");
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setRegistration(data[0]); // Only take the first registration
        } else {
          setRegistration(null);
        }
      }
    } catch (error) {
      console.error("Error fetching registration:", error);
      toast({
        title: "Error",
        description: "Failed to load registration",
        variant: "destructive",
      });
    } finally {
      setLoadingRegistration(false);
    }
  };

  const handleDeletePreferredGolfer = async (registrationId: string, golfer: string, isPaid: boolean) => {
    if (isPaid) {
      toast({
        title: "Error",
        description: "Cannot delete a preferred golfer you paid for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, golferToDelete: golfer }),
      });
      if (response.ok) {
        toast({ title: "Success", description: "Preferred golfer removed" });
        await fetchRegistration(); // Re-fetch the registration to update the state
      } else {
        toast({
          title: "Error",
          description: "Failed to remove preferred golfer",
          variant: "destructive",
        });
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

  const onSubmit = async (data: RegisterForm) => {
    if (!isLoaded || !user || !formReady) {
      toast({
        title: "Error",
        description: "User data is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    // Use watched values to ensure we have the latest form state
    const name = currentName || user.fullName || "";
    const email = currentEmail || user.primaryEmailAddress?.emailAddress || "";

    // Final validation to ensure name and email are not empty
    if (!name || !email) {
      toast({
        title: "Error",
        description: "Name and email are required and cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const registrationData = {
      name,
      email,
      phone: data.phone,
      preferredGolfers: data.preferredGolfers.filter((g) => g && g.trim() !== ""),
      isFirstYearAlumni: data.isFirstYearAlumni,
      payForPreferred: data.payForPreferred || [],
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    try {
      if (mode === "create") {
        const newTotalGolfers = 1 + (data.payForPreferred?.length || 0);
        if (newTotalGolfers > maxTotalGolfers) {
          toast({
            title: "Error",
            description: `Cannot register more golfers. The maximum is ${maxTotalGolfers}.`,
            variant: "destructive",
          });
          return;
        }

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
          const response = await fetch("/api/checkout/free", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, registrationData }),
          });
          if (response.ok) {
            toast({
              title: "Success",
              description: "Registration completed for free.",
            });
            await fetchRegistration(); // Re-fetch the registration
            setMode("view");
            reset({
              name: user.fullName || "",
              email: user.primaryEmailAddress?.emailAddress || "",
              phone: "",
              preferredGolfers: ["", "", ""],
              isFirstYearAlumni: false,
              payForPreferred: [],
            });
          } else {
            const errorData = await response.json();
            toast({
              title: "Error",
              description: errorData.error || "Failed to complete registration",
              variant: "destructive",
            });
          }
        }
      } else if (mode === "edit" && editingRegistration) {
        const updatedData = {
          ...registrationData,
          _id: editingRegistration._id,
          paymentStatus: editingRegistration.paymentStatus,
        };

        // Check if payment is required due to changes in payForPreferred
        const originalPaidGolfers = editingRegistration.payForPreferred?.length || 0;
        const newPaidGolfers = data.payForPreferred?.length || 0;
        const addedPaidGolfers = newPaidGolfers - originalPaidGolfers;
        const additionalAmount = addedPaidGolfers > 0 ? addedPaidGolfers * 150 : 0;

        // Check if payment is required due to isFirstYearAlumni change
        const wasFree = editingRegistration.isFirstYearAlumni && originalPaidGolfers === 0;
        const requiresPaymentDueToAlumniChange = wasFree && !data.isFirstYearAlumni;

        if (requiresPaymentDueToAlumniChange) {
          // If the user is no longer a first-year alumni, they need to pay for themselves plus any preferred golfers
          const paymentAmount = totalAmount; // Total includes user ($150) + preferred golfers
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: paymentAmount,
              userId: user.id,
              registrationData: updatedData,
              isUpdate: true,
            }),
          });
          const { url } = await response.json();
          router.push(url);
        } else if (additionalAmount > 0) {
          // If the user added new paid preferred golfers, process payment for the additional amount
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: additionalAmount,
              userId: user.id,
              registrationData: updatedData,
              isUpdate: true,
            }),
          });
          const { url } = await response.json();
          router.push(url);
        } else {
          // No payment required, update directly
          const response = await fetch("/api/checkout", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
          });
          if (response.ok) {
            toast({ title: "Success", description: "Reservation updated" });
            setRegistration(updatedData);
            setMode("view");
            setEditingRegistration(null);
            reset({
              name: user.fullName || "",
              email: user.primaryEmailAddress?.emailAddress || "",
              phone: "",
              preferredGolfers: ["", "", ""],
              isFirstYearAlumni: false,
              payForPreferred: [],
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to update reservation",
              variant: "destructive",
            });
          }
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

  const handleEdit = (registration: Registration) => {
    const normalizedPreferredGolfers = [...(registration.preferredGolfers || []), "", "", ""].slice(0, 3);
    reset({
      ...registration,
      preferredGolfers: normalizedPreferredGolfers,
    });
    setEditingRegistration(registration);
    setMode("edit");
  };

  if (!isLoaded || loadingRegistration) {
    return <div>Loading...</div>;
  }

  if (mode === "view") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Reservation</h1>
        {registration ? (
          <div className="border p-4 rounded-lg">
            <p>
              <strong>Name:</strong> {registration.name}
            </p>
            <p>
              <strong>Email:</strong> {registration.email}
            </p>
            <p>
              <strong>Phone:</strong> {registration.phone}
            </p>
            <p>
              <strong>Preferred Golfers:</strong>
            </p>
            <ul>
              {registration.preferredGolfers.map((golfer, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span>{golfer}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePreferredGolfer(registration._id, golfer, registration.payForPreferred?.includes(golfer) || false)}
                    disabled={loading}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
            <p>
              <strong>First Year Alumni:</strong> {registration.isFirstYearAlumni ? "Yes" : "No"}
            </p>
            <p>
              <strong>Paid for Preferred:</strong> {registration.payForPreferred?.join(", ") || "None"}
            </p>
            <Button onClick={() => handleEdit(registration)} className="mt-2">
              Edit
            </Button>
          </div>
        ) : (
          <p>No reservation found. Create your reservation below.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{mode === "edit" ? "Edit Reservation" : "Register"}</h1>
      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} />} />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Controller name="phone" control={control} render={({ field }) => <Input id="phone" {...field} />} />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </div>

        <div>
          <Label>Preferred Golfers (up to 3)</Label>
          {[0, 1, 2].map((index) => (
            <div key={index} className="mt-2">
              <Controller name={`preferredGolfers.${index}`} control={control} render={({ field }) => <Input placeholder={`Golfer ${index + 1}`} {...field} />} />
            </div>
          ))}
          {errors.preferredGolfers && <p className="text-red-500 text-sm">{errors.preferredGolfers.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="isFirstYearAlumni"
            control={control}
            render={({ field }) => <Checkbox id="isFirstYearAlumni" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />}
          />
          <Label htmlFor="isFirstYearAlumni">I am a first-year alumni (get golf for free)</Label>
        </div>

        {enteredGolfers.length > 0 && (
          <div>
            <Label>Pay for Preferred Golfers</Label>
            {enteredGolfers.map((golfer, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <Controller
                  name="payForPreferred"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id={`payFor-${index}`}
                      checked={field.value?.includes(golfer)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value || []), golfer]);
                        } else {
                          field.onChange(field.value?.filter((name) => name !== golfer));
                        }
                      }}
                    />
                  )}
                />
                <Label htmlFor={`payFor-${index}`}>Pay for {golfer} ($150)</Label>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-lg font-semibold">Total Amount: ${totalAmount}</p>
        </div>

        <Button onClick={handleSubmit(onSubmit)} disabled={loading || !isLoaded || !formReady} className="w-full">
          {mode === "edit" ? "Update Reservation" : totalAmount > 0 ? "Proceed to Payment" : "Complete Registration"}
        </Button>
        <Button onClick={() => setMode("view")} variant="outline" className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
