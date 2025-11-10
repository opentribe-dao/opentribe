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
  logomark?: Buffer | null;
};

/**
 * Loads OG fonts and images from the public directory.
 * Assets in public/ are included in Vercel's build output.
 */
export async function loadOgAssets(): Promise<OgAssets> {
  const publicDir = path.join(process.cwd(), "public");
  const read = (rel: string) => fs.readFile(path.join(publicDir, rel));

  const chakra700 = read("og-fonts/ChakraPetch-Bold.ttf");
  const chakra500 = read("og-fonts/ChakraPetch-Medium.ttf");
  const satoshi400 = read("og-fonts/Satoshi-Regular.otf");
  const satoshi500 = read("og-fonts/Satoshi-Medium.otf");
  const satoshi700 = read("og-fonts/Satoshi-Bold.otf");
  const bg = read("og-assets/og-background.png").catch(() => null);
  const builder = read("og-assets/builder-illustration.png").catch(() => null);
  const organization = read("og-assets/organization-illustration.png").catch(
    () => null
  );
  const logomark = read("og-assets/logomark.svg").catch(() => null);

  const [c700, c500, s400, s500, s700, bgBuf, builderBuf, orgBuf, logomarkBuf] =
    await Promise.all([
      chakra700,
      chakra500,
      satoshi400,
      satoshi500,
      satoshi700,
      bg,
      builder,
      organization,
      logomark,
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
    logomark: logomarkBuf,
  };
}
