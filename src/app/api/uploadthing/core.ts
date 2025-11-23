// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  coverUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    // ❌ NO AUTH, NO SESSION, NO MIDDLEWARE
    .onUploadComplete(async ({ file }) => {
      console.log("UPLOAD COMPLETE", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
