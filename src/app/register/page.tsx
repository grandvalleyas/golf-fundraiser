"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SpotDetails = {
  spotId?: string;
  name: string;
  phone: string;
  email: string;
  userId?: string;
};

type ValidationErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export default function Register() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [spots, setSpots] = useState(1);
  const [donation, setDonation] = useState(150);
  const [spotDetails, setSpotDetails] = useState<SpotDetails[]>([{ name: "", phone: "", email: "" }]);
  const [purchasedSpots, setPurchasedSpots] = useState<SpotDetails[]>([]);
  const [editedSpot, setEditedSpot] = useState<SpotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalSpots, setTotalSpots] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>([{ name: "", phone: "", email: "" }]);
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);
  const initialPurchasedSpotsRef = useRef<SpotDetails[]>([]);
  const searchParams = useSearchParams();

  const fetchPurchasedSpots = useCallback(
    async (isPolling = false) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch("/api/teams/user-spots", {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          try {
            const error = JSON.parse(text);
            throw new Error(error.error || "Failed to fetch spots");
          } catch {
            throw new Error("Failed to fetch spots: Invalid response format");
          }
        }

        const text = await response.text();
        if (!text) {
          console.log(`No spots found for user ${user.id}`);
          setPurchasedSpots([]);
          setTotalSpots(0);
          if (isPolling) setLoading(false);
          return;
        }

        const data = JSON.parse(text);
        console.log(`Fetched purchased spots for user ${user.id}:`, data.spots);
        const newPurchasedSpots = data.spots || [];
        setPurchasedSpots(newPurchasedSpots);
        setTotalSpots(newPurchasedSpots.length);
        if (isPolling) setLoading(false);
      } catch (err) {
        console.error("Error fetching purchased spots:", err);
        toast({
          title: "Error",
          description: "Failed to fetch purchased spots",
          variant: "destructive",
        });
        setPurchasedSpots([]);
        setTotalSpots(0);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, toast]
  );

  useEffect(() => {
    if (user) {
      fetchPurchasedSpots();
      initialPurchasedSpotsRef.current = [...purchasedSpots];
    }
  }, [user, fetchPurchasedSpots, purchasedSpots]);

  useEffect(() => {
    if (searchParams.get("success") === "true" && user) {
      setLoading(true);
      initialPurchasedSpotsRef.current = [...purchasedSpots];
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        fetchPurchasedSpots(true);
        attempts++;
        if (!loading || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [searchParams, fetchPurchasedSpots, user, loading, purchasedSpots]);

  const handleSpotChange = (index: number, field: keyof SpotDetails, value: string) => {
    const newSpotDetails = [...spotDetails];
    newSpotDetails[index] = { ...newSpotDetails[index], [field]: value };
    setSpotDetails(newSpotDetails);
    if (newSpotDetails[index][field] !== spotDetails[index][field]) {
      validateForm(index, value, field);
    }
  };

  const handleSpotsChange = (value: string) => {
    const parsedValue = parseInt(value);
    const newTotal = totalSpots + parsedValue;
    if (newTotal > 4) {
      toast({
        title: "Error",
        description: `Cannot add ${parsedValue} spot(s). You already have ${totalSpots}, and the maximum is 4.`,
        variant: "destructive",
      });
      return;
    }
    setSpots(parsedValue);
    const newSpotDetails = [...spotDetails];
    if (parsedValue > newSpotDetails.length) {
      for (let i = newSpotDetails.length; i < parsedValue; i++) {
        newSpotDetails.push({ name: "", phone: "", email: "" });
      }
      setValidationErrors((prev) => {
        const newErrors = [...prev];
        for (let i = prev.length; i < parsedValue; i++) {
          newErrors.push({ name: "", phone: "", email: "" });
        }
        return newErrors;
      });
    } else {
      newSpotDetails.length = parsedValue;
      setValidationErrors((prev) => prev.slice(0, parsedValue));
    }
    setSpotDetails(newSpotDetails);
  };

  const validateForm = (index: number, value: string, field: keyof SpotDetails) => {
    const errors = [...validationErrors];
    const nameRegex = /^[^\s]+\s+[^\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    switch (field) {
      case "name":
        errors[index].name = nameRegex.test(value) ? "" : "Name must be in 'first last' format (e.g., 'John Doe')";
        break;
      case "email":
        errors[index].email = emailRegex.test(value) ? "" : "Please enter a valid email address";
        break;
      case "phone":
        errors[index].phone = phoneRegex.test(value) ? "" : "Please enter a valid phone number (e.g., '123-456-7890')";
        break;
    }
    setValidationErrors(errors);
  };

  const isFormValid = () => {
    return (
      spotDetails.every((spot, index) => {
        const { name, phone, email } = spot;
        const { name: nameError, phone: phoneError, email: emailError } = validationErrors[index] || {};
        return !nameError && !phoneError && !emailError && name && phone && email;
      }) && donation >= 150
    );
  };

  const handleCheckout = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before proceeding.",
        variant: "destructive",
      });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          spots,
          donation,
          userId: user?.id,
          spotDetails,
        }),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Failed to initiate payment");
        } catch {
          throw new Error("Failed to initiate payment: Invalid response format");
        }
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Error during checkout:", err);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  const handleEditSpotChange = (field: keyof SpotDetails, value: string) => {
    if (!editedSpot) return;
    setEditedSpot({ ...editedSpot, [field]: value });
    validateForm(0, value, field);
  };

  const handleSubmitEditSpot = async () => {
    if (!editedSpot || !editedSpot.spotId) return;

    const { name, phone, email } = editedSpot;
    const nameError = /^[^\s]+\s+[^\s]+$/.test(name) ? "" : "Name must be in 'first last' format";
    const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Invalid email address";
    const phoneError = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone) ? "" : "Invalid phone number";

    if (nameError || emailError || phoneError) {
      toast({
        title: "Validation Error",
        description: nameError || emailError || phoneError,
        variant: "destructive",
      });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/teams/edit-spot", {
        method: "PUT",
        body: JSON.stringify({
          userId: user?.id,
          spotId: editedSpot.spotId,
          updatedDetails: editedSpot,
        }),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Failed to update spot");
        } catch {
          throw new Error("Failed to update spot: Invalid response format");
        }
      }

      fetchPurchasedSpots();
      setEditedSpot(null);
      toast({
        title: "Success",
        description: "Spot updated successfully!",
      });
    } catch (err) {
      console.error("Error updating spot:", err);
      toast({
        title: "Error",
        description: "Failed to update spot",
        variant: "destructive",
      });
    }
  };

  const filteredRegistrations = purchasedSpots.filter((spot) => {
    const nameMatch = spot.name.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = spot.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = spot.email.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || phoneMatch || emailMatch;
  });

  const maxSpots = 4 - totalSpots;

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-background">
      <section className="relative h-64 sm:h-80">
        <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1741935541/wvjbv64sllc38p7y042e.webp" alt="Stadium View" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">Register for Golf Outing</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {loading && <p className="text-muted-foreground text-sm sm:text-base">Loading purchased spots...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Purchase Spots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor="spots" className="text-sm sm:text-base">
                    Number of Players <span className="text-xs sm:text-sm text-muted-foreground pl-1">({maxSpots} Remaining)</span>
                  </Label>
                  <Select onValueChange={handleSpotsChange} value={spots.toString()}>
                    <SelectTrigger id="spots" className="w-full text-sm sm:text-base mt-1">
                      <SelectValue placeholder="Select number of players" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()} disabled={num > maxSpots}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Number of spots to purchase</p>
                </div>
                <div>
                  <Label htmlFor="donation" className="text-sm sm:text-base">
                    Donation per Player ($150 min)
                  </Label>
                  <Input id="donation" type="number" min={150} step={5} value={donation} onChange={(e) => setDonation(parseInt(e.target.value))} className="w-full text-sm sm:text-base mt-1" />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Minimum $150 per golfer</p>
                </div>
              </div>
              <div className="space-y-4">
                {spotDetails.map((spot, index) => (
                  <div key={index} className="space-y-2 p-3 sm:p-4 bg-muted rounded-md border-l-4 border-primary">
                    <h3 className="font-semibold text-primary text-sm sm:text-base">Player {totalSpots + index + 1}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor={`name-${index}`} className="text-sm sm:text-base">
                          Full Name
                        </Label>
                        <Input
                          id={`name-${index}`}
                          value={spot.name}
                          onChange={(e) => handleSpotChange(index, "name", e.target.value)}
                          placeholder="John Doe"
                          className="w-full text-sm sm:text-base mt-1"
                        />
                        {validationErrors[index]?.name && <p className="text-xs text-red-500 mt-1">{validationErrors[index].name}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`} className="text-sm sm:text-base">
                          Phone
                        </Label>
                        <Input
                          id={`phone-${index}`}
                          value={spot.phone}
                          onChange={(e) => handleSpotChange(index, "phone", e.target.value)}
                          placeholder="Phone Number"
                          maxLength={12}
                          className="w-full text-sm sm:text-base mt-1"
                        />
                        {validationErrors[index]?.phone && <p className="text-xs text-red-500 mt-1">{validationErrors[index].phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`} className="text-sm sm:text-base">
                          Email
                        </Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={spot.email}
                          onChange={(e) => handleSpotChange(index, "email", e.target.value)}
                          placeholder="Email"
                          className="w-full text-sm sm:text-base mt-1"
                        />
                        {validationErrors[index]?.email && <p className="text-xs text-red-500 mt-1">{validationErrors[index].email}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleCheckout} className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base py-2" disabled={!isFormValid()}>
                {donation >= 150 ? `Proceed to Payment (\$${spots * donation})` : "Invalid Fields"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Your Purchased Spots ({purchasedSpots.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="my-2" />
              {purchasedSpots.length === 0 ? (
                <p className="text-muted-foreground text-sm sm:text-base">No spots purchased yet.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="search-registrations" className="text-sm sm:text-base">
                      Search Your Registrations
                    </Label>
                    <Input
                      id="search-registrations"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, phone, or email"
                      className="w-full text-sm sm:text-base mt-1"
                    />
                  </div>
                  <div className="sm:hidden space-y-4">
                    {filteredRegistrations.map((spot) => (
                      <details
                        key={spot.spotId}
                        className="border rounded-lg overflow-hidden"
                        open={openSpotId === spot.spotId}
                        onToggle={(e) => setOpenSpotId(e.currentTarget.open ? spot.spotId ?? null : null)}>
                        <summary className="flex items-center justify-between p-3 bg-gray-100 cursor-pointer hover:bg-gray-200">
                          <span className="text-sm font-semibold">{spot.name}</span>
                        </summary>
                        <div className="p-4 bg-white space-y-2">
                          <p className="text-sm">
                            <strong>Phone:</strong> {spot.phone}
                          </p>
                          <p className="text-sm">
                            <strong>Email:</strong> {spot.email}
                          </p>
                          <Dialog open={editedSpot?.spotId === spot.spotId} onOpenChange={(open) => setEditedSpot(open ? { ...spot } : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="text-xs px-2 py-1 w-full">
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Spot: {spot.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name" className="text-sm">
                                    Name
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={editedSpot?.name || ""}
                                    onChange={(e) => handleEditSpotChange("name", e.target.value)}
                                    placeholder="Name"
                                    className="w-full text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-phone" className="text-sm">
                                    Phone
                                  </Label>
                                  <Input
                                    id="edit-phone"
                                    value={editedSpot?.phone || ""}
                                    onChange={(e) => handleEditSpotChange("phone", e.target.value)}
                                    placeholder="Phone"
                                    className="w-full text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-email" className="text-sm">
                                    Email
                                  </Label>
                                  <Input
                                    id="edit-email"
                                    value={editedSpot?.email || ""}
                                    onChange={(e) => handleEditSpotChange("email", e.target.value)}
                                    placeholder="Email"
                                    className="w-full text-sm mt-1"
                                  />
                                </div>
                                <Button onClick={handleSubmitEditSpot} className="w-full bg-green-500 hover:bg-green-600 text-sm py-2">
                                  Submit Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </details>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm min-w-[120px]">Name</TableHead>
                          <TableHead className="text-sm min-w-[120px]">Phone</TableHead>
                          <TableHead className="text-sm min-w-[150px]">Email</TableHead>
                          <TableHead className="text-sm min-w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((spot) => (
                          <TableRow key={spot.spotId}>
                            <TableCell className="text-sm">{spot.name}</TableCell>
                            <TableCell className="text-sm">{spot.phone}</TableCell>
                            <TableCell className="text-sm">{spot.email}</TableCell>
                            <TableCell>
                              <Dialog open={editedSpot?.spotId === spot.spotId} onOpenChange={(open) => setEditedSpot(open ? { ...spot } : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="text-sm px-4 py-2">
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Spot: {spot.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-name" className="text-base">
                                        Name
                                      </Label>
                                      <Input
                                        id="edit-name"
                                        value={editedSpot?.name || ""}
                                        onChange={(e) => handleEditSpotChange("name", e.target.value)}
                                        placeholder="Name"
                                        className="w-full text-base mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-phone" className="text-base">
                                        Phone
                                      </Label>
                                      <Input
                                        id="edit-phone"
                                        value={editedSpot?.phone || ""}
                                        onChange={(e) => handleEditSpotChange("phone", e.target.value)}
                                        placeholder="Phone"
                                        className="w-full text-base mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-email" className="text-base">
                                        Email
                                      </Label>
                                      <Input
                                        id="edit-email"
                                        value={editedSpot?.email || ""}
                                        onChange={(e) => handleEditSpotChange("email", e.target.value)}
                                        placeholder="Email"
                                        className="w-full text-base mt-1"
                                      />
                                    </div>
                                    <Button onClick={handleSubmitEditSpot} className="w-full bg-green-500 hover:bg-green-600 text-base py-2">
                                      Submit Changes
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
