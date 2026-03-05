import { notFound } from "next/navigation";
import { isValidSport } from "@/lib/sports";
import SportBreadcrumbs from "./SportBreadcrumbs";

export default async function SportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!isValidSport(sport)) notFound();
  return (
    <>
      <SportBreadcrumbs />
      {children}
    </>
  );
}
