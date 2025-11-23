"use client";

import { useEffect, useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { Camera } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function CoverAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cover")
      .then((r) => r.json())
      .then((j) => j?.coverUrl && setSrc(j.coverUrl))
      .catch(() => {});
  }, []);

  async function saveCoverUrl(url: string) {
    await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverUrl: url }),
    });
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

      {/* REAL UploadThing button */}
      <UploadButton<OurFileRouter, "coverUploader">
        endpoint="coverUploader"
        onUploadBegin={() => setLoading(true)}
        onClientUploadComplete={async (res) => {
          const url = res?.[0]?.url;
          if (url) {
            setSrc(url);
            await saveCoverUrl(url);
          }
          setLoading(false);
        }}
        onUploadError={() => setLoading(false)}
        appearance={{
          container: "absolute -bottom-2 -right-2",
          button: "rounded-full bg-black p-2 text-white hover:bg-black/80",
          allowedContent: "hidden",
        }}
      >
        <Camera className="w-4 h-4" />
      </UploadButton>
    </div>
  );
}
