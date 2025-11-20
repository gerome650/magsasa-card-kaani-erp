import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// Plugin to conditionally inject analytics script
// Runs early to prevent Vite from processing undefined env var placeholders
// Analytics is completely disabled in development mode
function conditionalAnalyticsPlugin(): Plugin {
  return {
    name: "conditional-analytics",
    enforce: "pre", // Run before other plugins to handle placeholders early
    transformIndexHtml(html, ctx) {
      // Skip analytics entirely in development mode
      const isDevelopment = 
        process.env.NODE_ENV === "development" || 
        ctx.server?.config?.mode === "development" ||
        process.env.NODE_ENV !== "production";
      
      if (isDevelopment) {
        // Remove any existing analytics script tags or placeholders
        html = html.replace(
          /<script[^>]*%VITE_ANALYTICS_ENDPOINT%[^>]*><\/script>/gi,
          ""
        );
        html = html.replace(
          /%VITE_ANALYTICS_ENDPOINT%/g,
          ""
        );
        html = html.replace(
          /%VITE_ANALYTICS_WEBSITE_ID%/g,
          ""
        );
        // Remove the comment marker
        return html.replace(
          /<!-- Analytics script will be conditionally injected by Vite if env vars are defined -->\s*/g,
          ""
        );
      }
      
      // For production builds, check env vars
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT;
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
      
      // Remove any existing analytics script tags or placeholders first
      // This prevents malformed URLs if placeholders weren't replaced
      html = html.replace(
        /<script[^>]*%VITE_ANALYTICS_ENDPOINT%[^>]*><\/script>/gi,
        ""
      );
      html = html.replace(
        /%VITE_ANALYTICS_ENDPOINT%/g,
        ""
      );
      html = html.replace(
        /%VITE_ANALYTICS_WEBSITE_ID%/g,
        ""
      );
      
      // Only inject analytics if both vars are defined and non-empty (production only)
      if (analyticsEndpoint?.trim() && analyticsWebsiteId?.trim()) {
        const analyticsScript = `\n    <script
      defer
      src="${analyticsEndpoint.trim()}/umami"
      data-website-id="${analyticsWebsiteId.trim()}"></script>`;
        return html.replace(
          `<!-- Analytics script will be conditionally injected by Vite if env vars are defined -->`,
          analyticsScript
        );
      } else {
        // Remove the comment if analytics is not configured
        return html.replace(
          /<!-- Analytics script will be conditionally injected by Vite if env vars are defined -->\s*/g,
          ""
        );
      }
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), conditionalAnalyticsPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
