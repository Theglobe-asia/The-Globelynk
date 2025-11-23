"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function CoverAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);

  // Load saved cover URL from DB
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
    hiddenRef.current?.querySelector("button")?.click();
  }

  return (
    <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32">
      {/* Avatar */}
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-black/10 bg-muted flex items-center justify-center">
        {src ? (
          <img src={src} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-muted-foreground">
            {loading ? "Uploading..." : "Add cover"}
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={openPicker}
        disabled={loading}
        aria-label="Change cover"
        className="absolute -bottom-2 -right-2 rounded-full bg-black text-white p-2 shadow hover:bg-black/90"
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* Hidden UploadThing trigger */}
      <div ref={hiddenRef} className="hidden">
        <UploadButton<OurFileRouter, "coverUploader">
          endpoint="coverUploader"
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
          onUploadError={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
