import { authClient } from "@packages/auth/client";
import { database as prisma } from "./index";

async function main() {
  console.log("🌱 Starting database seed with Better Auth...");
  console.log("⚠️  Make sure the API server is running on port 3002!");

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

  // Create test users using Better Auth API
  const testUsers = [
    {
      email: "alice.rust@example.com",
      password: "password123",
      name: "Alice Chen",
      username: "alice_substrate",
      role: "user",
      data: {
        headline: "Substrate Runtime Developer",
        bio: "Building the future of Web3 with Rust and Substrate. Previously at Parity Technologies.",
        skills: [
          "Rust",
          "TypeScript",
          "Go",
          "Substrate",
          "ink!",
          "React",
          "Runtime Development",
          "Smart Contracts",
          "Consensus Mechanisms",
        ],
        interests: ["DeFi", "Governance", "Cross-chain"],
        location: "Berlin, Germany",
        walletAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        github: "alice-substrate",
        twitter: "alice_web3",
        profileCompleted: true, // Set to false to test onboarding flow
      },
    },
    {
      email: "bob.ui@example.com",
      password: "password123",
      name: "Bob Martinez",
      username: "bob_designer",
      role: "user",
      data: {
        headline: "Web3 UI/UX Designer & Frontend Dev",
        bio: "Crafting beautiful and intuitive interfaces for dApps. Passionate about making blockchain accessible.",
        skills: [
          "Figma",
          "Framer",
          "Adobe XD",
          "TypeScript",
          "JavaScript",
          "React",
          "Next.js",
          "Vue",
          "UI/UX Design",
          "Design Systems",
          "Frontend Architecture",
        ],
        interests: ["NFTs", "Gaming", "Social"],
        location: "San Francisco, USA",
        walletAddress: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        twitter: "bob_designs",
        website: "https://bobmartinez.design",
        profileCompleted: true,
      },
    },
    {
      email: "carol.writer@example.com",
      password: "password123",
      name: "Carol Thompson",
      username: "carol_docs",
      role: "user",
      data: {
        headline: "Technical Writer & Developer Advocate",
        bio: "Making complex blockchain concepts accessible through clear documentation and tutorials.",
        skills: [
          "Technical Documentation",
          "Tutorials",
          "API Docs",
          "JavaScript",
          "Python",
          "Developer Relations",
          "Content Strategy",
          "Community Building",
        ],
        interests: ["Education", "Documentation", "Community"],
        location: "London, UK",
        walletAddress: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL",
        github: "carol-docs",
        linkedin: "carol-thompson",
        profileCompleted: true,
      },
    },
    {
      email: "david.w3f@example.com",
      password: "password123",
      name: "David Kim",
      username: "david_w3f",
      role: "admin",
      data: {
        headline: "Grant Program Manager at Web3 Foundation",
        bio: "Managing the Web3 Foundation Grants Program. Helping teams build the decentralized web.",
        skills: [
          "Grant Management",
          "Project Evaluation",
          "Ecosystem Development",
          "DeFi",
          "Infrastructure",
          "Tooling",
        ],
        location: "Zug, Switzerland",
        walletAddress: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        twitter: "w3f_grants",
        profileCompleted: true,
      },
    },
    {
      email: "emma.moonbeam@example.com",
      password: "password123",
      name: "Emma Wilson",
      username: "emma_moonbeam",
      role: "admin",
      data: {
        headline: "Developer Relations at Moonbeam Network",
        bio: "Building bridges between Ethereum and Polkadot. Smart contract enthusiast.",
        skills: [
          "Developer Relations",
          "Smart Contracts",
          "Cross-chain",
          "Solidity",
          "JavaScript",
          "Rust",
        ],
        location: "Miami, USA",
        walletAddress: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
        telegram: "emma_moonbeam",
        profileCompleted: true,
      },
    },
    {
      email: "frank.acala@example.com",
      password: "password123",
      name: "Frank Zhang",
      username: "frank_acala",
      role: "admin",
      data: {
        headline: "Ecosystem Growth at Acala Network",
        bio: "Growing the DeFi ecosystem on Polkadot. Focused on sustainable liquidity and adoption.",
        skills: [
          "DeFi",
          "Liquidity Management",
          "Ecosystem Growth",
          "Stablecoins",
          "DEX",
          "Liquid Staking",
        ],
        location: "Singapore",
        walletAddress: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
        twitter: "acala_frank",
        profileCompleted: true,
      },
    },
    {
      email: "admin@opentribe.io",
      password: "admin123",
      name: "Admin User",
      username: "admin",
      role: "superadmin",
      data: {
        headline: "Platform Administrator",
        bio: "Managing the Opentribe platform.",
        profileCompleted: true,
      },
    },
  ];

  console.log("📝 Creating users via Better Auth API...");
  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      console.log(`  Creating user: ${userData.email}`);

      const result = await authClient.signUp.email({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      });

      if (result.data?.user) {
        createdUsers.push(result.data.user);
        console.log(`  ✅ Created: ${userData.email}`);

        // Update the user with additional fields after creation
        if (userData.data) {
          await prisma.user.update({
            where: { id: result.data.user.id },
            data: {
              emailVerified: true,
              username: userData.username,
              role: userData.role as any,
              headline: userData.data.headline,
              bio: userData.data.bio,
              skills: userData.data.skills || undefined,
              interests: userData.data.interests || undefined,
              location: userData.data.location || undefined,
              walletAddress: userData.data.walletAddress || undefined,
              github: userData.data.github || undefined,
              twitter: userData.data.twitter || undefined,
              linkedin: userData.data.linkedin || undefined,
              website: userData.data.website || undefined,
              telegram: userData.data.telegram || undefined,
              profileCompleted: userData.data.profileCompleted || false,
            },
          });
        }
      } else {
        console.log(`  ⚠️  Failed to create: ${userData.email}`, result.error);
      }
    } catch (error) {
      console.error(`  ❌ Error creating ${userData.email}:`, error);
    }
  }

  if (createdUsers.length === 0) {
    console.log("❌ No users created");
    process.exit(1);
  }

  console.log(`\n✅ Created ${createdUsers.length} users`);

  // Now create organizations and other seed data...
  // (Rest of the seed data creation would go here, using the created user IDs)

  console.log("\n🎉 Users seeded successfully!");
  console.log("\n📧 Test User Credentials:");
  console.log("- alice.rust@example.com / password123 (Builder)");
  console.log("- bob.ui@example.com / password123 (Builder)");
  console.log("- carol.writer@example.com / password123 (Builder)");
  console.log(
    "- david.w3f@example.com / password123 (Org Admin - Web3 Foundation)"
  );
  console.log(
    "- emma.moonbeam@example.com / password123 (Org Admin - Moonbeam)"
  );
  console.log("- frank.acala@example.com / password123 (Org Admin - Acala)");
  console.log("- admin@opentribe.io / admin123 (Platform Superadmin)");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
