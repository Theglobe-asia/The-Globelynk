"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ThreeCube() {
  const faces = [
    { label: "Send Email", href: "/send" },
    { label: "Create Data", href: "/create" },
    { label: "Customize", href: "/customize" },
    { label: "Report", href: "/report" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(()=>setI(v=>(v+1)%4), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-full grid place-items-center py-16">
      <div className="relative h-64 w-64 [transform-style:preserve-3d] animate-[spinY_14s_linear_infinite]">
        {faces.map((f, idx) => (
          <Link
            key={idx}
            href={f.href}
            className="absolute inset-0 grid place-items-center card [backface-visibility:hidden]"
            style={{
              transform:
                idx===0 ? "translateZ(130px)" :
                idx===1 ? "rotateY(90deg) translateZ(130px)" :
                idx===2 ? "rotateY(180deg) translateZ(130px)" :
                          "rotateY(-90deg) translateZ(130px)",
            }}>
            <button className="btn-gold text-lg px-6 py-3">{f.label}</button>
          </Link>
        ))}
      </div>
      <style jsx global>{`
        @keyframes spinY { to { transform: rotateY(360deg); } }
      `}</style>
    </div>
  );
}
