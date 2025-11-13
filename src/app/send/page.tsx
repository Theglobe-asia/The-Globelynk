"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BackToDashboard from "@/components/back-to-dashboard";

type Member = {
  id: string;
  name: string;
  email: string;
  tier: "BASIC" | "SILVER" | "GOLD";
};

export default function SendPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<"individual" | "bulk">("individual");
  const [tier, setTier] = useState<"all" | "basic" | "silver" | "gold">("all");
  const [selected, setSelected] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  async function send() {
    setStatus("Sending...");
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segment: mode,
        tier,
        to: selected,
        subject,
        body,
      }),
    });
    const j = await res.json();
    if (res.ok) setStatus(`Sent: ${j.count} email(s)`);
    else setStatus(`Error: ${j.error || "unknown"}`);
  }

  const filtered =
    tier === "all"
      ? members
      : members.filter((m) => m.tier === tier.toUpperCase());

  return (
    <div className="p-6 space-y-6">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Send Email</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Send Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">individual</SelectItem>
              <SelectItem value="bulk">bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Tier</label>
          <Select value={tier} onValueChange={(v) => setTier(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="basic">basic</SelectItem>
              <SelectItem value="silver">silver</SelectItem>
              <SelectItem value="gold">gold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "individual" && (
        <div>
          <label className="text-sm">Member</label>
          <Select value={selected} onValueChange={(v) => setSelected(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {filtered.map((m) => (
                <SelectItem key={m.id} value={m.email}>
                  {m.name} &lt;{m.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Input
        readOnly
        value={
          mode === "individual" ? selected : `${filtered.length} recipients`
        }
      />

      <Input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <Textarea
        rows={8}
        placeholder="Write your message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <Button className="btn-gold" onClick={send}>
        Send Email
      </Button>

      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}
