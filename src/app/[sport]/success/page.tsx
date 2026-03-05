import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default async function SuccessPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="bg-card rounded-xl shadow-sm p-8 sm:p-12 text-center max-w-md w-full">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Registration Complete</h1>
        <p className="text-muted-foreground mb-8">Thank you for signing up. You&apos;re all set!</p>
        <div className="flex flex-col gap-3">
          <Link href={`/${sport}/register`}><Button className="w-full">View Your Reservation</Button></Link>
          <Link href={`/${sport}`}><Button variant="ghost" className="w-full">Back to Event</Button></Link>
        </div>
      </div>
    </div>
  );
}
