import { skillsOptions } from "@packages/base";
import { database as prisma } from "./index";

// Helper function to get specific skills by category
function getSkillsByCategory(categories: string[], count = 5) {
  const categorySkills = skillsOptions
    .filter((category) => categories.includes(category.heading))
    .flatMap((category) => category.options.map((skill) => skill.value));

  const shuffled = [...categorySkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log("🌱 Starting database seed...");

  const now = new Date();
  // Helper method to create dates relative to the current date
  const daysFromNow = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  // Clean existing data (but NOT users/accounts - they're created by seed-auth.ts)
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
    prisma.claimRequest.deleteMany(),
    // Don't delete sessions, accounts, or users - they're managed by seed-auth.ts
  ]);

  // Get existing users created by seed-auth.ts
  // If running seed.ts standalone, it will fail - run seed-auth.ts first!
  const userEmails = [
    "alice.rust@example.com",
    "bob.ui@example.com",
    "carol.writer@example.com",
    "david.w3f@example.com",
    "emma.moonbeam@example.com",
    "frank.acala@example.com",
    "admin@opentribe.io",
  ];

  const users = await Promise.all(
    userEmails.map((email) =>
      prisma.user.findUniqueOrThrow({ where: { email } })
    )
  );

  if (users.length !== 7) {
    throw new Error(
      "Users not found! Please run 'pnpm db:seed:auth' first to create users."
    );
  }

  console.log(`✅ Found ${users.length} existing users`);

  // Create real organizations
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
        orgType: "FOUNDATION",
        managedByPlatform: true,
        claimableBy: "github:w3f",
        ecosystemSource: "W3F_GRANTS",
        members: {
          create: {
            userId: users[3].id, // David
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
          "Moonbeam is a smart contract platform for building cross-chain connected applications that can access users, assets, and services on any chain.",
        logo: "https://avatars.githubusercontent.com/u/84856768",
        twitter: "MoonbeamNetwork",
        github: "PureStake",
        websiteUrl: "https://moonbeam.network",
        location: "Boston, USA",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[4].id, // Emma
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "Acala Network",
        slug: "acala",
        headline: "The DeFi Hub of Polkadot",
        description:
          "Acala is the all-in-one DeFi hub of Polkadot. A blockchain platform for financial applications to use smart contracts or built-in protocols.",
        logo: "https://avatars.githubusercontent.com/u/54881907",
        twitter: "AcalaNetwork",
        github: "AcalaNetwork",
        websiteUrl: "https://acala.network",
        location: "Global",
        isVerified: true,
        visibility: "VERIFIED",
        members: {
          create: {
            userId: users[5].id, // Frank
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "Community DAO",
        slug: "community-dao",
        headline: "Supporting grassroots Polkadot initiatives",
        description:
          "A community-driven organization supporting small but impactful projects in the Polkadot ecosystem.",
        logo: "https://avatars.githubusercontent.com/u/89759498",
        isVerified: false,
        visibility: "ACTIVE",
        members: {
          create: [
            {
              userId: users[1].id, // Bob
              role: "owner",
            },
            {
              userId: users[2].id, // Carol
              role: "admin",
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${organizations.length} organizations`);

  // Create realistic grants based on actual programs
  const grants = await Promise.all([
    // Web3 Foundation Grants
    prisma.grant.create({
      data: {
        title: "Decentralized Futures Program",
        slug: "decentralized-futures-2024",
        description: `The Decentralized Futures Program provides funding to kickstart teams and individuals building ambitious projects that contribute to the growth of the Polkadot ecosystem. 

This flagship initiative is backed by 20M USD and 5M DOT throughout 2024, supporting multiple funding mechanisms including grants, investments, and service agreements.

We're looking for projects that:
- Drive significant ecosystem growth
- Build critical infrastructure
- Create innovative applications
- Expand developer tooling
- Enhance user experience`,
        summary:
          "Web3 Foundation's flagship $45M funding program for ambitious Polkadot ecosystem projects",
        logoUrl: "https://avatars.githubusercontent.com/u/30405397",
        instructions: `## Application Process

1. Submit initial proposal outlining your project vision
2. Include detailed technical specifications
3. Provide clear milestones and deliverables
4. Demonstrate long-term sustainability plan
5. Show how your project benefits the Polkadot ecosystem

## Evaluation Criteria
- Technical innovation and feasibility
- Team experience and capability
- Ecosystem impact
- Long-term vision
- Community benefit`,
        resources: [
          {
            title: "Program Overview",
            url: "https://futures.web3.foundation",
            description: "Official program website",
          },
          {
            title: "Application Guide",
            url: "https://futures.web3.foundation/apply",
            description: "Step-by-step application instructions",
          },
          {
            title: "FAQ",
            url: "https://futures.web3.foundation/faq",
            description: "Frequently asked questions",
          },
        ],
        screening: [
          {
            question:
              "Describe the problem your project solves for the Polkadot ecosystem.",
            optional: false,
          },
          {
            question: "List your core team members and relevant experience.",
            optional: false,
          },
          {
            question: "Outline key milestones and success metrics.",
            optional: true,
          },
        ],
        skills: getSkillsByCategory(["Blockchain", "Backend", "Frontend"], 6),
        minAmount: 50_000,
        maxAmount: 500_000,
        totalFunds: 45_000_000,
        token: "DOT",
        status: "CLOSED",
        visibility: "PUBLISHED",
        source: "NATIVE",
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-2),
        viewCount: 342,
        applicationCount: 1,
      },
    }),
    prisma.grant.create({
      data: {
        title: "Web3 Foundation Open Grants",
        slug: "w3f-open-grants",
        description: `The Web3 Foundation Grants Program funds software development and research efforts related to Polkadot, Kusama and Substrate.

We prioritize technical projects that add value to the ecosystem and present a compelling long-term vision.

Focus areas include:
- Development tools and libraries
- UI development
- Backend development
- System integration
- Research projects
- Community education`,
        summary:
          "Technical grants for Polkadot and Substrate development projects",
        instructions: `## How to Apply

1. **Check Eligibility**: Review our focus areas and requirements
2. **Prepare Application**: Use our application template
3. **Submit via GitHub**: Create a pull request with your proposal
4. **Review Process**: Our team will review within 2 weeks
5. **Milestone Delivery**: Deliver agreed milestones for payment

## Requirements
- Open source (Apache 2.0 or MIT license)
- Documentation and testing
- No token sales or ICOs`,
        resources: [
          {
            title: "Application Template",
            url: "https://github.com/w3f/Grants-Program/blob/master/applications/template.md",
          },
          {
            title: "Grant Guidelines",
            url: "https://grants.web3.foundation/docs/Process/how-to-apply",
          },
        ],
        screening: [
          {
            question: "Share your GitHub organization or repositories.",
            optional: false,
          },
          {
            question: "What milestones will you deliver for each payout?",
            optional: false,
          },
          {
            question: "How will this work remain open source?",
            optional: true,
          },
        ],
        skills: getSkillsByCategory(["Blockchain", "Backend", "Content"], 5),
        minAmount: 10_000,
        maxAmount: 100_000,
        totalFunds: 10_000_000,
        token: "DOT",
        status: "CLOSED",
        visibility: "PUBLISHED",
        source: "NATIVE",
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-4),
        viewCount: 523,
        applicationCount: 1,
      },
    }),

    // Moonbeam Grants
    prisma.grant.create({
      data: {
        title: "Moonbeam Ecosystem Grants",
        slug: "moonbeam-ecosystem-grants",
        description: `The Moonbeam Grants Program accelerates the growth of the Moonbeam ecosystem by funding projects that enhance our cross-chain connected contracts platform.

We support projects building:
- Cross-chain dApps leveraging Moonbeam's interoperability
- DeFi protocols and infrastructure
- NFT platforms and marketplaces
- Developer tools and integrations
- Educational content and resources

Moonbeam's Ethereum compatibility combined with Polkadot's cross-chain features creates unique opportunities for innovative applications.`,
        summary: "Funding cross-chain dApps and tools on Moonbeam",
        instructions: `Submit your application through our grants portal with:
- Project overview and objectives
- Technical architecture
- Team background
- Development roadmap
- Budget breakdown
- How you'll leverage Moonbeam's unique features`,
        resources: [
          {
            title: "Program Portal",
            url: "https://moonbeam.network/grants",
            description: "Apply and track your Moonbeam grant",
          },
          {
            title: "Cross-chain Docs",
            url: "https://docs.moonbeam.network/learn/features/cross-chain",
            description: "Deep dive into Moonbeam interoperability",
          },
        ],
        screening: [
          {
            question:
              "How does your project leverage Moonbeam’s interoperability?",
            optional: false,
          },
          {
            question:
              "Provide a technical architecture diagram or description.",
            optional: false,
          },
        ],
        skills: getSkillsByCategory(["Blockchain", "Frontend"], 5),
        minAmount: 5000,
        maxAmount: 50_000,
        totalFunds: 10_000_000,
        token: "GLMR",
        status: "CLOSED",
        visibility: "PUBLISHED",
        source: "NATIVE",
        organizationId: organizations[1].id,
        publishedAt: daysFromNow(-10),
        viewCount: 287,
        applicationCount: 0,
      },
    }),

    // Acala Grants
    prisma.grant.create({
      data: {
        title: "aUSD Ecosystem Fund",
        slug: "ausd-ecosystem-fund",
        description: `The $250M aUSD Ecosystem Fund supports projects building on Acala and leveraging the aUSD stablecoin.

Focus areas:
- DeFi protocols integrating aUSD
- Cross-chain applications using aUSD
- Liquidity provision and yield strategies
- Payment and commerce solutions
- Infrastructure and tooling

Join leading projects already building with aUSD across Polkadot parachains.`,
        summary:
          "$250M fund for projects building with Acala's aUSD stablecoin",
        logoUrl: "https://acala.network/ausd-logo.png",
        minAmount: 25_000,
        maxAmount: 1_000_000,
        totalFunds: 250_000_000,
        token: "aUSD",
        status: "CLOSED",
        visibility: "PUBLISHED",
        source: "NATIVE",
        organizationId: organizations[2].id,
        publishedAt: daysFromNow(-8),
        viewCount: 412,
        applicationCount: 0,
        skills: getSkillsByCategory(["Blockchain", "Backend"], 5),
        resources: [
          {
            title: "aUSD Fund Overview",
            url: "https://acala.network/ausd-fund",
            description: "Program details and milestones",
          },
          {
            title: "Integration Guide",
            url: "https://docs.acala.network/learn/defi/ausd",
            description: "Using aUSD in your application",
          },
        ],
        screening: [
          {
            question: "Explain how your product will drive aUSD utility.",
            optional: false,
          },
          {
            question: "Detail your liquidity strategy and partners.",
            optional: true,
          },
          {
            question: "List measurable KPIs for the next 6 months.",
            optional: false,
          },
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${grants.length} grants`);

  // Create Kusama Vision external grants (Web3 Foundation)
  const kusamaGrants = await Promise.all([
    prisma.grant.create({
      data: {
        title: "Proof of Personhood Bounty",
        slug: "proof-of-personhood-bounty",
        externalId: "kusama:proof-of-personhood-bounty",
        description: `How do you prove you are a real, unique human - without revealing who you are? That is the question this bounty exists to answer.

We fund projects that build Proof of Personhood systems for the Kusama network. The goal is simple to state and hard to achieve: let every person prove they are present only once, without surveillance, without biometric databases, and without leaking identity or behavior data.

What we are looking for:

- Systems that resist Sybil attacks through cryptographic or social mechanisms
- Designs that treat privacy as a hard requirement, not an afterthought
- Solutions that work across different applications rather than serving a single use case
- Clear, testable assumptions about security, scalability, and adoption
- Protection against identity farming, coercion, and collusion

What we are not looking for:

- Biometric collection or centralized identity databases
- Systems that deanonymize users as part of verification
- Proposals that rely on trust rather than verifiable mechanisms

This bounty operates on a rolling basis - there is no deadline. Submit a proposal when you are ready. Funding is provided in DOT through the Kusama network. Each proposal is evaluated individually by the curatorial committee.

Before submitting, review the full participation charter which covers privacy requirements, engagement standards, and evaluation criteria.`,
        summary:
          "Funding Proof of Personhood systems that resist Sybil attacks while preserving privacy on Kusama",
        resources: [
          {
            title: "Original Grant Website",
            url: "https://k51qzi5uqu5dk1h0t1ofq49oww8ykmcnsxl1h3m0d41pb58eog9f9yjjwxnnwh.ipns.dweb.link/",
            description: "Primary source page for the Proof of Personhood bounty",
          },
          {
            title: "Kusama Referenda #498",
            url: "https://kusama.subsquare.io/referenda/498",
            description:
              "On-chain reference for the Proof of Personhood bounty funding",
          },
          {
            title: "PoP Community Space",
            url: "https://matrix.to/#/#kusama-pop-bounty:matrix.org",
            description:
              "Join the Matrix channel to discuss proposals and connect with curators",
          },
        ],
        skills: [
          "identity",
          "privacy",
          "cryptography",
          "sybil-resistance",
          "decentralized-systems",
        ],
        token: "DOT",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "EXTERNAL",
        fundingSource: "TREASURY",
        onChainRef: "kusama-referenda-498",
        onChainRefUrl: "https://kusama.subsquare.io/referenda/498",
        applicationUrl: "https://formstr.app/i/kusama-pop",
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-3),
        viewCount: 45,
        applicationCount: 0,
      },
    }),
    prisma.grant.create({
      data: {
        title: "Kusama ZK Bounty",
        slug: "kusama-zk-bounty",
        externalId: "kusama:kusama-zk-bounty",
        description: `Most blockchains make everything visible by default. Zero-knowledge proofs change that - they let you prove something is true without revealing the underlying data. This bounty funds builders who are making that capability native to Kusama.

We support projects that integrate zero-knowledge technology across the full stack: runtime-level proof verification, privacy-preserving smart contracts, and end-user applications that protect data by default.

Areas we actively fund:

- ZK proof verification built into parachain runtimes
- Optimized ZK libraries targeting PolkaVM and RISC-V
- Selective disclosure systems for credentials, membership, and reputation
- Privacy-preserving governance - participate in OpenGov without exposing your voting patterns
- Private DeFi - transaction privacy, hidden balances, confidential swaps
- Post-quantum proof systems that remain secure against future computing advances

This is not an exhaustive list. If your project advances privacy on Kusama through zero-knowledge technology, we want to hear about it - whether you are building infrastructure, developer tooling, or end-user applications.

Funding comes from a shared 10M DOT pool allocated across Kusama bounty programs. Proposals are evaluated on technical merit, real-world feasibility, and contribution to the open ecosystem. Funded work is expected to run in production conditions on Kusama, not just in test environments.

Rolling applications, no deadline.`,
        summary:
          "Funding zero-knowledge proof integration across Kusama runtimes, smart contracts, and applications",
        resources: [
          {
            title: "Original Grant Website",
            url: "https://zk.kusama.vision/#apply",
            description: "Primary source page for the Kusama ZK bounty",
          },
          {
            title: "ZK Community Space",
            url: "https://matrix.to/#/#kusama-zk:virto.community",
            description:
              "Join the Matrix channel to discuss zero-knowledge projects and proposals",
          },
        ],
        skills: [
          "zero-knowledge",
          "cryptography",
          "privacy",
          "smart-contracts",
          "rust",
        ],
        token: "DOT",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "EXTERNAL",
        fundingSource: "TREASURY",
        onChainRef: "kusama-referenda-507",
        onChainRefUrl: "https://kusama.subsquare.io/referenda/507",
        applicationUrl:
          "https://puffy-xylophone-2a5.notion.site/95b593191de28385bf208189cec1887b",
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-5),
        viewCount: 78,
        applicationCount: 0,
      },
    }),
    prisma.grant.create({
      data: {
        title: "KSM Art & Social Experiments Initiative",
        slug: "ksm-art-social-experiments",
        externalId: "kusama:ksm-art-social-experiments",
        description: `Technology shapes society - but who shapes technology? This initiative funds artists, researchers, and cultural practitioners who explore that question through the lens of the cypherpunk movement.

We support projects that critically examine digital identity, privacy, censorship, surveillance, and the power dynamics between users and platforms. The work can live on-chain, off-chain, or somewhere in between. What matters is that it engages seriously with these themes and contributes to broader cultural discourse.

What we fund:

- Visual art - generative art, data art, painting, sculpture, digital installations, on-chain or hybrid works
- Performance and live art - theatre, music, dance, immersive environments, site-specific interventions
- Film, sound, and media - experimental cinema, audio works, publications, expanded media
- Research and social experiments - academic inquiry, participatory projects, DAOs as artistic practice
- Writing and criticism - essays, publications, and texts that engage with decentralized culture

Funding is primarily available for projects up to 10,000 USD, paid in DOT on the Kusama network. Larger proposals are considered on a case-by-case basis.

To apply, submit a single PDF (maximum 15 pages, English language) containing: your contact details, a project description of 500 to 1000 words, a motivation letter of up to 400 words, supporting visual materials, documentation of at least three previous works, a budget overview, a project timeline, and a CV or portfolio link.

Applications are reviewed on a rolling basis by a curatorial committee with backgrounds in art, research, culture, and decentralized technology. There is no fixed deadline.`,
        summary:
          "Funding artistic and social experiments exploring cypherpunk themes on Kusama",
        resources: [
          {
            title: "Original Grant Website",
            url: "https://art.ksm.vision/#participate",
            description: "Primary source page for the KSM Art initiative",
          },
          {
            title: "Basis & Terms",
            url: "https://art.ksm.vision/basis-terms/",
            description:
              "Full program terms, selection criteria, and legal conditions",
          },
        ],
        skills: [
          "art",
          "design",
          "research",
          "social-experiments",
          "content-creation",
        ],
        minAmount: 1000,
        maxAmount: 10_000,
        totalFunds: 100_000,
        token: "DOT",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "EXTERNAL",
        fundingSource: "TREASURY",
        onChainRef: "kusama-referenda-404",
        onChainRefUrl: "https://kusama.subsquare.io/referenda/404",
        applicationUrl: "https://ksmart.notion.site",
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-7),
        viewCount: 32,
        applicationCount: 0,
      },
    }),
  ]);

  console.log(`✅ Created ${kusamaGrants.length} Kusama Vision grants`);

  // Create curators for Kusama grants
  const kusamaCurators = await Promise.all([
    prisma.curator.create({
      data: {
        userId: users[6].id, // Admin
        grantId: kusamaGrants[0].id,
        contact: "hello@kusama-pop-bounty.matrix.org",
      },
    }),
    prisma.curator.create({
      data: {
        userId: users[6].id, // Admin
        grantId: kusamaGrants[1].id,
        contact: "hello@kusama-zk.virto.community",
      },
    }),
    prisma.curator.create({
      data: {
        userId: users[6].id, // Admin
        grantId: kusamaGrants[2].id,
        contact: "https://art.ksm.vision/contact/",
      },
    }),
  ]);

  console.log(`✅ Created ${kusamaCurators.length} Kusama grant curators`);

  // Create realistic bounties
  const bounties = await Promise.all([
    prisma.bounty.create({
      data: {
        title: "Polkadot.js Extension UI/UX Improvements",
        slug: "polkadotjs-extension-ui",
        description: `We're looking for talented designers and developers to improve the Polkadot.js browser extension user experience.

## Objectives:
- Redesign the account management interface
- Improve the transaction signing flow
- Add better visual feedback for network status
- Enhance accessibility features
- Create a more intuitive onboarding process

## Deliverables:
- Figma designs for all screens
- Implemented React components
- Documentation for design decisions
- User testing results

## Evaluation Criteria:
- Design quality and consistency
- User experience improvements
- Code quality and documentation
- Community feedback`,
        resources: [
          {
            title: "Current Extension",
            url: "https://github.com/polkadot-js/extension",
            description: "Source code",
          },
          {
            title: "Design Guidelines",
            url: "https://polkadot.network/brand",
            description: "Polkadot brand assets",
          },
        ],
        screening: [
          {
            question: "Link to previous UI/UX case studies or portfolios.",
            optional: false,
          },
          {
            question: "How will you validate improvements with real users?",
            optional: false,
          },
          {
            question:
              "Describe your plan for ensuring accessibility (color contrast, keyboard use, screen readers).",
            optional: false,
          },
          {
            question:
              "Outline the timeline and key milestones for delivering both design and implementation.",
            optional: true,
          },
        ],
        skills: getSkillsByCategory(["Design", "Frontend"], 4),
        amount: 15_000,
        token: "DOT",
        winnings: { "1": 8000, "2": 5000, "3": 2000 },
        split: "FIXED",
        status: "OPEN",
        visibility: "PUBLISHED",
        deadline: daysFromNow(15),
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-9),
        viewCount: 156,
        submissionCount: 1,
      },
    }),
    prisma.bounty.create({
      data: {
        title: "Create Substrate Pallet Tutorial Series",
        slug: "substrate-pallet-tutorials",
        description: `Create a comprehensive tutorial series teaching developers how to build custom Substrate pallets.

## Requirements:
- 5-part tutorial series covering:
  1. Pallet basics and structure
  2. Storage and events
  3. Dispatchable functions
  4. Testing strategies
  5. Advanced patterns

- Each tutorial should include:
  - Written guide (2000+ words)
  - Complete code examples
  - Video walkthrough (optional, bonus points)
  - Exercises for readers

## Quality Standards:
- Clear, beginner-friendly explanations
- Working code examples
- Best practices and common pitfalls
- Real-world use cases`,
        skills: getSkillsByCategory(["Content", "Blockchain"], 4),
        amount: 10_000,
        token: "DOT",
        split: "EQUAL_SPLIT",
        status: "COMPLETED",
        visibility: "PUBLISHED",
        deadline: daysFromNow(-10),
        organizationId: organizations[3].id,
        publishedAt: daysFromNow(-5),
        viewCount: 98,
        submissionCount: 1,
        resources: [
          {
            title: "Substrate Docs",
            url: "https://docs.substrate.io/",
            description: "Official developer documentation",
          },
          {
            title: "Tutorial Template",
            url: "https://github.com/substrate-developer-hub/substrate-how-to",
            description: "Structure for content submissions",
          },
        ],
        screening: [
          {
            question: "Provide links to educational content you have created.",
            optional: false,
          },
          {
            question: "Share your outline for the 5 tutorial parts.",
            optional: false,
          },
        ],
      },
    }),
    prisma.bounty.create({
      data: {
        title: "Cross-chain DEX Aggregator Research",
        slug: "cross-chain-dex-research",
        description: `Research and document cross-chain DEX aggregation strategies for the Polkadot ecosystem.

## Scope:
- Analyze existing DEX aggregators
- Research cross-chain messaging protocols (XCM, etc.)
- Design optimal routing algorithms
- Consider MEV protection strategies
- Provide implementation recommendations

## Deliverables:
- Comprehensive research report (20+ pages)
- Technical architecture proposal
- Proof of concept code (optional)
- Presentation slides`,
        skills: getSkillsByCategory(["Content", "Blockchain"], 4),
        amount: 7500,
        token: "DOT",
        winnings: { "1": 5000, "2": 2500 },
        split: "FIXED",
        status: "OPEN",
        visibility: "PUBLISHED",
        deadline: daysFromNow(12),
        organizationId: organizations[2].id,
        publishedAt: daysFromNow(-12),
        viewCount: 73,
        submissionCount: 0,
        resources: [
          {
            title: "XCM Whitepaper",
            url: "https://wiki.polkadot.network/docs/learn-xcm",
            description: "Cross-chain messaging fundamentals",
          },
          {
            title: "DEX Aggregator Survey",
            url: "https://research.parity.io/dex-aggregators",
            description: "Reference research document",
          },
        ],
        screening: [
          {
            question: "Outline your research methodology and deliverables.",
            optional: false,
          },
          {
            question: "List prior research publications or case studies.",
            optional: true,
          },
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${bounties.length} bounties`);

  // Create curators for all grants and bounties
  // Curators are assigned based on organization ownership
  const curators = await Promise.all([
    // Grant curators
    // grants[0] - Decentralized Futures Program (Web3 Foundation - David)
    prisma.curator.create({
      data: {
        userId: users[3].id, // David (W3F owner)
        grantId: grants[0].id,
        contact: users[3].email,
      },
    }),
    // grants[1] - Web3 Foundation Open Grants (Web3 Foundation - David)
    prisma.curator.create({
      data: {
        userId: users[3].id, // David (W3F owner)
        grantId: grants[1].id,
        contact: users[3].email,
      },
    }),
    // grants[2] - Moonbeam Ecosystem Grants (Moonbeam - Emma)
    prisma.curator.create({
      data: {
        userId: users[4].id, // Emma (Moonbeam owner)
        grantId: grants[2].id,
        contact: users[4].email,
      },
    }),
    // grants[3] - Acala Grant Program (Acala - Frank)
    prisma.curator.create({
      data: {
        userId: users[5].id, // Frank (Acala owner)
        grantId: grants[3].id,
        contact: users[5].email,
      },
    }),

    // Bounty curators
    // bounties[0] - Polkadot.js Extension UI/UX (Web3 Foundation - David)
    prisma.curator.create({
      data: {
        userId: users[3].id, // David (W3F owner)
        bountyId: bounties[0].id,
        contact: users[3].email,
      },
    }),
    // bounties[1] - Community DAO bounty (Community DAO - Bob)
    prisma.curator.create({
      data: {
        userId: users[1].id, // Bob (Community DAO owner)
        bountyId: bounties[1].id,
        contact: users[1].email,
      },
    }),
    // bounties[2] - Acala bounty (Acala - Frank)
    prisma.curator.create({
      data: {
        userId: users[5].id, // Frank (Acala owner)
        bountyId: bounties[2].id,
        contact: users[5].email,
      },
    }),
  ]);

  console.log(
    `✅ Created ${curators.length} curators (${
      curators.filter((c) => c.grantId).length
    } for grants, ${curators.filter((c) => c.bountyId).length} for bounties)`
  );

  // Create RFPs for grants
  const rfps = await Promise.all([
    prisma.rFP.create({
      data: {
        title: "XCM v3 Developer Tooling",
        slug: "xcm-v3-developer-tools",
        description: `We're seeking proposals for comprehensive XCM v3 developer tooling to simplify cross-chain development.

## Problem Statement:
Cross-chain message passing with XCM is powerful but complex. Developers need better tools to build, test, and debug XCM programs.

## Requested Solutions:
- Visual XCM message builder
- XCM testing framework
- Debugging and monitoring tools
- Documentation generator
- Integration with existing dev tools

## Technical Requirements:
- Support for all XCM v3 instructions
- Multi-chain testing capabilities
- Real-time message tracking
- Error diagnosis and suggestions`,
        resources: [
          {
            title: "XCM Format",
            url: "https://github.com/paritytech/xcm-format",
            description: "XCM specification",
          },
          {
            title: "XCM Docs",
            url: "https://wiki.polkadot.network/docs/learn-xcm",
            description: "Official documentation",
          },
        ],
        grantId: grants[0].id,
        status: "OPEN",
        visibility: "PUBLISHED",
        publishedAt: daysFromNow(-2),
        viewCount: 89,
        voteCount: 24,
      },
    }),
    prisma.rFP.create({
      data: {
        title: "Substrate Light Client Libraries",
        slug: "substrate-light-clients",
        description: `Build production-ready light client libraries for Substrate-based chains.

## Objectives:
Enable lightweight blockchain interaction without running full nodes, crucial for mobile and web applications.

## Requirements:
- Multi-language support (JS/TS, Rust, Go)
- Efficient state proof verification
- WebAssembly compatibility
- Comprehensive documentation
- Example applications

## Evaluation Criteria:
- Performance benchmarks
- Security audit readiness
- Developer experience
- Maintenance commitment`,
        grantId: grants[1].id,
        status: "OPEN",
        visibility: "PUBLISHED",
        publishedAt: daysFromNow(-8),
        viewCount: 112,
        voteCount: 31,
        resources: [
          {
            title: "Light Client Design Doc",
            url: "https://github.com/paritytech/substrate-light-client",
            description: "Reference architecture",
          },
          {
            title: "Substrate RPC",
            url: "https://docs.substrate.io/reference/rpc/",
            description: "RPC specifications",
          },
        ],
      },
    }),
    prisma.rFP.create({
      data: {
        title: "KryptOS - Total Privacy Operating System",
        slug: "000-privacy-os",
        description: `KryptOS is a proposal for a comprehensive privacy platform built on top of Polkadot stack, ZK (Zero-Knowledge) primitives, and the broader Dotsama ecosystem.

## The Proposal

KryptOS aims to provide a complete privacy solution that allows users to interact with Web3 without revealing their identity, transaction history, or metadata. This extends the privacy guarantees of substrate-based chains to the application layer.

## Scope

The scope of this RFP includes but is not limited to:

1. **Relay Chain Privacy Bridge**: Private bridge between Kusama Relay Chain and other chains in the ecosystem
2. **Anonymous Governance Participation**: Shield identity while participating in on-chain governance
3. **Private Smart Contracts**: Confidential execution environment for smart contracts
4. **Privacy-Preserving Cross-Chain Messaging**: Private cross-chain communication via XCM
5. **ZK-Enabled Identity Layer**: Self-sovereign identity system using zero-knowledge proofs

## Key Requirements

- All implementations must be open-source under a permissive license
- Continuous security audits by reputable firms
- Comprehensive documentation and developer guides
- Integration with existing Polkadot SDK modules

## Evaluation Criteria

- Demonstrated expertise in ZK cryptography
- Modular and extensible architecture
- Performance benchmarks under various network conditions
- Quality of test suites and documentation

## Acceptance Criteria

- Functional implementation of at least one component from the scope
- Passed third-party security audit with no critical vulnerabilities
- Open-source with permissive license
- Integration with Polkadot SDK (FRAME)
- Formal verification for critical components where applicable
- Test coverage > 80% for core logic
- Native support for privacy-preserving cross-chain messaging via XCM`,
        grantId: kusamaGrants[1].id,
        status: "OPEN",
        visibility: "PUBLISHED",
        publishedAt: daysFromNow(-30),
        viewCount: 0,
        voteCount: 0,
        resources: [
          {
            title: "Kusama Vision RFP Listing",
            url: "https://zk.kusama.vision/rfps/#000-privacy-os",
            description: "Published RFP listing for KryptOS on Kusama Vision",
          },
          {
            title: "Source Markdown",
            url: "https://codeberg.org/kusama-zk/RFPs/src/branch/main/rfp/000-privacy-os.md",
            description: "Original markdown source for the KryptOS RFP",
          },
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${rfps.length} RFPs`);

  // Create some grant applications
  const applications = await Promise.all([
    prisma.grantApplication.create({
      data: {
        userId: users[0].id, // Alice
        grantId: grants[0].id,
        rfpId: rfps[0].id,
        title: "XCM Studio - Visual Cross-chain Development Platform",
        summary:
          "A comprehensive IDE for building, testing, and deploying XCM programs with visual tools",
        description: `## Project Overview

XCM Studio will be the first visual development environment specifically designed for cross-chain messaging in the Polkadot ecosystem.

### Key Features:
1. **Visual Message Builder**: Drag-and-drop interface for constructing XCM messages
2. **Multi-chain Simulator**: Test XCM execution across multiple chains locally
3. **Real-time Debugger**: Step through XCM execution with state visualization
4. **Code Generation**: Export visual designs to Rust/JS code
5. **Integration Hub**: Connect with existing tools like Polkadot.js

### Technical Approach:
- Built with Rust (backend) and React (frontend)
- Uses light clients for chain simulation
- Implements XCM v3 interpreter
- WebAssembly for browser compatibility`,
        timeline: [
          { milestone: "Architecture & Design", date: "Month 1" },
          { milestone: "Core Engine Development", date: "Month 2-3" },
          { milestone: "Visual Builder Implementation", date: "Month 4-5" },
          { milestone: "Testing Framework", date: "Month 6" },
          { milestone: "Documentation & Launch", date: "Month 7" },
        ],
        budget: 250_000,
        status: "SUBMITTED",
        submittedAt: daysFromNow(1),
        likesCount: 15,
        viewCount: 67,
      },
    }),
    prisma.grantApplication.create({
      data: {
        userId: users[2].id, // Carol
        grantId: grants[1].id,
        title: "Substrate by Example - Interactive Learning Platform",
        summary:
          "An interactive tutorial platform teaching Substrate development through hands-on examples",
        description: `## Vision

Create the most comprehensive and accessible learning resource for Substrate developers, similar to "Rust by Example" but interactive.

### Platform Features:
- 50+ interactive tutorials
- In-browser code editor
- Real-time compilation and testing
- Progress tracking
- Community contributions

### Content Roadmap:
1. Substrate Basics (10 tutorials)
2. Pallet Development (15 tutorials)
3. Runtime Configuration (10 tutorials)
4. Testing Strategies (8 tutorials)
5. Advanced Patterns (7 tutorials)`,
        budget: 75_000,
        status: "UNDER_REVIEW",
        label: "Reviewed",
        submittedAt: daysFromNow(-10),
        reviewedAt: daysFromNow(-5),
        likesCount: 23,
        viewCount: 134,
      },
    }),
  ]);

  console.log(`✅ Created ${applications.length} grant applications`);

  // Create bounty submissions
  const submissions = await Promise.all([
    prisma.submission.create({
      data: {
        bountyId: bounties[0].id,
        userId: users[1].id, // Bob
        title: "Polkadot.js Extension Redesign - Modern & Accessible",
        description: `## Design Approach

I've completely reimagined the Polkadot.js extension with a focus on clarity, accessibility, and modern design principles.

### Key Improvements:
1. **Simplified Account View**: Clear visual hierarchy with account avatars
2. **Intuitive Transaction Flow**: Step-by-step signing process with clear feedback
3. **Network Status**: Real-time connection indicators
4. **Dark/Light Themes**: Respecting user preferences
5. **Accessibility**: WCAG 2.1 AA compliant

### Implementation:
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React Hook Form for validation
- Comprehensive Storybook documentation`,
        submissionUrl:
          "https://github.com/bob_designer/polkadotjs-extension-redesign",
        responses: {
          figmaUrl: "https://figma.com/file/xyz/polkadotjs-redesign",
          demoUrl: "https://polkadotjs-redesign.vercel.app",
          userTestingResults:
            "https://docs.google.com/document/d/testing-results",
        },
        status: "SUBMITTED",
        submittedAt: daysFromNow(5),
        likesCount: 42,
        viewCount: 189,
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: bounties[1].id,
        userId: users[2].id, // Carol
        title: "Substrate Pallet Development Masterclass",
        description: `## Tutorial Series Overview

I've created a comprehensive 5-part tutorial series that takes developers from zero to hero in Substrate pallet development.

### Series Structure:
1. **Pallet Anatomy**: Understanding the building blocks
2. **State & Storage**: Deep dive into storage patterns
3. **Extrinsics & Events**: Building user interactions
4. **Testing Like a Pro**: Comprehensive testing strategies
5. **Production Patterns**: Advanced techniques and optimizations

Each tutorial includes:
- 2500+ word written guide
- Complete GitHub repository
- 20-30 minute video walkthrough
- Interactive exercises
- Quiz to test understanding`,
        submissionUrl: "https://substrate-masterclass.dev",
        status: "SUBMITTED",
        submittedAt: daysFromNow(8),
        likesCount: 38,
        viewCount: 156,
      },
    }),
  ]);

  console.log(`✅ Created ${submissions.length} bounty submissions`);

  // Create some comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        body: "This is exactly what the ecosystem needs! The visual builder approach will make XCM accessible to so many more developers. Looking forward to seeing this implemented.",
        authorId: users[4].id, // Emma
        applicationId: applications[0].id,
        type: "NORMAL",
      },
    }),
    prisma.comment.create({
      data: {
        body: "Great proposal! Have you considered integrating with existing XCM monitoring tools? It would be valuable to see real-time message execution on live networks too.",
        authorId: users[3].id, // David
        applicationId: applications[0].id,
        type: "NORMAL",
      },
    }),
    prisma.comment.create({
      data: {
        body: "The design looks amazing! I especially love the transaction flow improvements. This will definitely reduce user errors during signing.",
        authorId: users[2].id, // Carol
        submissionId: submissions[0].id,
        type: "NORMAL",
      },
    }),
  ]);

  console.log(`✅ Created ${comments.length} comments`);

  // Create some likes
  const likes = await Promise.all([
    prisma.like.create({
      data: {
        userId: users[3].id,
        applicationId: applications[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[4].id,
        applicationId: applications[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[0].id,
        submissionId: submissions[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${likes.length} likes`);

  // Create votes on RFPs
  const votes = await Promise.all([
    prisma.vote.create({
      data: {
        userId: users[0].id,
        rfpId: rfps[0].id,
        direction: "UP",
      },
    }),
    prisma.vote.create({
      data: {
        userId: users[1].id,
        rfpId: rfps[0].id,
        direction: "UP",
      },
    }),
    prisma.vote.create({
      data: {
        userId: users[2].id,
        rfpId: rfps[1].id,
        direction: "UP",
      },
    }),
  ]);

  console.log(`✅ Created ${votes.length} votes`);

  // Create claims for ecosystem profiles
  // Get some ecosystem profiles from the database
  const ecosystemProfiles = await prisma.ecosystemProfile.findMany({
    take: 5, // Get first 5 profiles for claims
  });

  if (ecosystemProfiles.length === 0) {
    console.warn("⚠️  No ecosystem profiles found - skipping claims seeding");
  } else {
    const claimRequests = await Promise.all([
      // PENDING claim - Alice claiming a profile
      prisma.claimRequest.create({
        data: {
          ecosystemProfileId: ecosystemProfiles[0].id,
          userId: users[0].id, // Alice
          method: "GITHUB_OAUTH",
          status: "PENDING",
          expiresAt: daysFromNow(30),
          verificationData: {
            githubUsername: "alice_substrate",
            githubId: "12345",
            email: "alice.rust@example.com",
          },
        },
      }),
      // PENDING claim - Bob claiming a profile
      prisma.claimRequest.create({
        data: {
          ecosystemProfileId: ecosystemProfiles[1].id,
          userId: users[1].id, // Bob
          method: "EMAIL_VERIFICATION",
          status: "PENDING",
          expiresAt: daysFromNow(7),
          verificationData: {
            email: "bob.ui@example.com",
            verificationToken: "token_123456",
          },
        },
      }),
      // VERIFIED claim - Carol claiming a profile (already approved)
      prisma.claimRequest.create({
        data: {
          ecosystemProfileId: ecosystemProfiles[2].id,
          userId: users[2].id, // Carol
          method: "WALLET_SIGNATURE",
          status: "VERIFIED",
          expiresAt: daysFromNow(365),
          reviewedBy: users[6].id, // Admin approved it
          reviewNotes: "Wallet signature verified and matches profile",
          verificationData: {
            wallet: "1AAAAA2222BBBBBccccDDDDDeeeee3333",
            signature: "0x1234567890abcdef",
          },
        },
      }),
      // REJECTED claim - David's claim was rejected
      prisma.claimRequest.create({
        data: {
          ecosystemProfileId: ecosystemProfiles[3].id,
          userId: users[3].id, // David
          method: "EMAIL_VERIFICATION",
          status: "REJECTED",
          expiresAt: daysFromNow(1),
          reviewedBy: users[6].id, // Admin rejected it
          reviewNotes:
            "Email verification failed - no response from user after 2 attempts",
          verificationData: {
            email: "david.w3f@example.com",
          },
        },
      }),
      // PENDING claim - Emma claiming a profile (new claim)
      prisma.claimRequest.create({
        data: {
          ecosystemProfileId: ecosystemProfiles[4].id,
          userId: users[4].id, // Emma
          method: "GITHUB_OAUTH",
          status: "PENDING",
          expiresAt: daysFromNow(14),
          verificationData: {
            githubUsername: "emma_moonbeam",
            githubId: "54321",
            email: "emma.moonbeam@example.com",
          },
        },
      }),
    ]);

    console.log(`✅ Created ${claimRequests.length} claim requests`);
  }

  // Seed organization claims (invitations with status = "claim_pending")
  // This provides test data for Phase 11 testing (tests 11.12-11.15)
  const organizationClaims = await Promise.all([
    // PENDING claim - Carol claiming Web3 Foundation (for test 11.12-11.13)
    prisma.invitation.create({
      data: {
        organizationId: organizations[0].id, // Web3 Foundation
        email: users[2].email, // carol.writer@example.com
        role: "owner",
        status: "claim_pending",
        inviterId: users[2].id, // Self-referential for claims
        expiresAt: daysFromNow(30),
        // Proof text would be stored as a comment or custom field in real implementation
        // For now, we document it here for reference
      },
    }),
    // REJECTED claim - Frank's claim was rejected (for test 11.14 verification)
    prisma.invitation.create({
      data: {
        organizationId: organizations[1].id, // Moonbeam Network
        email: users[5].email, // frank.acala@example.com
        role: "owner",
        status: "rejected",
        inviterId: users[5].id,
        expiresAt: daysFromNow(25),
      },
    }),
    // ACCEPTED claim - Emma's claim was approved (for test 11.13 verification)
    prisma.invitation.create({
      data: {
        organizationId: organizations[2].id, // Acala Foundation
        email: users[4].email, // emma.moonbeam@example.com
        role: "owner",
        status: "accepted",
        inviterId: users[4].id,
        expiresAt: daysFromNow(28),
      },
    }),
  ]);

  console.log(`✅ Created ${organizationClaims.length} organization claims (seeded for Phase 11 testing)`);

  const notificationSettings = await Promise.all(
    users.slice(0, 3).flatMap((user) => [
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          channel: "EMAIL",
          type: "GRANT_APP_UPDATE",
          isEnabled: true,
        },
      }),
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          channel: "EMAIL",
          type: "COMMENT_REPLY",
          isEnabled: true,
        },
      }),
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          channel: "EMAIL",
          type: "NEW_BOUNTY_MATCHING_SKILLS",
          isEnabled: true,
        },
      }),
    ])
  );

  console.log(
    `✅ Created ${notificationSettings.length} notification settings`
  );

  console.log("🎉 Database seeded successfully!");
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
