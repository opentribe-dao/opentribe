import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export type OgAssets = {
  chakra700: Buffer;
  chakra500: Buffer;
  satoshi400: Buffer;
  satoshi500: Buffer;
  satoshi700: Buffer;
  background?: Buffer | null;
  builderIllustration?: Buffer | null;
  organizationIllustration?: Buffer | null;
};

/**
 * Loads OG fonts and images from the web app's api/og directory.
 * Assets are co-located in /api/og/ for reliable bundling in Vercel.
 * Works from any nested route by navigating up to the og directory.
 */
export async function loadOgAssets(routeFileUrl: string): Promise<OgAssets> {
  const routeDir = path.dirname(fileURLToPath(routeFileUrl));

  // Find the 'og' directory by checking if fonts exist in current dir or parent dirs
  let ogDir = routeDir;
  while (!ogDir.endsWith('/og') && !ogDir.endsWith('/og/')) {
    const parentDir = path.dirname(ogDir);
    if (parentDir === ogDir) break; // reached root
    ogDir = parentDir;
  }

  const read = (rel: string) => fs.readFile(path.join(ogDir, rel));

  const chakra700 = read("./fonts/ChakraPetch-Bold.ttf");
  const chakra500 = read("./fonts/ChakraPetch-Medium.ttf");
  const satoshi400 = read("./fonts/Satoshi-Regular.otf");
  const satoshi500 = read("./fonts/Satoshi-Medium.otf");
  const satoshi700 = read("./fonts/Satoshi-Bold.otf");
  const bg = read("./assets/og-background.png").catch(() => null);
  const builder = read("./assets/builder-illustration.png").catch(() => null);
  const organization = read("./assets/organization-illustration.png").catch(() => null);

  const [c700, c500, s400, s500, s700, bgBuf, builderBuf, orgBuf] = await Promise.all([
    chakra700,
    chakra500,
    satoshi400,
    satoshi500,
    satoshi700,
    bg,
    builder,
    organization,
  ]);

  return {
    chakra700: c700,
    chakra500: c500,
    satoshi400: s400,
    satoshi500: s500,
    satoshi700: s700,
    background: bgBuf,
    builderIllustration: builderBuf,
    organizationIllustration: orgBuf,
  };
}
