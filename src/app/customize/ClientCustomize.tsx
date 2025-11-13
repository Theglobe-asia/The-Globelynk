"use client";

import { useMemo, useState } from "react";
import { TriangleAlert, CheckCircle2, Trash2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Tier = "BASIC" | "SILVER" | "GOLD";

type CustomizeMember = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  joinedAt: string | Date;
};

interface Props {
  members: CustomizeMember[];
}

type ToastState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export default function ClientCustomize({ members }: Props) {
  const [rows, setRows] = useState<CustomizeMember[]>(members);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "basic" | "silver" | "gold">("all");

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>(null);

  function showToast(next: ToastState) {
    setToast(next);
    if (next) setTimeout(() => setToast(null), 2500);
  }

  const filtered = useMemo(() => {
    return rows.filter((m) => {
      const matchText =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase());
      const matchTier =
        filterTier === "all" ||
        m.tier === filterTier.toUpperCase();
      return matchText && matchTier;
    });
  }, [rows, search, filterTier]);

  function handleLocalTierChange(id: string, nextTier: Tier) {
    setRows((prev) =>
      prev.map((m) => (m.id === id ? { ...m, tier: nextTier } : m))
    );
  }

  async function handleSaveTier(id: string) {
    const row = rows.find((m) => m.id === id);
    if (!row) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: row.tier }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        showToast({
          type: "error",
          message: j.error || "Failed to update tier",
        });
      } else {
        showToast({
          type: "success",
          message: `Tier updated to ${row.tier}`,
        });
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        showToast({
          type: "error",
          message: j.error || "Failed to delete",
        });
      } else {
        setRows((prev) => prev.filter((m) => m.id !== id));
        showToast({
          type: "success",
          message: "Successfully deleted",
        });
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <>
      {/* Card — white background, black text */}
      <Card className="border bg-white text-black shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Customize Members
          </CardTitle>
          <p className="text-sm text-black/60">
            Update membership tier or remove members.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border-black/20 text-black"
            />

            <Select
              value={filterTier}
              onValueChange={(v) => setFilterTier(v as any)}
            >
              <SelectTrigger className="bg-white border-black/20 text-black">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-black/10">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="py-3 grid gap-3 md:grid-cols-[2fr,2fr,1fr,1fr,auto] items-center"
              >
                {/* Name */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-black/60 md:hidden">{m.email}</span>
                </div>

                <div className="hidden md:block text-sm truncate">{m.email}</div>

                {/* Tier select */}
                <Select
                  value={m.tier}
                  onValueChange={(v) => handleLocalTierChange(m.id, v as Tier)}
                >
                  <SelectTrigger className="bg-white border-black/20 text-black text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="SILVER">SILVER</SelectItem>
                    <SelectItem value="GOLD">GOLD</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-black text-black text-xs"
                    onClick={() => handleSaveTier(m.id)}
                    disabled={savingId === m.id}
                  >
                    {savingId === m.id ? "Saving..." : "Save"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-600 p-0 px-2"
                    onClick={() => setConfirmDeleteId(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="py-6 text-sm text-black/60 text-center">
                No members found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete dialog — same structure, white bg */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white text-black border-black/20">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              <div>
                <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                <AlertDialogDescription className="text-black/70">
                  This member will be permanently removed.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast — white with black text */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-white border border-black/20 px-4 py-3 shadow-xl text-black">
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <TriangleAlert className="h-5 w-5 text-amber-500" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}
    </>
  );
}
