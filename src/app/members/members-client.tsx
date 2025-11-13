"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Tier = "BASIC" | "SILVER" | "GOLD";
type Member = { id: string; name: string; email: string; tier: Tier; joinedAt?: string };

export default function MembersClient() {
  const [rows, setRows] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("BASIC");
  const [status, setStatus] = useState("");

  async function refresh() {
    const r = await fetch("/api/members", { cache: "no-store" });
    const j = await r.json();
    setRows(j);
  }

  useEffect(() => { refresh(); }, []);

  async function createMember() {
    setStatus("Saving…");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, tier }),
    });
    const j = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${j.error || "failed"}`);
      return;
    }
    setStatus("Saved");
    setName(""); setEmail(""); setTier("BASIC");
    await refresh();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Name</label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className="text-sm">Tier</label>
              <Select value={tier} onValueChange={(v:any)=>setTier(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={createMember}>Save Member</Button>
            {status && <span className="text-sm">{status}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{m.name}</td>
                  <td className="py-2 pr-4">{m.email}</td>
                  <td className="py-2 pr-4">{m.tier}</td>
                  <td className="py-2 pr-4">{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-3 text-muted-foreground" colSpan={4}>No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
