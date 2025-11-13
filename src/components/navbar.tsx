"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/send", label: "Send Email" },
  { href: "/create", label: "Create Data" },
  { href: "/customize", label: "Customize" },
  { href: "/report", label: "Report" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
        <Link href="/dashboard" className="font-semibold">GlobeLynk</Link>
        <nav className="flex gap-3">
          {links.map(l => (
            <Link key={l.href}
              href={l.href}
              className={cn("px-3 py-1 rounded-full text-sm",
                pathname===l.href ? "bg-black text-white" : "hover:bg-neutral-100")}>
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="btn-gold text-sm" onClick={()=>signOut({ callbackUrl: "/signin" })}>Sign out</button>
      </div>
    </header>
  );
}
