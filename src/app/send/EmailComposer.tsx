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

type Member = {
  id: string;
  name: string;
  email: string;
  tier: "BASIC" | "SILVER" | "GOLD";
};

export default function EmailComposer() {
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<"individual" | "bulk">("individual");
  const [tier, setTier] = useState<"all" | "basic" | "silver" | "gold">("all");
  const [selected, setSelected] = useState("");
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
        tier,           // "all" | "basic" | "silver" | "gold"
        to: selected,   // when individual
        subject,
        body,
      }),
    });
    const j = await res.json().catch(() => ({} as any));
    if (res.ok) setStatus(`Sent: ${j.count ?? 1} email(s)`);
    else setStatus(`Error: ${j?.error || "unknown"}`);
  }

  const filtered =
    tier === "all"
      ? members
      : members.filter((m) => m.tier === tier.toUpperCase());

  return (
    <div className="grid gap-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Send</label>
          <Select value={mode} onValueChange={(v: any) => setMode(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">individual</SelectItem>
              <SelectItem value="bulk">bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm">Privileged Member</label>
          <Select value={tier} onValueChange={(v: any) => setTier(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">basic</SelectItem>
              <SelectItem value="silver">silver</SelectItem>
              <SelectItem value="gold">gold</SelectItem>
              <SelectItem value="all">all</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "individual" && (
        <div>
          <label className="text-sm">Member</label>
          <Select value={selected} onValueChange={(v: any) => setSelected(v)}>
            <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
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

      <div>
        <label className="text-sm">To</label>
        <Input
          readOnly
          value={mode === "individual" ? selected : `${filtered.length} recipients`}
        />
      </div>

      <div>
        <label className="text-sm">Subject</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div>
        <label className="text-sm">Body</label>
        <Textarea
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
        />
      </div>

      <div>
        <label className="text-sm">From</label>
        <Input readOnly value="The Globe in Pattaya" />
      </div>

      <Button className="btn-gold" onClick={send}>Send Email</Button>
      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}
