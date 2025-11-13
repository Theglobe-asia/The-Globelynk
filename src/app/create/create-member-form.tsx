"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Tier = "BASIC" | "SILVER" | "GOLD";

export default function CreateMemberForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("BASIC");
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Saving...");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, tier }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("Saved successfully");
      setName("");
      setEmail("");
      setTier("BASIC");
    } else {
      setStatus(data.error || "Error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
      <div>
        <label className="text-sm">Full Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm">Tier</label>
        <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
          <SelectTrigger>
            <SelectValue placeholder="Select tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASIC">BASIC</SelectItem>
            <SelectItem value="SILVER">SILVER</SelectItem>
            <SelectItem value="GOLD">GOLD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="btn-gold">Create</Button>
      {status && <p className="text-sm text-gray-500">{status}</p>}
    </form>
  );
}
