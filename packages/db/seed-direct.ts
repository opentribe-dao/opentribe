import { skillsOptions } from "@packages/base";
import { database as prisma } from "./index";
import { assertSeedEnvironment } from "./seed-config";

// Helper function to get random skills
function getRandomSkills(count = 7) {
  const allSkills = skillsOptions.flatMap((category) =>
    category.options.map((skill) => skill.value)
  );
  const shuffled = [...allSkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  assertSeedEnvironment(process.env, "seed-direct.ts");

  console.log("🌱 Starting direct database seed...");

  // Clean existing data
  await prisma.$transaction([
    prisma.submission.deleteMany(),
    prisma.grantApplication.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.vote.deleteMany(),
    prisma.rFP.deleteMany(),
    prisma.bounty.deleteMany(),
    prisma.grant.deleteMany(),
    prisma.curator.deleteMany(),
    prisma.notificationSetting.deleteMany(),
    prisma.member.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("✅ Cleaned existing data");

  // Create users directly
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice.rust@example.com",
        name: "Alice Chen",
        username: "alice_substrate",
        role: "user",
        emailVerified: true,
        headline: "Substrate Runtime Developer",
        bio: "Building the future of Web3 with Rust and Substrate.",
        skills: getRandomSkills(8),
        interests: ["DeFi", "Governance", "Cross-chain"],
        location: "Berlin, Germany",
        walletAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        github: "alice-substrate",
        twitter: "alice_web3",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "bob.ui@example.com",
        name: "Bob Martinez",
        username: "bob_designer",
        role: "user",
        emailVerified: true,
        headline: "Web3 UI/UX Designer",
        bio: "Crafting beautiful interfaces for dApps.",
        skills: getRandomSkills(9),
        interests: ["NFTs", "Gaming", "Social"],
        location: "San Francisco, USA",
        walletAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        twitter: "bob_designs",
        website: "https://bobmartinez.design",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "carol.writer@example.com",
        name: "Carol Thompson",
        username: "carol_docs",
        role: "user",
        emailVerified: true,
        headline: "Technical Writer",
        bio: "Making complex blockchain concepts accessible.",
        skills: getRandomSkills(7),
        interests: ["Education", "Documentation", "Community"],
        location: "London, UK",
        walletAddress: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL",
        github: "carol-docs",
        linkedin: "carol-thompson",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "david.w3f@example.com",
        name: "David Kim",
        username: "david_w3f",
        role: "admin",
        emailVerified: true,
        headline: "Grant Program Manager at Web3 Foundation",
        bio: "Managing the Web3 Foundation Grants Program.",
        skills: getRandomSkills(6),
        location: "Zug, Switzerland",
        walletAddress: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        twitter: "w3f_grants",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "emma.moonbeam@example.com",
        name: "Emma Wilson",
        username: "emma_moonbeam",
        role: "admin",
        emailVerified: true,
        headline: "Developer Relations at Moonbeam",
        bio: "Building bridges between Ethereum and Polkadot.",
        skills: getRandomSkills(6),
        location: "Miami, USA",
        walletAddress: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
        telegram: "emma_moonbeam",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "frank.acala@example.com",
        name: "Frank Zhang",
        username: "frank_acala",
        role: "admin",
        emailVerified: true,
        headline: "Ecosystem Growth at Acala",
        bio: "Growing the DeFi ecosystem on Polkadot.",
        skills: getRandomSkills(6),
        location: "Singapore",
        walletAddress: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
        twitter: "acala_frank",
        profileCompleted: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "admin@opentribe.io",
        name: "Admin User",
        username: "admin",
        role: "superadmin",
        emailVerified: true,
        headline: "Platform Administrator",
        bio: "Managing the Opentribe platform.",
        skills: getRandomSkills(5),
        profileCompleted: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create organizations
  const now = new Date();
  const daysFromNow = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Web3 Foundation",
        slug: "web3-foundation",
        headline: "Funding the decentralized web",
        description:
          "The Web3 Foundation nurtures and stewards technologies and applications in the fields of decentralized web software protocols.",
        logo: "https://avatars.githubusercontent.com/u/30405397",
        twitter: "web3foundation",
        github: "w3f",
        websiteUrl: "https://web3.foundation",
        location: "Zug, Switzerland",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[3].id,
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "Moonbeam Network",
        slug: "moonbeam",
        headline: "Ethereum-compatible smart contract platform on Polkadot",
        description:
          "Moonbeam is a smart contract platform for building cross-chain connected applications.",
        logo: "https://avatars.githubusercontent.com/u/84856768",
        twitter: "moonbeamnetwork",
        github: "moonbeam-foundation",
        websiteUrl: "https://moonbeam.network",
        location: "Miami, USA",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[4].id,
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "Acala Network",
        slug: "acala",
        headline: "DeFi hub of Polkadot",
        description:
          "Acala is the decentralized finance network and liquidity hub of Polkadot.",
        logo: "https://avatars.githubusercontent.com/u/54881907",
        twitter: "AcalaNetwork",
        github: "acalanetwork",
        websiteUrl: "https://acala.network",
        location: "Singapore",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[5].id,
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "Polkadot Treasury",
        slug: "polkadot-treasury",
        headline: "Decentralized funding for the Polkadot ecosystem",
        description:
          "The Polkadot Treasury funds projects that benefit the ecosystem.",
        logo: "https://avatars.githubusercontent.com/u/14164664",
        twitter: "Polkadot",
        github: "paritytech",
        websiteUrl: "https://polkadot.network",
        location: "Global",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[6].id,
            role: "owner",
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${organizations.length} organizations`);

  // Create bounties
  const bounties = await Promise.all([
    prisma.bounty.create({
      data: {
        title: "Build a Substrate Pallet for Cross-Chain Messaging",
        slug: "build-substrate-pallet-cross-chain-messaging",
        description:
          "Create a Substrate pallet that enables cross-chain message passing between parachains.",
        status: "OPEN",
        visibility: "PUBLISHED",
        amount: 5000,
        token: "DOT",
        amountUSD: 25_000,
        deadline: daysFromNow(30),
        skills: ["Rust", "Substrate", "XCM"],
        organizationId: organizations[0].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[3].id,
          },
        },
      },
    }),
    prisma.bounty.create({
      data: {
        title: "Design a New UI Kit for DeFi Dashboard",
        slug: "design-ui-kit-defi-dashboard",
        description:
          "Create a comprehensive UI kit with components for a DeFi dashboard including charts, tables, and forms.",
        status: "OPEN",
        visibility: "PUBLISHED",
        amount: 3000,
        token: "USDT",
        amountUSD: 3000,
        deadline: daysFromNow(45),
        skills: ["UI/UX", "Figma", "React", "Design Systems"],
        organizationId: organizations[1].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[4].id,
          },
        },
      },
    }),
    prisma.bounty.create({
      data: {
        title: "Write Documentation for EVM Compatibility",
        slug: "write-documentation-evm-compatibility",
        description:
          "Create comprehensive documentation for developers building EVM-compatible applications.",
        status: "OPEN",
        visibility: "PUBLISHED",
        amount: 2000,
        token: "ACA",
        amountUSD: 500,
        deadline: daysFromNow(60),
        skills: ["Technical Writing", "Documentation", "Solidity"],
        organizationId: organizations[2].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[5].id,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${bounties.length} bounties`);

  // Create grants
  const grants = await Promise.all([
    prisma.grant.create({
      data: {
        title: "Web3 Foundation Grants Program",
        slug: "web3-foundation-grants-program",
        description: "Funding for projects building the decentralized web.",
        status: "OPEN",
        visibility: "PUBLISHED",
        totalFunds: 100_000,
        token: "DOT",
        totalFundsUSD: 500_000,
        minAmount: 5000,
        maxAmount: 50_000,
        organizationId: organizations[0].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[3].id,
          },
        },
      },
    }),
    prisma.grant.create({
      data: {
        title: "Moonbeam Accelerator Program",
        slug: "moonbeam-accelerator-program",
        description: "Accelerator program for projects building on Moonbeam.",
        status: "OPEN",
        visibility: "PUBLISHED",
        totalFunds: 50_000,
        token: "GLMR",
        totalFundsUSD: 25_000,
        minAmount: 10_000,
        maxAmount: 25_000,
        organizationId: organizations[1].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[4].id,
          },
        },
      },
    }),
    prisma.grant.create({
      data: {
        title: "Acala Ecosystem Fund",
        slug: "acala-ecosystem-fund",
        description: "Funding for DeFi projects building on Acala.",
        status: "OPEN",
        visibility: "PUBLISHED",
        totalFunds: 75_000,
        token: "ACA",
        totalFundsUSD: 15_000,
        minAmount: 5000,
        maxAmount: 20_000,
        organizationId: organizations[2].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[5].id,
          },
        },
      },
    }),
    prisma.grant.create({
      data: {
        title: "Polkadot Treasury Bounty Program",
        slug: "polkadot-treasury-bounty-program",
        description: "Open bounty program funded by the Polkadot Treasury.",
        status: "OPEN",
        visibility: "PUBLISHED",
        totalFunds: 500_000,
        token: "DOT",
        totalFundsUSD: 2_500_000,
        minAmount: 1000,
        maxAmount: 100_000,
        organizationId: organizations[3].id,
        publishedAt: now,
        curators: {
          create: {
            userId: users[6].id,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${grants.length} grants`);

  // Create RFPs
  const rfps = await Promise.all([
    prisma.rFP.create({
      data: {
        title: "Request for Proposals: Cross-Chain Bridge Security Audit",
        slug: "rfp-cross-chain-bridge-security-audit",
        description:
          "Seeking security auditors to review cross-chain bridge implementations.",
        status: "OPEN",
        visibility: "PUBLISHED",
        grantId: grants[0].id,
        publishedAt: now,
      },
    }),
    prisma.rFP.create({
      data: {
        title: "RFP: NFT Marketplace Development",
        slug: "rfp-nft-marketplace-development",
        description:
          "Looking for developers to build an NFT marketplace on Moonbeam.",
        status: "OPEN",
        visibility: "PUBLISHED",
        grantId: grants[1].id,
        publishedAt: now,
      },
    }),
  ]);

  console.log(`✅ Created ${rfps.length} RFPs`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📧 Test User Credentials:");
  console.log("- alice.rust@example.com (Builder)");
  console.log("- bob.ui@example.com (Builder)");
  console.log("- carol.writer@example.com (Builder)");
  console.log("- david.w3f@example.com (Org Admin - Web3 Foundation)");
  console.log("- emma.moonbeam@example.com (Org Admin - Moonbeam)");
  console.log("- frank.acala@example.com (Org Admin - Acala)");
  console.log("- admin@opentribe.io (Platform Superadmin)");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
