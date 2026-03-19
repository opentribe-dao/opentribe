export const assertSeedEnvironment = (
  env: NodeJS.ProcessEnv,
  scriptName: string
) => {
  if (env.NODE_ENV === "production") {
    throw new Error(`${scriptName} cannot run in production`);
  }
};

export const getSeedPasswords = (env: NodeJS.ProcessEnv = process.env) => {
  const defaultSeedPassword = env.SEED_DEFAULT_PASSWORD || "password123";

  return {
    defaultSeedPassword,
    superadminSeedPassword: env.SEED_SUPERADMIN_PASSWORD || "admin123",
  };
};
