import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";

// Better compatibility for bundled code
// When bundled with esbuild, we use process.cwd() + dirname fallback
let __dirname: string;
try {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch {
  // Fallback for bundled code where import.meta.url might not work as expected
  __dirname = process.cwd();
}

export async function serveStatic(app: Express, _server: Server) {
  console.log("[prod] Starting production server setup...");
  console.log(`[prod] Current working directory: ${process.cwd()}`);
  console.log(`[prod] __dirname resolved to: ${__dirname}`);
  
  // Try multiple possible paths for the dist directory
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(__dirname, "../public"),
  ];

  let distPath: string | null = null;
  
  console.log("[prod] Checking for build directory in the following locations:");
  for (const possiblePath of possiblePaths) {
    console.log(`[prod]   - ${possiblePath} ... ${fs.existsSync(possiblePath) ? 'FOUND' : 'not found'}`);
    if (!distPath && fs.existsSync(possiblePath)) {
      distPath = possiblePath;
    }
  }

  if (!distPath) {
    console.error(`[prod] ERROR: Build directory not found in any of the checked locations`);
    console.error(`[prod] Please ensure 'npm run build' has been executed successfully`);
    throw new Error(
      `Could not find the build directory. Checked locations: ${possiblePaths.join(', ')}`,
    );
  }

  console.log(`[prod] Using build directory: ${distPath}`);
  
  // Verify index.html exists
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`[prod] ERROR: index.html not found at ${indexPath}`);
    throw new Error(`Build directory found but index.html is missing at ${indexPath}`);
  }
  
  console.log(`[prod] index.html found at: ${indexPath}`);
  console.log("[prod] Setting up static file serving...");

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all routes
  app.use("*", (_req, res) => {
    res.sendFile(indexPath);
  });

  console.log("[prod] Static file serving configured successfully");
}

(async () => {
  try {
    console.log("=".repeat(60));
    console.log("[prod] Production Server Initialization");
    console.log("=".repeat(60));
    console.log(`[prod] Node version: ${process.version}`);
    console.log(`[prod] Platform: ${process.platform}`);
    console.log(`[prod] PORT: ${process.env.PORT || '5000'}`);
    console.log(`[prod] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log("=".repeat(60));
    
    await runApp(serveStatic);
    
    console.log("=".repeat(60));
    console.log("[prod] ✓ Production application started successfully");
    console.log("[prod] ✓ Server listening on 0.0.0.0:5000");
    console.log("[prod] ✓ Health check available at: http://0.0.0.0:5000/health");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("=".repeat(60));
    console.error("[prod] ✗ FATAL ERROR: Failed to start production application");
    console.error("=".repeat(60));
    
    if (error instanceof Error) {
      console.error(`[prod] Error name: ${error.name}`);
      console.error(`[prod] Error message: ${error.message}`);
      console.error(`[prod] Stack trace:`);
      console.error(error.stack);
    } else {
      console.error(`[prod] Unknown error:`, error);
    }
    
    console.error("=".repeat(60));
    console.error("[prod] Exiting with code 1");
    process.exit(1);
  }
})();
