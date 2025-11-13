"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function MemberForm({ onDone }: { onDone?: ()=>void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tier, setTier] = useState("BASIC");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/members", {
      method: "POST",
      body: JSON.stringify({ name, email, notes, tier }),
    });
    setLoading(false);
    if (!res.ok) { setMsg("Error creating member"); return; }
    setMsg("Member created");
    setName(""); setEmail(""); setNotes(""); setTier("BASIC");
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={e=>setName(e.target.value)} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
      <div>
        <Label>Privileged Member</Label>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="BASIC">basic</SelectItem>
            <SelectItem value="SILVER">silver</SelectItem>
            <SelectItem value="GOLD">gold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button disabled={loading} className="btn-gold">{loading ? "Saving..." : "Create Data"}</Button>
      {msg && <p className="text-sm text-neutral-600">{msg}</p>}
    </form>
  );
}
