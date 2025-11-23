// src/components/cover-avatar.tsx
"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const ADMIN_PASS = "CAlex"; // <- CHANGE THIS IF YOU WANT

export default function CoverAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [pwd, setPwd] = useState("");

  // Load saved cover URL
  useEffect(() => {
    fetch("/api/cover")
      .then((r) => r.json())
      .then((j) => j?.coverUrl && setSrc(j.coverUrl))
      .catch(() => {});
  }, []);

  function checkPassword() {
    if (pwd === ADMIN_PASS) {
      setAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  }

  async function saveCoverUrl(url: string) {
    await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverUrl: url }),
    });
  }

  return (
    <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32">
      {/* Avatar display */}
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-black/10 bg-muted flex items-center justify-center">
        {src ? (
          <img src={src} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-muted-foreground">
            {loading ? "Uploading..." : "Add cover"}
          </div>
        )}
      </div>

      {/* Password gate */}
      {!authorized && (
        <div className="absolute -bottom-14 left-0 w-full flex flex-col gap-2">
          <input
            type="password"
            className="border px-2 py-1 rounded text-sm w-full"
            placeholder="Admin password..."
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <button
            onClick={checkPassword}
            className="bg-black text-white p-1 rounded text-sm"
          >
            Unlock
          </button>
        </div>
      )}

      {/* Upload button (visible only after password is correct) */}
      {authorized && (
        <div className="absolute -bottom-2 -right-2">
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
            onUploadError={(err) => {
              console.error(err);
              setLoading(false);
            }}
            appearance={{
              container: "w-8 h-8",
              button:
                "w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-60",
            }}
            content={{
              button: <Camera className="w-4 h-4" />,
            }}
          />
        </div>
      )}
    </div>
  );
}
