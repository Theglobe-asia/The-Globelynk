"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tier = "BASIC" | "SILVER" | "GOLD";

/* Email validation to match server rules */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* Auto-capitalize full name — “john smith” → “John Smith” */
function formatName(str: string) {
  return str
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function CreateMemberForm() {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("BASIC");
  const [status, setStatus] = useState("");

  const [existingEmails, setExistingEmails] = useState<string[]>([]);

  /* Load existing emails for duplicate check */
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((members) =>
        setExistingEmails(
          (members || []).map((m: any) =>
            String(m.email || "").trim().toLowerCase()
          )
        )
      )
      .catch(() => setExistingEmails([]));
  }, []);

  const cleanedEmail = email.trim().toLowerCase();
  const emailOk = isValidEmail(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanedName = formatName(name.trim());

    /* Validate before sending */
    if (!cleanedName || !emailOk) {
      toast({
        title: "Invalid Details",
        description: "Please enter a valid name and email.",
        variant: "destructive",
      });
      return;
    }

    /* Duplicate email prevention */
    if (existingEmails.includes(cleanedEmail)) {
      toast({
        title: "Duplicate Email",
        description: "This email already exists in your member list.",
        variant: "destructive",
      });
      return;
    }

    setStatus("Saving...");

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanedName,
        email: cleanedEmail,
        tier,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      toast({
        title: "Member Created",
        description: `${cleanedName} has been added successfully.`,
      });

      setStatus("Saved successfully");
      setName("");
      setEmail("");
      setTier("BASIC");

      /* Update for real-time duplicate detection */
      setExistingEmails((prev) => [...prev, cleanedEmail]);
    } else {
      toast({
        title: "Error",
        description: data.error || "Something went wrong.",
        variant: "destructive",
      });
      setStatus(data.error || "Error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
      <div>
        <label className="text-sm">Full Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name && setName(formatName(name))}
          required
        />
      </div>

      <div>
        <label className="text-sm">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={
            email.length > 0 && !emailOk ? "border-red-500" : ""
          }
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

      <Button
        type="submit"
        className="btn-gold"
        disabled={!name.trim() || !emailOk}
      >
        Create
      </Button>

      {status && <p className="text-sm text-gray-500">{status}</p>}
    </form>
  );
}
