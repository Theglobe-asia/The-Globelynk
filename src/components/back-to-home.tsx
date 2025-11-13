"use client";
import Link from "next/link";

export default function  BackToDashboard() {
  return (
    <div className="mb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
