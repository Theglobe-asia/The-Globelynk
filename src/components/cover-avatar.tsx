"use client";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

export default function CoverAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("elxir.cover");
    if (saved) setSrc(saved);
  }, []);

  function pick() {
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setSrc(data);
      localStorage.setItem("elxir.cover", data);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32">
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-black/10 bg-muted flex items-center justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-muted-foreground">Add cover</div>
        )}
      </div>

      <button
        onClick={pick}
        className="absolute -bottom-2 -right-2 rounded-full bg-black text-white p-2 shadow hover:bg-black/90"
        aria-label="Change cover"
      >
        <Camera className="w-4 h-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
