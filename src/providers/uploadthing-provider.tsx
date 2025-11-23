"use client";

import { UploadThingProvider } from "@uploadthing/react";

export function UTProvider({ children }: { children: React.ReactNode }) {
  return <UploadThingProvider>{children}</UploadThingProvider>;
}
