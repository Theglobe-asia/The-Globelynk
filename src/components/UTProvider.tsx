"use client";

import { UploadThingClient } from "@uploadthing/react";

export function UTProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script src="https://uploadthing.com/client/script"></script>
      <UploadThingClient />
      {children}
    </>
  );
}
