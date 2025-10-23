import fs from "node:fs/promises";

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
  const chakra700 = fs.readFile(
    new URL("../base/fonts/ChakraPetch-Bold.ttf", import.meta.url)
  );
  const chakra500 = fs.readFile(
    new URL("../base/fonts/ChakraPetch-Medium.ttf", import.meta.url)
  );
  const satoshi400 = fs.readFile(
    new URL("../base/fonts/Satoshi-Regular.otf", import.meta.url)
  );
  const satoshi500 = fs.readFile(
    new URL("../base/fonts/Satoshi-Medium.otf", import.meta.url)
  );
  const satoshi700 = fs.readFile(
    new URL("../base/fonts/Satoshi-Bold.otf", import.meta.url)
  );
  const bg = fs
    .readFile(new URL("./assets/og-background.png", import.meta.url))
    .catch(() => null);
  const builder = fs
    .readFile(new URL("./assets/builder-illustration.png", import.meta.url))
    .catch(() => null);

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
