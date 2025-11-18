import Link from "next/link";
import CoverAvatar from "@/components/cover-avatar";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto text-center space-y-8">
        <CoverAvatar />
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
          Elizabeth
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          CRM Developed by Chef Alex
        </p>

        <div className="pt-2">
          <Link
            href="/signin"
            className="inline-flex items-center rounded-xl bg-black text-white px-6 py-3 text-sm font-medium shadow hover:bg-black/90 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
