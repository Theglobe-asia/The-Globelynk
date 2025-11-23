// src/components/cover-avatar.tsx
"use client";

export default function CoverAvatar() {
  const src = "/cover.png"; // permanent static image

  return (
    <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32">
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-black/10 bg-muted flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Cover" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
