"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import XLSX from "xlsx-js-style";
import { useToast } from "@/components/ui/use-toast";
import { getSportConfig } from "@/lib/sports";
import Image from "next/image";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

type Registration = {
  _id: string; userId: string; paymentStatus: string; name: string; email: string;
  phone: string; tshirtSize?: string; preferredGolfers: string[]; isFirstYearAlumni: boolean;
  payForPreferred: string[]; amount: number;
};

type Sponsor = {
  _id: string; userId: string; name: string; tier: string; price: number;
  logo: string; text: string; websiteLink: string; freeGolfers: string[];
};

type SortDir = "asc" | "desc" | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ArrowUp className="inline h-3 w-3 ml-1" />;
  if (dir === "desc") return <ArrowDown className="inline h-3 w-3 ml-1" />;
  return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-30" />;
}

function useSortableData<T>(items: T[]) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const toggle = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return items;
    return [...items].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const dirFor = (key: keyof T): SortDir => (sortKey === key ? sortDir : null);

  return { sorted, toggle, dirFor };
}

const PAGE_SIZES = [10, 25, 50];

export default function AdminDashboard() {
  const { sport } = useParams<{ sport: string }>();
  const config = getSportConfig(sport);
  const apiBase = `/api/${sport}`;
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [regSearch, setRegSearch] = useState("");
  const [sponSearch, setSponSearch] = useState("");
  const [regPage, setRegPage] = useState(0);
  const [sponPage, setSponPage] = useState(0);
  const [regPageSize, setRegPageSize] = useState(10);
  const [sponPageSize, setSponPageSize] = useState(10);

  const isAdmin = isLoaded && user?.publicMetadata?.role === "admin";
  const sportAccess = user?.publicMetadata?.sports as string[] | undefined;
  const hasAccess = isAdmin && (!sportAccess || sportAccess.includes(sport));

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    (async () => {
      try {
        const [regRes, sponRes] = await Promise.all([fetch(`${apiBase}/admin/registrations`), fetch(`${apiBase}/admin/sponsors`)]);
        setRegistrations((await regRes.json()) || []);
        setSponsors((await sponRes.json()) || []);
      } catch {
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, [hasAccess, apiBase, toast]);

  const filteredRegs = useMemo(() => {
    if (!regSearch) return registrations;
    const q = regSearch.toLowerCase();
    return registrations.filter((r) => [r.name, r.email, r.phone, r.paymentStatus, ...r.preferredGolfers].some((v) => v?.toLowerCase().includes(q)));
  }, [registrations, regSearch]);

  const filteredSpons = useMemo(() => {
    if (!sponSearch) return sponsors;
    const q = sponSearch.toLowerCase();
    return sponsors.filter((s) => [s.name, s.tier, s.websiteLink, ...s.freeGolfers].some((v) => v?.toLowerCase().includes(q)));
  }, [sponsors, sponSearch]);

  const regSort = useSortableData(filteredRegs);
  const sponSort = useSortableData(filteredSpons);

  const regTotal = registrations.reduce((s, r) => s + (r.amount || 0), 0);
  const sponTotal = sponsors.reduce((s, sp) => s + (sp.price || 0), 0);

  // Reset page on search/filter change
  useEffect(() => setRegPage(0), [regSearch, regPageSize]);
  useEffect(() => setSponPage(0), [sponSearch, sponPageSize]);

  const pagedRegs = regSort.sorted.slice(regPage * regPageSize, (regPage + 1) * regPageSize);
  const pagedSpons = sponSort.sorted.slice(sponPage * sponPageSize, (sponPage + 1) * sponPageSize);
  const regPages = Math.ceil(regSort.sorted.length / regPageSize);
  const sponPages = Math.ceil(sponSort.sorted.length / sponPageSize);

  const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1F2937" } }, alignment: { horizontal: "center" as const } };
  const totalStyle = { font: { bold: true }, fill: { fgColor: { rgb: "E5E7EB" } } };
  const dollarFmt = '"$"#,##0';

  const styleSheet = (ws: XLSX.WorkSheet, colCount: number, rowCount: number, dollarCols: number[]) => {
    // Header row
    for (let c = 0; c < colCount; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) cell.s = headerStyle;
    }
    // Total row
    for (let c = 0; c < colCount; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: rowCount, c })];
      if (cell) cell.s = totalStyle;
    }
    // Dollar formatting
    for (let r = 1; r <= rowCount; r++) {
      for (const c of dollarCols) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell && typeof cell.v === "number") cell.z = dollarFmt;
      }
    }
    // Auto column widths
    ws["!cols"] = Array.from({ length: colCount }, (_, c) => {
      let max = 10;
      for (let r = 0; r <= rowCount; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell?.v) max = Math.max(max, String(cell.v).length + 2);
      }
      return { wch: Math.min(max, 40) };
    });
  };

  const exportToExcel = () => {
    const regData = [...registrations.map((r) => ({
      Name: r.name, Email: r.email, Phone: r.phone, ...(config.hasTshirtSize ? { "T-Shirt": r.tshirtSize || "" } : {}), Status: r.paymentStatus,
      "Preferred Golfers": r.preferredGolfers?.join(", "), "First Year Alumni": r.isFirstYearAlumni ? "Yes" : "No",
      "Pay for Preferred": r.payForPreferred?.join(", "), Amount: r.amount,
    })), { Name: "TOTAL", Email: "", Phone: "", ...(config.hasTshirtSize ? { "T-Shirt": "" } : {}), Status: "", "Preferred Golfers": "", "First Year Alumni": "", "Pay for Preferred": "", Amount: regTotal }];
    const sponData = [...sponsors.map((s) => ({
      Name: s.name, Tier: s.tier, Price: s.price, Logo: s.logo,
      Website: s.websiteLink, "Free Golfers": s.freeGolfers?.join(", "), Description: s.text,
    })), { Name: "TOTAL", Tier: "", Price: sponTotal, Logo: "", Website: "", "Free Golfers": "", Description: "" }];

    const wb = XLSX.utils.book_new();
    const regColCount = config.hasTshirtSize ? 9 : 8;
    const ws1 = XLSX.utils.json_to_sheet(regData);
    styleSheet(ws1, regColCount, regData.length, [regColCount - 1]);
    const ws2 = XLSX.utils.json_to_sheet(sponData);
    styleSheet(ws2, 7, sponData.length, [2]); // Price is col 2
    XLSX.utils.book_append_sheet(wb, ws1, "Registrations");
    XLSX.utils.book_append_sheet(wb, ws2, "Sponsors");
    XLSX.writeFile(wb, `${sport}_admin_data_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "")}.xlsx`);
  };

  if (!isLoaded) return <div className="p-6">Loading...</div>;
  if (!hasAccess) return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Unauthorized</h1>
      <p className="text-muted-foreground">You do not have access to this dashboard.</p>
    </div>
  );

  const Pagination = ({ page, pages, setPage, pageSize, setPageSize, total }: {
    page: number; pages: number; setPage: (p: number) => void;
    pageSize: number; setPageSize: (s: number) => void; total: number;
  }) => (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Rows per page:
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <span className="ml-2">{total === 0 ? "0" : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`}</span>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
        <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );

  const TH = <T,>({ label, sortKey, sort }: { label: string; sortKey: keyof T; sort: ReturnType<typeof useSortableData<T>> }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => sort.toggle(sortKey)}>
      {label}<SortIcon dir={sort.dirFor(sortKey)} />
    </TableHead>
  );

  return (
    <div>
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{config.name} — Admin Dashboard</h1>
          <div className="flex gap-3">
            <Link href={`/${sport}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Event</Link>
            <Button onClick={exportToExcel}>Export to Excel</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Registrations</p><p className="text-2xl font-bold">{registrations.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Sponsors</p><p className="text-2xl font-bold">{sponsors.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${(regTotal + sponTotal).toLocaleString()}</p></CardContent></Card>
        </div>

        {loading ? <p className="text-muted-foreground">Loading data...</p> : (
          <>
            {/* Registrations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Registrations ({filteredRegs.length})</CardTitle>
                  <Input placeholder="Search registrations..." value={regSearch} onChange={(e) => setRegSearch(e.target.value)} className="max-w-xs" />
                </div>
                <p className="text-sm text-muted-foreground">Total: ${regTotal.toLocaleString()}</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TH<Registration> label="Name" sortKey="name" sort={regSort} />
                        <TH<Registration> label="Email" sortKey="email" sort={regSort} />
                        <TH<Registration> label="Phone" sortKey="phone" sort={regSort} />
                        {config.hasTshirtSize && <TableHead>T-Shirt</TableHead>}
                        <TH<Registration> label="Status" sortKey="paymentStatus" sort={regSort} />
                        <TableHead>Preferred Golfers</TableHead>
                        <TableHead>First Year Alumni</TableHead>
                        <TableHead>Pay for Preferred</TableHead>
                        <TH<Registration> label="Amount" sortKey="amount" sort={regSort} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRegs.length === 0 ? (
                        <TableRow><TableCell colSpan={config.hasTshirtSize ? 9 : 8} className="text-center text-muted-foreground">No registrations found</TableCell></TableRow>
                      ) : pagedRegs.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                          <TableCell>{r.phone}</TableCell>
                          {config.hasTshirtSize && <TableCell>{r.tshirtSize || "—"}</TableCell>}
                          <TableCell><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{r.paymentStatus}</span></TableCell>
                          <TableCell>{r.preferredGolfers?.join(", ") || "—"}</TableCell>
                          <TableCell>{r.isFirstYearAlumni ? "Yes" : "No"}</TableCell>
                          <TableCell>{r.payForPreferred?.join(", ") || "—"}</TableCell>
                          <TableCell className="font-medium">${r.amount?.toLocaleString() || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={regPage} pages={regPages} setPage={setRegPage} pageSize={regPageSize} setPageSize={setRegPageSize} total={filteredRegs.length} />
              </CardContent>
            </Card>

            {/* Sponsors */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sponsors ({filteredSpons.length})</CardTitle>
                  <Input placeholder="Search sponsors..." value={sponSearch} onChange={(e) => setSponSearch(e.target.value)} className="max-w-xs" />
                </div>
                <p className="text-sm text-muted-foreground">Total: ${sponTotal.toLocaleString()}</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TH<Sponsor> label="Name" sortKey="name" sort={sponSort} />
                        <TH<Sponsor> label="Tier" sortKey="tier" sort={sponSort} />
                        <TH<Sponsor> label="Price" sortKey="price" sort={sponSort} />
                        <TableHead>Logo</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Free Golfers</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedSpons.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No sponsors found</TableCell></TableRow>
                      ) : pagedSpons.map((s) => (
                        <TableRow key={s._id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.tier}</TableCell>
                          <TableCell className="font-medium">${s.price?.toLocaleString()}</TableCell>
                          <TableCell>{s.logo ? <a href={s.logo} target="_blank" rel="noopener noreferrer"><div className="relative w-10 h-10"><Image src={s.logo} alt={s.name} fill className="object-contain rounded" /></div></a> : "—"}</TableCell>
                          <TableCell>{s.websiteLink ? <a href={s.websiteLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px] block">{s.websiteLink}</a> : "—"}</TableCell>
                          <TableCell>{s.freeGolfers?.join(", ") || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{s.text || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={sponPage} pages={sponPages} setPage={setSponPage} pageSize={sponPageSize} setPageSize={setSponPageSize} total={filteredSpons.length} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
