import { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // In production, Vercel serves files from /dist/public automatically.
  // Optional fallback if you want the Express app to handle SPA routing.
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}. Skipping static serving.`);
    return;
  }

  // Serve static assets
  app.use("/", (_req, res, next) => {
    const indexFile = path.join(distPath, "index.html");
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      next();
    }
  });
}
