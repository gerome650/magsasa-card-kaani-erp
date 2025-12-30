import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hashFarmerId, getCorrelationId, logEvent } from "./logging";

describe("loanSuggestion logging", () => {
  const originalEnv = process.env;
  const originalConsoleInfo = console.info;
  let consoleInfoSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset env
    process.env = { ...originalEnv };
    // Mock console.info to capture logs
    consoleInfoSpy = vi.fn();
    console.info = consoleInfoSpy;
  });

  afterEach(() => {
    process.env = originalEnv;
    console.info = originalConsoleInfo;
  });

  describe("hashFarmerId", () => {
    it("returns 'unknown' when farmerId is null", () => {
      expect(hashFarmerId(null)).toBe("unknown");
    });

    it("returns 'unknown' when farmerId is undefined", () => {
      expect(hashFarmerId(undefined)).toBe("unknown");
    });

    it("returns 'unknown' when LOG_HASH_SALT is not set", () => {
      delete process.env.LOG_HASH_SALT;
      expect(hashFarmerId("test-farmer-id")).toBe("unknown");
    });

    it("returns hashed value when farmerId and salt are provided", () => {
      process.env.LOG_HASH_SALT = "test-salt";
      const hash = hashFarmerId("test-farmer-id");
      expect(hash).not.toBe("unknown");
      expect(hash).toMatch(/^[a-f0-9]{16}$/); // Should be 16 hex characters
    });

    it("returns same hash for same input", () => {
      process.env.LOG_HASH_SALT = "test-salt";
      const hash1 = hashFarmerId("test-farmer-id");
      const hash2 = hashFarmerId("test-farmer-id");
      expect(hash1).toBe(hash2);
    });

    it("returns different hash for different inputs", () => {
      process.env.LOG_HASH_SALT = "test-salt";
      const hash1 = hashFarmerId("farmer-1");
      const hash2 = hashFarmerId("farmer-2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("getCorrelationId", () => {
    it("generates a correlation ID when no request is provided", () => {
      const id = getCorrelationId();
      expect(id).toMatch(/^[a-f0-9]{16}$/); // Should be 16 hex characters
    });

    it("extracts x-request-id from request headers", () => {
      const req = {
        headers: {
          "x-request-id": "test-request-id-123",
        },
      };
      const id = getCorrelationId(req as any);
      expect(id).toBe("test-request-id-123");
    });

    it("extracts x-correlation-id from request headers", () => {
      const req = {
        headers: {
          "x-correlation-id": "test-correlation-id-456",
        },
      };
      const id = getCorrelationId(req as any);
      expect(id).toBe("test-correlation-id-456");
    });

    it("generates ID when header is array", () => {
      const req = {
        headers: {
          "x-request-id": ["value1", "value2"],
        },
      };
      const id = getCorrelationId(req as any);
      expect(id).toMatch(/^[a-f0-9]{16}$/); // Should generate, not use array
    });
  });

  describe("logEvent", () => {
    it("logs structured JSON event", () => {
      logEvent("test.event", { foo: "bar", count: 42 });
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleInfoSpy.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.event).toBe("test.event");
      expect(parsed.foo).toBe("bar");
      expect(parsed.count).toBe(42);
      expect(parsed.timestamp).toBeDefined();
    });

    it("handles logging errors gracefully", () => {
      // Mock JSON.stringify to throw
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn(() => {
        throw new Error("Serialization error");
      });

      // Should not throw
      expect(() => {
        logEvent("test.event", {});
      }).not.toThrow();

      // Restore
      JSON.stringify = originalStringify;
    });
  });
});

