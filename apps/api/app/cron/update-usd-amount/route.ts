import { database } from "@packages/db";
import { exchangeRateService } from "@packages/polkadot/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// GET /cron/update-usd-amount - Update USD amounts for bounties and grants based on current exchange rates
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    console.log(
      "Running USD amount update cron job",
      refresh ? "(force refresh)" : ""
    );

    // Clear cache if refresh is requested
    if (refresh) {
      await exchangeRateService.clearCache();
      console.log("Cache cleared due to refresh parameter");
    }

    // Query all unique tokens from bounties and grants
    const [bountyTokens, grantTokens] = await Promise.all([
      database.bounty.findMany({
        select: { token: true },
        where: {
          amount: { not: null },
        },
        distinct: ["token"],
      }),
      database.grant.findMany({
        select: { token: true },
        where: {
          OR: [
            { totalFunds: { not: null } },
            { minAmount: { not: null } },
            { maxAmount: { not: null } },
          ],
        },
        distinct: ["token"],
      }),
    ]);

    // Combine and deduplicate tokens, filtering out null values
    const allTokens = Array.from(
      new Set([
        ...bountyTokens
          .map((b) => b.token)
          .filter(
            (token): token is string => token !== null && token !== undefined
          ),
        ...grantTokens
          .map((g) => g.token)
          .filter(
            (token): token is string => token !== null && token !== undefined
          ),
      ])
    );

    if (allTokens.length === 0) {
      console.log("No tokens found to update");
      return NextResponse.json({
        success: true,
        message: "No tokens found to update",
        updatedBounties: 0,
        updatedGrants: 0,
        totalCount: 0,
      });
    }

    console.log(
      `Found ${allTokens.length} unique tokens: ${allTokens.join(", ")}`
    );

    // Create a mapping from original token case to uppercase for API calls
    const tokenMapping = new Map<string, string>();
    for (const token of allTokens) {
      tokenMapping.set(token.toUpperCase(), token);
    }

    console.log("Token mapping (API -> DB):", Object.fromEntries(tokenMapping));

    // Fetch exchange rates for all tokens (API expects uppercase)
    const exchangeRates = await exchangeRateService.getExchangeRates(allTokens);
    console.log("Exchange rates fetched:", exchangeRates);

    // Update bounties using raw SQL for field multiplication
    let updatedBounties = 0;
    for (const [upperToken, rate] of Object.entries(exchangeRates)) {
      if (rate > 0) {
        const originalToken = tokenMapping.get(upperToken);
        if (originalToken) {
          const result = await database.$executeRaw`
            UPDATE "bounty" 
            SET "amountUSD" = "amount" * ${rate}
            WHERE "token" = ${originalToken} 
            AND "amount" IS NOT NULL
          `;
          updatedBounties += result;
          console.log(
            `Updated ${result} bounties for token ${originalToken} with rate ${rate}`
          );
        }
      }
    }

    // Update grants using raw SQL for field multiplication
    let updatedGrants = 0;
    for (const [upperToken, rate] of Object.entries(exchangeRates)) {
      if (rate > 0) {
        const originalToken = tokenMapping.get(upperToken);
        if (originalToken) {
          const result = await database.$executeRaw`
            UPDATE "grant" 
            SET 
              "totalFundsUSD" = "totalFunds" * ${rate},
              "minAmountUSD" = "minAmount" * ${rate},
              "maxAmountUSD" = "maxAmount" * ${rate}
            WHERE "token" = ${originalToken} 
            AND ("totalFunds" IS NOT NULL OR "minAmount" IS NOT NULL OR "maxAmount" IS NOT NULL)
          `;
          updatedGrants += result;
          console.log(
            `Updated ${result} grants for token ${originalToken} with rate ${rate}`
          );
        }
      }
    }

    const totalUpdated = updatedBounties + updatedGrants;

    console.log(
      `Successfully updated ${totalUpdated} records (${updatedBounties} bounties, ${updatedGrants} grants)`
    );

    // Convert tokenMapping to object for response
    const tokenMappingObj: Record<string, string> = {};
    for (const [upper, original] of tokenMapping.entries()) {
      tokenMappingObj[upper] = original;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated USD amounts for ${totalUpdated} records`,
      updatedBounties,
      updatedGrants,
      totalCount: totalUpdated,
      exchangeRates,
      tokensProcessed: allTokens,
      tokenMapping: tokenMappingObj,
    });
  } catch (error) {
    console.error("Error in USD amount update cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update USD amounts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
