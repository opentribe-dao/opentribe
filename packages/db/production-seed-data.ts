export const productionSeedOrganization = {
  name: 'Web3 Foundation',
  slug: 'web3-foundation',
  headline: 'Funding the decentralized web',
  description:
    'The Web3 Foundation nurtures and stewards technologies and applications in the fields of decentralized web software protocols.',
  logo: 'https://avatars.githubusercontent.com/u/30405397',
  twitter: 'web3foundation',
  github: 'w3f',
  websiteUrl: 'https://web3.foundation',
  location: 'Zug, Switzerland',
  isVerified: true,
  visibility: 'VERIFIED',
  orgType: 'FOUNDATION',
  managedByPlatform: true,
  claimableBy: 'github:w3f',
  ecosystemSource: 'W3F_GRANTS',
} as const;

export const productionSeedGrants = [
  {
    title: 'Proof of Personhood Bounty',
    slug: 'proof-of-personhood-bounty',
    externalId: 'kusama:proof-of-personhood-bounty',
    fundingSource: 'TREASURY',
    onChainRef: 'kusama-referenda-498',
    onChainRefUrl: 'https://kusama.subsquare.io/referenda/498',
    summary:
      'Funding Proof of Personhood systems that resist Sybil attacks while preserving privacy on Kusama',
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
    resources: [
      {
        title: 'Original Grant Website',
        url: 'https://k51qzi5uqu5dk1h0t1ofq49oww8ykmcnsxl1h3m0d41pb58eog9f9yjjwxnnwh.ipns.dweb.link/',
        description: 'Primary source for the Proof of Personhood grant',
      },
      {
        title: 'On-chain Reference',
        url: 'https://kusama.subsquare.io/referenda/498',
        description: 'Kusama Subsquare reference for the bounty',
      },
    ],
    skills: [
      'identity',
      'privacy',
      'cryptography',
      'sybil-resistance',
      'decentralized-systems',
    ],
    token: 'DOT',
    status: 'OPEN',
    visibility: 'PUBLISHED',
    source: 'EXTERNAL',
    applicationUrl: 'https://formstr.app/i/kusama-pop',
    publishedOffsetDays: -3,
    instructions: 'Rolling applications — no deadline. Each proposal is evaluated individually by the curatorial committee. Part of the Kusama Vision initiative funded by Web3 Foundation.',
  },
  {
    title: 'Kusama ZK Bounty',
    slug: 'kusama-zk-bounty',
    externalId: 'kusama:kusama-zk-bounty',
    fundingSource: 'TREASURY',
    onChainRef: 'kusama-referenda-507',
    onChainRefUrl: 'https://kusama.subsquare.io/referenda/507',
    summary:
      'Funding zero-knowledge proof integration across Kusama runtimes, smart contracts, and applications',
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
    resources: [
      {
        title: 'Original Grant Website',
        url: 'https://zk.kusama.vision/#apply',
        description: 'Primary source for the Kusama ZK grant',
      },
      {
        title: 'Community',
        url: 'https://matrix.to/#/#kusama-zk:virto.community',
        description: 'Community channel for the Kusama ZK bounty',
      },
    ],
    skills: [
      'zero-knowledge',
      'cryptography',
      'privacy',
      'smart-contracts',
      'rust',
    ],
    token: 'DOT',
    status: 'OPEN',
    visibility: 'PUBLISHED',
    source: 'EXTERNAL',
    applicationUrl:
      'https://puffy-xylophone-2a5.notion.site/95b593191de28385bf208189cec1887b',
    publishedOffsetDays: -5,
    instructions: 'Rolling applications — no deadline. Proposals evaluated on technical merit, feasibility, and ecosystem contribution. Part of the Kusama Vision initiative.',
  },
  {
    title: 'KSM Art & Social Experiments Initiative',
    slug: 'ksm-art-social-experiments',
    externalId: 'kusama:ksm-art-social-experiments',
    fundingSource: 'TREASURY',
    onChainRef: 'kusama-referenda-404',
    onChainRefUrl: 'https://kusama.subsquare.io/referenda/404',
    summary:
      'Funding artistic and social experiments exploring cypherpunk themes on Kusama',
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
    resources: [
      {
        title: 'Original Grant Website',
        url: 'https://art.ksm.vision/#participate',
        description: 'Primary source for the Kusama art grant',
      },
      {
        title: 'Full Terms',
        url: 'https://art.ksm.vision/basis-terms/',
        description: 'Terms and participation details for the initiative',
      },
    ],
    skills: ['art', 'design', 'research', 'social-experiments', 'content-creation'],
    token: 'DOT',
    minAmount: 1_000,
    maxAmount: 10_000,
    status: 'OPEN',
    visibility: 'PUBLISHED',
    source: 'EXTERNAL',
    applicationUrl: 'https://ksmart.notion.site',
    publishedOffsetDays: -7,
    instructions: 'Rolling applications — no deadline. Primarily funding projects up to $10,000 USD paid in DOT. Larger proposals considered case-by-case. Submit a single PDF (max 15 pages).',
  },
] as const;

export const productionSeedRfps = [
  {
    title: 'KryptOS - Total Privacy Operating System',
    slug: '000-privacy-os',
    description:
      'Original Kusama Vision RFP linked to the Kusama ZK grant program.',
    grantSlug: 'kusama-zk-bounty',
    status: 'OPEN',
    visibility: 'PUBLISHED',
    publishedOffsetDays: -30,
    resources: [
      {
        title: 'Original RFP Website',
        url: 'https://zk.kusama.vision/rfps/#000-privacy-os',
        description: 'Primary published RFP page',
      },
      {
        title: 'Source Markdown',
        url: 'https://codeberg.org/kusama-zk/RFPs/src/branch/main/rfp/000-privacy-os.md',
        description: 'Original markdown source for the RFP',
      },
    ],
  },
] as const;
