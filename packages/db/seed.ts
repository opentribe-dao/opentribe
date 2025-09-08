import { database as prisma } from './index';

async function main() {
  console.log('🌱 Starting database seed...');

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
    // Don't delete sessions, accounts, or users - they're managed by seed-auth.ts
  ]);

  // Get existing users created by seed-auth.ts
  // If running seed.ts standalone, it will fail - run seed-auth.ts first!
  const userEmails = [
    'alice.rust@example.com',
    'bob.ui@example.com',
    'carol.writer@example.com',
    'david.w3f@example.com',
    'emma.moonbeam@example.com',
    'frank.acala@example.com',
    'admin@opentribe.io',
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
        name: 'Web3 Foundation',
        slug: 'web3-foundation',
        headline: 'Funding the decentralized web',
        description:
          'The Web3 Foundation nurtures and stewards technologies and applications in the fields of decentralized web software protocols.',
        logo: 'https://web3.foundation/images/w3f-logo.svg',
        twitter: 'web3foundation',
        github: 'w3f',
        websiteUrl: 'https://web3.foundation',
        location: 'Zug, Switzerland',
        isVerified: true,
        visibility: 'VERIFIED',
        members: {
          create: {
            userId: users[3].id, // David
            role: 'owner',
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Moonbeam Network',
        slug: 'moonbeam',
        headline: 'Ethereum-compatible smart contract platform on Polkadot',
        description:
          'Moonbeam is a smart contract platform for building cross-chain connected applications that can access users, assets, and services on any chain.',
        twitter: 'MoonbeamNetwork',
        github: 'PureStake',
        websiteUrl: 'https://moonbeam.network',
        location: 'Boston, USA',
        isVerified: true,
        visibility: 'VERIFIED',
        members: {
          create: {
            userId: users[4].id, // Emma
            role: 'owner',
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Acala Network',
        slug: 'acala',
        headline: 'The DeFi Hub of Polkadot',
        description:
          'Acala is the all-in-one DeFi hub of Polkadot. A blockchain platform for financial applications to use smart contracts or built-in protocols.',
        twitter: 'AcalaNetwork',
        github: 'AcalaNetwork',
        websiteUrl: 'https://acala.network',
        location: 'Global',
        isVerified: true,
        visibility: 'VERIFIED',
        members: {
          create: {
            userId: users[5].id, // Frank
            role: 'owner',
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Community DAO',
        slug: 'community-dao',
        headline: 'Supporting grassroots Polkadot initiatives',
        description:
          'A community-driven organization supporting small but impactful projects in the Polkadot ecosystem.',
        isVerified: false,
        visibility: 'ACTIVE',
        members: {
          create: [
            {
              userId: users[1].id, // Bob
              role: 'owner',
            },
            {
              userId: users[2].id, // Carol
              role: 'admin',
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
        title: 'Decentralized Futures Program',
        slug: 'decentralized-futures-2024',
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
        logoUrl: 'https://futures.web3.foundation/logo.png',
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
            title: 'Program Overview',
            url: 'https://futures.web3.foundation',
            description: 'Official program website',
          },
          {
            title: 'Application Guide',
            url: 'https://futures.web3.foundation/apply',
            description: 'Step-by-step application instructions',
          },
          {
            title: 'FAQ',
            url: 'https://futures.web3.foundation/faq',
            description: 'Frequently asked questions',
          },
        ],
        skills: [
          'Rust',
          'Substrate',
          'Smart Contracts',
          'Infrastructure',
          'DeFi',
          'Tooling',
        ],
        minAmount: 50000,
        maxAmount: 500000,
        totalFunds: 45000000,
        token: 'DOT',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        source: 'NATIVE',
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-2),
        viewCount: 342,
        applicationCount: 28,
      },
    }),
    prisma.grant.create({
      data: {
        title: 'Web3 Foundation Open Grants',
        slug: 'w3f-open-grants',
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
          'Technical grants for Polkadot and Substrate development projects',
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
            title: 'Application Template',
            url: 'https://github.com/w3f/Grants-Program/blob/master/applications/template.md',
          },
          {
            title: 'Grant Guidelines',
            url: 'https://grants.web3.foundation/docs/Process/how-to-apply',
          },
        ],
        skills: [
          'Rust',
          'TypeScript',
          'Documentation',
          'Testing',
          'Open Source',
        ],
        minAmount: 10000,
        maxAmount: 100000,
        totalFunds: 10000000,
        token: 'DOT',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        source: 'NATIVE',
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-4),
        viewCount: 523,
        applicationCount: 45,
      },
    }),

    // Moonbeam Grants
    prisma.grant.create({
      data: {
        title: 'Moonbeam Ecosystem Grants',
        slug: 'moonbeam-ecosystem-grants',
        description: `The Moonbeam Grants Program accelerates the growth of the Moonbeam ecosystem by funding projects that enhance our cross-chain connected contracts platform.

We support projects building:
- Cross-chain dApps leveraging Moonbeam's interoperability
- DeFi protocols and infrastructure
- NFT platforms and marketplaces
- Developer tools and integrations
- Educational content and resources

Moonbeam's Ethereum compatibility combined with Polkadot's cross-chain features creates unique opportunities for innovative applications.`,
        summary: 'Funding cross-chain dApps and tools on Moonbeam',
        instructions: `Submit your application through our grants portal with:
- Project overview and objectives
- Technical architecture
- Team background
- Development roadmap
- Budget breakdown
- How you'll leverage Moonbeam's unique features`,
        skills: ['Solidity', 'Web3.js', 'Cross-chain', 'DeFi', 'NFTs'],
        minAmount: 5000,
        maxAmount: 50000,
        token: 'GLMR',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        source: 'NATIVE',
        organizationId: organizations[1].id,
        publishedAt: daysFromNow(-10),
        viewCount: 287,
        applicationCount: 19,
      },
    }),

    // Acala Grants
    prisma.grant.create({
      data: {
        title: 'aUSD Ecosystem Fund',
        slug: 'ausd-ecosystem-fund',
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
        logoUrl: 'https://acala.network/ausd-logo.png',
        minAmount: 25000,
        maxAmount: 1000000,
        totalFunds: 250000000,
        token: 'aUSD',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        source: 'NATIVE',
        organizationId: organizations[2].id,
        publishedAt: daysFromNow(-8),
        viewCount: 412,
        applicationCount: 33,
        skills: ['DeFi', 'Rust', 'Solidity', 'Cross-chain', 'Stablecoins'],
      },
    }),
  ]);

  console.log(`✅ Created ${grants.length} grants`);

  // Create realistic bounties
  const bounties = await Promise.all([
    prisma.bounty.create({
      data: {
        title: 'Polkadot.js Extension UI/UX Improvements',
        slug: 'polkadotjs-extension-ui',
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
            title: 'Current Extension',
            url: 'https://github.com/polkadot-js/extension',
            description: 'Source code',
          },
          {
            title: 'Design Guidelines',
            url: 'https://polkadot.network/brand',
            description: 'Polkadot brand assets',
          },
        ],
        skills: ['UI/UX Design', 'React', 'TypeScript', 'Browser Extensions'],
        amount: 15000,
        token: 'DOT',
        winnings: { '1': 8000, '2': 5000, '3': 2000 },
        split: 'FIXED',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        deadline: daysFromNow(15),
        organizationId: organizations[0].id,
        publishedAt: daysFromNow(-9),
        viewCount: 156,
        submissionCount: 8,
      },
    }),
    prisma.bounty.create({
      data: {
        title: 'Create Substrate Pallet Tutorial Series',
        slug: 'substrate-pallet-tutorials',
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
        skills: ['Technical Writing', 'Rust', 'Substrate', 'Documentation'],
        amount: 10000,
        token: 'DOT',
        split: 'EQUAL_SPLIT',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        deadline: daysFromNow(20),
        organizationId: organizations[3].id,
        publishedAt: daysFromNow(-5),
        viewCount: 98,
        submissionCount: 5,
      },
    }),
    prisma.bounty.create({
      data: {
        title: 'Cross-chain DEX Aggregator Research',
        slug: 'cross-chain-dex-research',
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
        skills: ['DeFi', 'Research', 'Cross-chain', 'Technical Writing'],
        amount: 7500,
        token: 'DOT',
        winnings: { '1': 5000, '2': 2500 },
        split: 'FIXED',
        status: 'OPEN',
        visibility: 'PUBLISHED',
        deadline: daysFromNow(12),
        organizationId: organizations[2].id,
        publishedAt: daysFromNow(-12),
        viewCount: 73,
        submissionCount: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${bounties.length} bounties`);

  // Create RFPs for grants
  const rfps = await Promise.all([
    prisma.rFP.create({
      data: {
        title: 'XCM v3 Developer Tooling',
        slug: 'xcm-v3-developer-tools',
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
            title: 'XCM Format',
            url: 'https://github.com/paritytech/xcm-format',
            description: 'XCM specification',
          },
          {
            title: 'XCM Docs',
            url: 'https://wiki.polkadot.network/docs/learn-xcm',
            description: 'Official documentation',
          },
        ],
        grantId: grants[0].id,
        status: 'OPEN',
        visibility: 'PUBLISHED',
        publishedAt: daysFromNow(-2),
        viewCount: 89,
        voteCount: 24,
      },
    }),
    prisma.rFP.create({
      data: {
        title: 'Substrate Light Client Libraries',
        slug: 'substrate-light-clients',
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
        status: 'OPEN',
        visibility: 'PUBLISHED',
        publishedAt: daysFromNow(-8),
        viewCount: 112,
        voteCount: 31,
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
        title: 'XCM Studio - Visual Cross-chain Development Platform',
        summary:
          'A comprehensive IDE for building, testing, and deploying XCM programs with visual tools',
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
          { milestone: 'Architecture & Design', date: 'Month 1' },
          { milestone: 'Core Engine Development', date: 'Month 2-3' },
          { milestone: 'Visual Builder Implementation', date: 'Month 4-5' },
          { milestone: 'Testing Framework', date: 'Month 6' },
          { milestone: 'Documentation & Launch', date: 'Month 7' },
        ],
        budget: 250000,
        status: 'SUBMITTED',
        submittedAt: daysFromNow(1),
        likesCount: 15,
        viewsCount: 67,
      },
    }),
    prisma.grantApplication.create({
      data: {
        userId: users[2].id, // Carol
        grantId: grants[1].id,
        title: 'Substrate by Example - Interactive Learning Platform',
        summary:
          'An interactive tutorial platform teaching Substrate development through hands-on examples',
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
        budget: 75000,
        status: 'UNDER_REVIEW',
        label: 'Reviewed',
        submittedAt: daysFromNow(-10),
        reviewedAt: daysFromNow(-5),
        likesCount: 23,
        viewsCount: 134,
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
        title: 'Polkadot.js Extension Redesign - Modern & Accessible',
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
          'https://github.com/bob_designer/polkadotjs-extension-redesign',
        responses: {
          figmaUrl: 'https://figma.com/file/xyz/polkadotjs-redesign',
          demoUrl: 'https://polkadotjs-redesign.vercel.app',
          userTestingResults:
            'https://docs.google.com/document/d/testing-results',
        },
        status: 'SUBMITTED',
        submittedAt: daysFromNow(5),
        likesCount: 42,
        viewsCount: 189,
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: bounties[1].id,
        userId: users[2].id, // Carol
        title: 'Substrate Pallet Development Masterclass',
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
        submissionUrl: 'https://substrate-masterclass.dev',
        status: 'SUBMITTED',
        submittedAt: daysFromNow(8),
        likesCount: 38,
        viewsCount: 156,
      },
    }),
  ]);

  console.log(`✅ Created ${submissions.length} bounty submissions`);

  // Create some comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        body: 'This is exactly what the ecosystem needs! The visual builder approach will make XCM accessible to so many more developers. Looking forward to seeing this implemented.',
        authorId: users[4].id, // Emma
        applicationId: applications[0].id,
        type: 'NORMAL',
      },
    }),
    prisma.comment.create({
      data: {
        body: 'Great proposal! Have you considered integrating with existing XCM monitoring tools? It would be valuable to see real-time message execution on live networks too.',
        authorId: users[3].id, // David
        applicationId: applications[0].id,
        type: 'NORMAL',
      },
    }),
    prisma.comment.create({
      data: {
        body: 'The design looks amazing! I especially love the transaction flow improvements. This will definitely reduce user errors during signing.',
        authorId: users[2].id, // Carol
        submissionId: submissions[0].id,
        type: 'NORMAL',
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
        direction: 'UP',
      },
    }),
    prisma.vote.create({
      data: {
        userId: users[1].id,
        rfpId: rfps[0].id,
        direction: 'UP',
      },
    }),
    prisma.vote.create({
      data: {
        userId: users[2].id,
        rfpId: rfps[1].id,
        direction: 'UP',
      },
    }),
  ]);

  console.log(`✅ Created ${votes.length} votes`);

  // Create notification settings for users
  const notificationSettings = await Promise.all(
    users.slice(0, 3).flatMap((user) => [
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          channel: 'EMAIL',
          type: 'GRANT_APP_UPDATE',
          isEnabled: true,
        },
      }),
      prisma.notificationSetting.create({
        data: {
          userId: user.id,
          channel: 'EMAIL',
          type: 'COMMENT_REPLY',
          isEnabled: true,
        },
      }),
    ])
  );

  console.log(
    `✅ Created ${notificationSettings.length} notification settings`
  );

  console.log('🎉 Database seeded successfully!');
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
