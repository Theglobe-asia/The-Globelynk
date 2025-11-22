// src/components/cover-avatar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { ourFileRouter } from "@/lib/uploadthing"; // ✅ import the router value

export default function CoverAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const uploadBtnRef = useRef<HTMLDivElement>(null);

  // Load cover from DB (works across devices)
  useEffect(() => {
    fetch("/api/cover")
      .then((r) => r.json())
      .then((j) => {
        if (j?.coverUrl) setSrc(j.coverUrl);
      })
      .catch(() => {});
  }, []);

  async function saveCoverUrl(url: string) {
    await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverUrl: url }),
    });
  }

  function openPicker() {
    uploadBtnRef.current?.querySelector("button")?.click();
  }

  return (
    <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32">
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-black/10 bg-muted flex items-center justify-center">
        {src ? (
          <img src={src} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-muted-foreground">
            {loading ? "Uploading..." : "Add cover"}
          </div>
        )}
      </div>

      <button
        onClick={openPicker}
        className="absolute -bottom-2 -right-2 rounded-full bg-black text-white p-2 shadow hover:bg-black/90"
        aria-label="Change cover"
        disabled={loading}
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* Hidden UploadThing control */}
      <div ref={uploadBtnRef} className="hidden">
        <UploadButton<typeof ourFileRouter>
          endpoint="coverImage"
          onUploadBegin={() => setLoading(true)}
          onClientUploadComplete={async (res) => {
            const url = res?.[0]?.url;
            if (!url) {
              setLoading(false);
              return;
            }
            setSrc(url);
            await saveCoverUrl(url);
            setLoading(false);
          }}
          onUploadError={(err) => {
            console.error(err);
            setLoading(false);
          }}
        />
      </div>
    </div>
  );
}
