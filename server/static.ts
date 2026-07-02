import { type Express } from "express";
import express from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  const distPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!distPath) {
    console.warn(`Build directory not found. Tried: ${candidates.join(", ")}`);
    return;
  }

  // Serve static assets (js, css, images, etc.)
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    const indexFile = path.join(distPath, "index.html");
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send("Not Found");
    }
  });
}
