// app/checkout/success/page.tsx
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-semibold mb-4">Registration Complete</h1>
      <p className="mb-6">Thank you for signing up</p>
      <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded">
        Go Home
      </Link>
    </div>
  );
}
