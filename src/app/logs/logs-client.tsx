"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, Calendar as CalendarIcon, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ---------- Types ----------
type Tier = "BASIC" | "SILVER" | "GOLD" | "UNKNOWN";
type Status = "SENT" | "FAILED";

export type EmailLogRow = {
  id: string;
  to: string;
  subject: string;
  status: Status;
  tier?: Tier | null;
  userName?: string | null;
  memberName?: string | null;
  createdAt: string | Date; // server can send string; normalize to Date client-side
};

// ---------- Small helpers ----------
function formatDay(d: Date) {
  // yyyy-mm-dd
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDate(v: string | Date) {
  return v instanceof Date ? v : new Date(v);
}

// Debounce hook
function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// CSV export (filtered)
function downloadCsv(rows: EmailLogRow[]) {
  const headers = ["Date", "To", "Subject", "Tier", "Status", "Member", "User"];
  const lines = rows.map((r) => [
    formatDay(toDate(r.createdAt)),
    r.to,
    (r.subject ?? "").replace(/"/g, '""'),
    r.tier ?? "UNKNOWN",
    r.status,
    r.memberName ?? "",
    r.userName ?? "",
  ]);
  const csv = [headers, ...lines].map((a) => a.map((x) => `"${String(x ?? "")}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `globelynk-email-logs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Nice color set for charts
const COLORS = ["#111827", "#b45309", "#D4AF37", "#1f2937", "#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

// ---------- Component ----------
export default function LogsClient({ rows }: { rows: EmailLogRow[] }) {
  // --- Filters (with debounce for search) ---
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 350);

  const [tier, setTier] = useState<"ALL" | "BASIC" | "SILVER" | "GOLD">("ALL");

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [openCal, setOpenCal] = useState(false);

  // Normalize data once
  const normalized = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        createdAt: toDate(r.createdAt),
        tier: (r.tier ?? "UNKNOWN") as Tier,
      })),
    [rows]
  );

  // Apply client-side filters
  const filtered = useMemo(() => {
    const qLower = debouncedQ.trim().toLowerCase();

    return normalized.filter((r) => {
      // Tier
      if (tier !== "ALL" && r.tier !== tier) return false;

      // Date range
      if (dateRange.from) {
        const d = r.createdAt as Date;
        if (d < new Date(dateRange.from.setHours(0, 0, 0, 0))) return false;
      }
      if (dateRange.to) {
        const d = r.createdAt as Date;
        if (d > new Date(dateRange.to.setHours(23, 59, 59, 999))) return false;
      }

      // Search text: to / subject / member / user / date string
      if (qLower) {
        const hay =
          `${r.to} ${r.subject ?? ""} ${r.memberName ?? ""} ${r.userName ?? ""} ${formatDay(r.createdAt as Date)}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [normalized, tier, dateRange, debouncedQ]);

  // ---- Aggregations for charts (auto-update with filtered) ----
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const key = formatDay(r.createdAt as Date);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));
  }, [filtered]);

  const byTier = useMemo(() => {
    const order: Tier[] = ["BASIC", "SILVER", "GOLD", "UNKNOWN"];
    const counts: Record<Tier, number> = { BASIC: 0, SILVER: 0, GOLD: 0, UNKNOWN: 0 };
    filtered.forEach((r) => (counts[r.tier as Tier] = (counts[r.tier as Tier] ?? 0) + 1));
    return order
      .map((t) => ({ name: t, value: counts[t] ?? 0 }))
      .filter((x) => x.value > 0);
  }, [filtered]);

  const total = filtered.length;
  const sent = filtered.filter((r) => r.status === "SENT").length;
  const failed = total - sent;

  // ------- UI -------
  return (
    <div className="space-y-6">
      {/* Filters row (above charts) */}
      <Card className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-60" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search subject, recipient, member, user, date…"
                  className="pl-9 bg-black/30 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Tier */}
            <div>
              <Select value={tier} onValueChange={(v: any) => setTier(v)}>
                <SelectTrigger className="bg-black/30 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent sideOffset={6} className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value="ALL">All tiers</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Popover open={openCal} onOpenChange={setOpenCal}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-black/30 border-zinc-700 text-zinc-100",
                      !dateRange.from && "text-zinc-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDay(dateRange.from)} — {formatDay(dateRange.to)}
                        </>
                      ) : (
                        formatDay(dateRange.from)
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto bg-zinc-900 border-zinc-700" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={(r: any) => setDateRange(r ?? {})}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                  <div className="flex items-center justify-between p-2 border-t border-zinc-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-300"
                      onClick={() => setDateRange({})}
                    >
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => setOpenCal(false)}>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Secondary row: counts + export */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">Total: {total}</Badge>
            <Badge className="bg-emerald-700/70">Sent: {sent}</Badge>
            <Badge className="bg-rose-700/70">Failed: {failed}</Badge>
            <div className="ml-auto">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-100"
                onClick={() => downloadCsv(filtered)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV (filtered)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Emails per Day</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byDay.length === 0 ? (
              <p className="text-sm text-zinc-400">No data in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDay}>
                  <XAxis dataKey="day" tick={{ fill: "#a1a1aa" }} />
                  <YAxis tick={{ fill: "#a1a1aa" }} />
                  <Tooltip
                    contentStyle={{ background: "#0b0b0b", border: "1px solid #27272a", color: "#e4e4e7" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>By Tier</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byTier.length === 0 ? (
              <p className="text-sm text-zinc-400">No data in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byTier} dataKey="value" nameKey="name" outerRadius={80}>
                    {byTier.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{ background: "#0b0b0b", border: "1px solid #27272a", color: "#e4e4e7" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Member</th>
                <th className="py-2 pr-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/40">
                  <td className="py-2 pr-4">{formatDay(r.createdAt as Date)}</td>
                  <td className="py-2 pr-4">{r.to}</td>
                  <td className="py-2 pr-4">{r.subject}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-200">
                      {r.tier ?? "UNKNOWN"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    {r.status === "SENT" ? (
                      <Badge className="bg-emerald-700/70">SENT</Badge>
                    ) : (
                      <Badge className="bg-rose-700/70">FAILED</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-4">{r.memberName ?? "-"}</td>
                  <td className="py-2 pr-4">{r.userName ?? "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-8 text-zinc-400" colSpan={7}>
                    No results. Try adjusting filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
