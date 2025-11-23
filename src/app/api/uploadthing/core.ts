import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

/**
 * Password required to perform uploads
 * You can later move this to an environment variable if you want.
 */
const ADMIN_PASSWORD = "CAlex";

export const ourFileRouter = {
  coverUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const pwd = req.headers.get("x-upload-password");

      if (pwd !== ADMIN_PASSWORD) {
        throw new Error("Unauthorized");
      }

      return { allowed: true };
    })
    .onUploadComplete(({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
