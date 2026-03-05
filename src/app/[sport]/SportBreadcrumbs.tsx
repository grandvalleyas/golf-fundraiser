"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getSportConfig } from "@/lib/sports";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const pageNames: Record<string, string> = {
  register: "Register",
  sponsor: "Sponsor",
  admin: "Admin",
  success: "Success",
};

export default function SportBreadcrumbs() {
  const { sport } = useParams<{ sport: string }>();
  const pathname = usePathname();
  const config = getSportConfig(sport);
  const segments = pathname.split("/").filter(Boolean);
  const page = segments[1]; // e.g. "register", "sponsor", "admin"

  if (!page || !pageNames[page]) return null;

  return (
    <div className="container mx-auto px-6 pt-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Events</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/${sport}`}>{config.name}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{pageNames[page]}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
