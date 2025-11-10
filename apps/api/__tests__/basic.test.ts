import { describe, expect, test } from "vitest";

describe("Basic Tests", () => {
  test("should run basic math", () => {
    expect(1 + 1).toBe(2);
  });

  test("should handle strings", () => {
    const str = "Opentribe";
    expect(str).toBe("Opentribe");
    expect(str.length).toBe(9);
  });

  test("should handle arrays", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test("should handle objects", () => {
    const obj = { name: "Test", value: 42 };
    expect(obj.name).toBe("Test");
    expect(obj.value).toBe(42);
  });

  test("should handle async operations", async () => {
    const promise = Promise.resolve("success");
    await expect(promise).resolves.toBe("success");
  });
});
