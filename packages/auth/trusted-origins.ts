const localhostOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

const deployedOrigins = [
  "https://opentribe.io",
  "https://api.opentribe.io",
  "https://dashboard.opentribe.io",
  "https://dev.opentribe.io",
  "https://api.dev.opentribe.io",
  "https://dashboard.dev.opentribe.io",
];

export const shouldIncludeLocalhostOrigins = (
  env: NodeJS.ProcessEnv = process.env
) => {
  if (env.VERCEL_TARGET_ENV) {
    return env.VERCEL_TARGET_ENV !== "production";
  }

  return true;
};

export const getTrustedOrigins = (env: NodeJS.ProcessEnv = process.env) => [
  ...(shouldIncludeLocalhostOrigins(env) ? localhostOrigins : []),
  ...deployedOrigins,
];

export const trustedOrigins = getTrustedOrigins();
