import languine from "@packages/i18n/languine.json";

export const siteName = "Opentribe";
export const author = { name: "Opentribe", url: "https://opentribe.io" };
export const publisher = "Opentribe";
export const twitterHandle = "@opentribe_io";
export const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || undefined;

export const defaultDescription =
  "Opentribe is a talent marketplace connecting builders with grants, bounties, and RFPs across the Polkadot ecosystem. Discover opportunities, build your profile, and get recognized.";

export const defaultKeywords: string[] = [
  "polkadot",
  "grants",
  "bounties",
  "rfps",
  "web3 jobs",
  "open source",
  "dot",
  "kusama",
  "parachains",
  "developer opportunities",
  "talent marketplace",
];

export function getSiteUrl(): URL {
  const fromPublic = process.env.NEXT_PUBLIC_WEB_URL;
  if (fromPublic && fromPublic.length > 0) {
    return new URL(fromPublic);
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel && vercel.length > 0) {
    return new URL(`https://${vercel}`);
  }
  return new URL("http://localhost:3000");
}

export const locales: string[] = [
  languine.locale.source,
  ...languine.locale.targets,
];
