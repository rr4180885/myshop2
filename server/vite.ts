import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Express) {
  // Only run in development
  if (process.env.NODE_ENV === "production") return;

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { path: "/vite-hmr" }, watch: {} },
    appType: "custom",
    customLogger: viteLogger,
  });

  // Use Vite as middleware
  app.use(vite.middlewares);

  // Catch-all for SPA
  app.use("*", async (req, res, next) => {
    try {
      const indexPath = path.resolve(process.cwd(), "client", "index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}
