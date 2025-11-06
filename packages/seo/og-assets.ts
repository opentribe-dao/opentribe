import fs from "node:fs/promises";
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
 * Loads shared OG fonts and background image from the seo package at runtime.
 * Uses process.cwd() for reliable path resolution in both dev and production.
 */
export async function loadOgAssets(): Promise<OgAssets> {
  const read = (rel: string) =>
    fs.readFile(path.join(process.cwd(), rel));

  const chakra700 = read("../../packages/base/fonts/ChakraPetch-Bold.ttf");
  const chakra500 = read("../../packages/base/fonts/ChakraPetch-Medium.ttf");
  const satoshi400 = read("../../packages/base/fonts/Satoshi-Regular.otf");
  const satoshi500 = read("../../packages/base/fonts/Satoshi-Medium.otf");
  const satoshi700 = read("../../packages/base/fonts/Satoshi-Bold.otf");
  const bg = read("../../packages/seo/assets/og-background.png").catch(() => null);
  const builder = read("../../packages/seo/assets/builder-illustration.png").catch(() => null);
  const organization = read("../../packages/seo/assets/organization-illustration.png").catch(() => null);

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
