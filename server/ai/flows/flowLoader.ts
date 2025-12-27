import { readFileSync } from "fs";
import { join } from "path";
import { FlowPackageSchema, FlowPackageType } from "./flowSchema";
import { KaAniAudience } from "./types";

// Cache for loaded flow packages: key = `${audience}:${flowId}`
const flowCache = new Map<string, FlowPackageType>();

/**
 * Load a flow package from disk and validate it.
 * Returns null if file doesn't exist or validation fails (graceful fallback).
 */
export function loadFlowPackage(
  audience: KaAniAudience,
  flowId: string = 'default'
): FlowPackageType | null {
  const cacheKey = `${audience}:${flowId}`;
  
  // Check cache first
  if (flowCache.has(cacheKey)) {
    return flowCache.get(cacheKey)!;
  }

  try {
    // Load JSON file from client/src/features/kaani/flows/v1/
    // Note: In production, this should be copied to a server-accessible location
    // For now, we'll read from the client folder (works in dev)
    const flowPath = join(
      process.cwd(),
      'client',
      'src',
      'features',
      'kaani',
      'flows',
      'v1',
      `${audience}.${flowId}.flow.json`
    );

    const fileContent = readFileSync(flowPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Validate with Zod
    const validated = FlowPackageSchema.parse(jsonData);

    // Cache it
    flowCache.set(cacheKey, validated);

    return validated;
  } catch (error) {
    // File not found or validation error - return null for graceful fallback
    console.warn(`[FlowLoader] Failed to load flow package ${audience}.${flowId}:`, error instanceof Error ? error.message : 'unknown error');
    return null;
  }
}

/**
 * Clear the flow cache (useful for testing or hot reload).
 */
export function clearFlowCache(): void {
  flowCache.clear();
}



