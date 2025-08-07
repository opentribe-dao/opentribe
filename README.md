# Opentribe - The Talent Layer for Polkadot

Opentribe is a centralized talent marketplace for the Polkadot ecosystem, serving as the "Talent Layer" that connects organizations with skilled contributors. The platform consolidates official Polkadot Grant opportunities and enables ecosystem projects to post and manage multi-winner bounties.

## 🚀 Features

### For Builders
- **Browse Opportunities**: Discover grants, bounties, and RFPs from across the Polkadot ecosystem
- **Build Your Profile**: Showcase your skills, experience, and contributions
- **Apply & Submit**: Apply for grants and submit work to bounties with transparent tracking
- **Get Recognized**: Earn likes and build your reputation through quality contributions

### For Organizations & DAOs
- **Post Bounties**: Create multi-winner bounties with tiered rewards
- **Manage Submissions**: Review, select winners, and track payments in one place
- **Build Your Team**: Find and engage talented contributors for your projects
- **Organization Management**: Invite team members and manage roles

### For Grant Curators
- **Publish RFPs**: Create official Request for Proposals to guide applicants
- **Manage Applications**: Review and process grant applications efficiently
- **Track Interest**: See community engagement through votes and comments

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (wallet, Google, GitHub)
- **Styling**: Tailwind CSS + Glass UI design system
- **Deployment**: Vercel
- **Monorepo**: Turborepo with pnpm workspaces

## 📦 Project Structure

```
apps/
├── web/          # Public website (opentribe.io)
├── dashboard/    # Authenticated dashboard (admin.opentribe.io)
├── api/          # REST API (api.opentribe.io)
└── docs/         # Documentation site

packages/
├── auth/         # Better Auth integration
├── db/           # Database models and Prisma
├── base/         # UI components and design system
├── email/        # Transactional emails
└── ...           # Other shared packages
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ (v22 recommended)
- PostgreSQL 15+
- pnpm 8+

### Installation

1. Clone the repository:
```bash
git clone git@github.com:opentribe-dao/opentribe.git
cd opentribe
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create `.env.local` files in each app directory:
```bash
# apps/web/.env.local
DATABASE_URL="postgresql://[your-user]@localhost:5432/opentribe"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3002"
NEXT_PUBLIC_API_URL="http://localhost:3002"
# Add other required variables
```

4. Set up the database:
```bash
# Create database
createdb opentribe

# Push schema and seed data
pnpm db:push  # Run from project root
pnpm db:seed  # Adds test data
```

5. Start the development servers:
```bash
pnpm dev
```

### Access Points
- **Web**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **API**: http://localhost:3002
- **Docs**: http://localhost:3004

### Test Accounts
After running `pnpm db:seed`, use these credentials:
- `alice.rust@example.com` / `password123` - Builder
- `david.w3f@example.com` / `password123` - Org Admin (Web3 Foundation)
- `admin@opentribe.io` / `admin123` - Platform Superadmin

## 🔑 Key Models

- **Users**: Builders and organization members with profiles and skills
- **Organizations**: DAOs and projects that post opportunities
- **Grants**: Official grant programs with RFPs
- **Bounties**: Multi-winner tasks with tiered rewards
- **Submissions**: Work submitted to bounties
- **Applications**: Proposals submitted to grants

## 🧪 Testing

The project includes unit tests for core functionality including authentication, bounty management, submissions, and RFP workflows.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific app
pnpm test --filter=api
pnpm test --filter=dashboard
pnpm test --filter=web

# Run tests in watch mode for development
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

Tests are organized by module in the `__tests__` directory of each app:

```
apps/api/__tests__/
├── auth.test.ts       # Authentication and session management
├── bounties.test.ts   # Bounty CRUD operations
├── submissions.test.ts # Submission creation and winner selection
├── rfps.test.ts       # RFP creation and voting
└── health.test.ts     # Health check endpoint
```

### Writing Tests

We use [Vitest](https://vitest.dev/) for testing. Example test:

```typescript
import { describe, test, expect } from 'vitest';

describe('Bounty Management', () => {
  test('should create a new bounty', async () => {
    // Test implementation
  });
});
```

### Test Coverage

Core modules with test coverage:
- ✅ Authentication (session management, role-based access)
- ✅ Bounty Management (CRUD, filtering, status updates)
- ✅ Submission System (creation, winner selection, payment tracking)
- ✅ RFP Flow (creation, voting, comments)
- 🚧 Grant Applications (in progress)
- 🚧 Organization Management (in progress)

## 🐳 Docker Setup (Optional)

For containerized development:

```bash
# Start all services in Docker
docker compose up -d

# Stop all services
docker compose down
```

Note: Local development (without Docker) is recommended for better performance.

## 📝 Common Commands

```bash
# Development
pnpm dev          # Start all services locally
pnpm build        # Build all packages
pnpm lint         # Run linting
pnpm format       # Format code with Biome

# Database
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed test data
pnpm db:studio    # Open Prisma Studio GUI

# Testing
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

[License information to be added]

## 🔗 Links

- **Production**: https://opentribe.io
- **Dashboard**: https://admin.opentribe.io
- **API**: https://api.opentribe.io
- **Documentation**: https://docs.opentribe.io

---

Built with ❤️ for the Polkadot ecosystem
