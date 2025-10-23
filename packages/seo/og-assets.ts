import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type OgAssets = {
  chakra700: Buffer;
  chakra500: Buffer;
  satoshi400: Buffer;
  satoshi500: Buffer;
  satoshi700: Buffer;
  background?: Buffer | null;
  builderIllustration?: Buffer | null;
};

/**
 * Loads shared OG fonts and background image from the seo package at runtime.
 * Uses file URLs relative to this module so bundlers don't attempt to parse binary files.
 */
export async function loadOgAssets(): Promise<OgAssets> {
  const read = (rel: string) =>
    fs.readFile(fileURLToPath(new URL(rel, import.meta.url)));

  const chakra700 = read("../base/fonts/ChakraPetch-Bold.ttf");
  const chakra500 = read("../base/fonts/ChakraPetch-Medium.ttf");
  const satoshi400 = read("../base/fonts/Satoshi-Regular.otf");
  const satoshi500 = read("../base/fonts/Satoshi-Medium.otf");
  const satoshi700 = read("../base/fonts/Satoshi-Bold.otf");
  const bg = read("./assets/og-background.png").catch(() => null);
  const builder = read("./assets/builder-illustration.png").catch(() => null);

  const [c700, c500, s400, s500, s700, bgBuf, builderBuf] = await Promise.all([
    chakra700,
    chakra500,
    satoshi400,
    satoshi500,
    satoshi700,
    bg,
    builder,
  ]);

  return {
    chakra700: c700,
    chakra500: c500,
    satoshi400: s400,
    satoshi500: s500,
    satoshi700: s700,
    background: bgBuf,
    builderIllustration: builderBuf,
  };
}
