"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/send", label: "Send Email" },
  { href: "/create", label: "Create Data" },
  { href: "/customize", label: "Customize" },
  { href: "/report", label: "Report" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3">

          {/* BRAND */}
          <Link href="/dashboard" className="font-semibold text-lg">
            Elizabeth
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  pathname === l.href
                    ? "bg-black text-white"
                    : "hover:bg-neutral-100"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* DESKTOP SIGN OUT */}
          <button
            className="hidden md:block btn-gold text-sm"
            onClick={() => signOut({ callbackUrl: "/signin" })}
          >
            Sign out
          </button>

          {/* MOBILE BURGER BUTTON */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-neutral-200"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR PANEL */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 p-6 flex flex-col gap-6 transform transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">Elizabeth</span>
          <button onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-3 py-2 rounded-md text-sm",
                pathname === l.href
                  ? "bg-black text-white"
                  : "hover:bg-neutral-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Sign Out */}
        <button
          className="mt-auto btn-gold"
          onClick={() => {
            setOpen(false);
            signOut({ callbackUrl: "/signin" });
          }}
        >
          Sign out
        </button>
      </aside>
    </>
  );
}
