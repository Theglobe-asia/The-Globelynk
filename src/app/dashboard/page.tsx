"use client";
import FeatureCube from "@/components/three-cube";
import BackToHome from "@/components/back-to-home"; // optional, can remove if not needed

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-semibold mb-6">Dashboard</h1>
      <FeatureCube />
    </div>
  );
}
