// src/app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core"; // <-- CORRECT router

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
