import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // Don't fail if .env is missing - tests should mock dependencies anyway
    env: {
      NODE_ENV: "test",
    },
  },
  // Prevent vite from trying to load .env during test runs
  envPrefix: [],
});
