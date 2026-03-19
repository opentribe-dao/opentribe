export const assertSeedEnvironment = (
  env: NodeJS.ProcessEnv = process.env,
  scriptName: string
) => {
  if (env.NODE_ENV === "production") {
    throw new Error(`${scriptName} cannot run in production`);
  }
};

export const getSeedPasswords = (env: NodeJS.ProcessEnv = process.env) => {
  const defaultSeedPassword = env.SEED_DEFAULT_PASSWORD;

  if (!defaultSeedPassword) {
    throw new Error("SEED_DEFAULT_PASSWORD must be set for seed-auth.ts");
  }

  return {
    defaultSeedPassword,
    superadminSeedPassword:
      env.SEED_SUPERADMIN_PASSWORD || defaultSeedPassword,
  };
};
