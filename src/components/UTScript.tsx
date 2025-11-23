"use client";

import Script from "next/script";

export default function UTScript() {
  return (
    <Script
      src="https://uploadthing.com/client/script"
      strategy="afterInteractive"
    />
  );
}
