import { describe, expect, test } from "vitest";
import { assertSeedEnvironment, getSeedPasswords } from "../seed-config";

describe("seed-config", () => {
  test("blocks seed scripts in production", () => {
    expect(() =>
      assertSeedEnvironment({ NODE_ENV: "production" } as NodeJS.ProcessEnv, "seed-auth.ts")
    ).toThrow("seed-auth.ts cannot run in production");
  });

  test("allows seed scripts outside production", () => {
    expect(() =>
      assertSeedEnvironment({ NODE_ENV: "development" } as NodeJS.ProcessEnv, "seed-auth.ts")
    ).not.toThrow();
  });

  test("requires an explicit default seed password", () => {
    expect(() => getSeedPasswords({} as NodeJS.ProcessEnv)).toThrow(
      "SEED_DEFAULT_PASSWORD must be set for seed-auth.ts"
    );
  });

  test("reuses the default seed password for the superadmin when unset", () => {
    expect(
      getSeedPasswords({
        SEED_DEFAULT_PASSWORD: "local-pass",
      } as NodeJS.ProcessEnv)
    ).toEqual({
      defaultSeedPassword: "local-pass",
      superadminSeedPassword: "local-pass",
    });
  });

  test("supports an explicit superadmin password override", () => {
    expect(
      getSeedPasswords({
        SEED_DEFAULT_PASSWORD: "local-pass",
        SEED_SUPERADMIN_PASSWORD: "super-pass",
      } as NodeJS.ProcessEnv)
    ).toEqual({
      defaultSeedPassword: "local-pass",
      superadminSeedPassword: "super-pass",
    });
  });
});
