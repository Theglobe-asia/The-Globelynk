import Protected from "@/components/protected";
import Navbar from "@/components/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </Protected>
  );
}
