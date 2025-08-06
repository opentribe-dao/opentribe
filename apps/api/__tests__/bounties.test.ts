import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GET as getBounties } from '../app/api/v1/bounties/route';
import { GET as getBounty } from '../app/api/v1/bounties/[id]/route';
import { database } from '@packages/db';

// Mock database
vi.mock('@packages/db', () => ({
  database: {
    bounty: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    submission: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@packages/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe('Bounty Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/bounties', () => {
    test('should return list of public bounties', async () => {
      const mockBounties = [
        {
          id: 'bounty-1',
          title: 'Test Bounty 1',
          slug: 'test-bounty-1',
          description: 'Description 1',
          amount: 1000,
          token: 'USD',
          status: 'OPEN',
          visibility: 'PUBLIC',
          organization: {
            id: 'org-1',
            name: 'Test Org',
            slug: 'test-org',
          },
          _count: {
            submissions: 5,
          },
        },
        {
          id: 'bounty-2',
          title: 'Test Bounty 2',
          slug: 'test-bounty-2',
          description: 'Description 2',
          amount: 2000,
          token: 'USD',
          status: 'OPEN',
          visibility: 'PUBLIC',
          organization: {
            id: 'org-2',
            name: 'Test Org 2',
            slug: 'test-org-2',
          },
          _count: {
            submissions: 3,
          },
        },
      ];

      vi.mocked(database.bounty.findMany).mockResolvedValue(mockBounties);

      const request = new Request('http://localhost:3002/api/v1/bounties');
      const response = await getBounties(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounties).toHaveLength(2);
      expect(data.bounties[0].title).toBe('Test Bounty 1');
    });

    test('should filter bounties by status', async () => {
      const mockBounties = [
        {
          id: 'bounty-1',
          title: 'Open Bounty',
          status: 'OPEN',
          visibility: 'PUBLIC',
          organization: { id: 'org-1', name: 'Org', slug: 'org' },
          _count: { submissions: 0 },
        },
      ];

      vi.mocked(database.bounty.findMany).mockResolvedValue(mockBounties);

      const request = new Request('http://localhost:3002/api/v1/bounties?status=OPEN');
      const response = await getBounties(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounties).toHaveLength(1);
      expect(data.bounties[0].status).toBe('OPEN');
    });
  });

  describe('GET /api/v1/bounties/[id]', () => {
    test('should return bounty details with submissions', async () => {
      const mockBounty = {
        id: 'bounty-1',
        title: 'Test Bounty',
        slug: 'test-bounty',
        description: 'Detailed description',
        amount: 1000,
        token: 'USD',
        winnings: { '1': 500, '2': 300, '3': 200 },
        status: 'OPEN',
        visibility: 'PUBLIC',
        deadline: new Date('2025-12-31'),
        organization: {
          id: 'org-1',
          name: 'Test Organization',
          slug: 'test-org',
          logo: null,
        },
        submissions: [
          {
            id: 'sub-1',
            title: 'Submission 1',
            isWinner: false,
            position: null,
            winningAmount: null,
            submitter: {
              id: 'user-1',
              username: 'user1',
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
        _count: {
          submissions: 1,
        },
      };

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty);

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1');
      const response = await getBounty(request, { params: Promise.resolve({ id: 'bounty-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.id).toBe('bounty-1');
      expect(data.bounty.title).toBe('Test Bounty');
      expect(data.bounty.submissions).toHaveLength(1);
    });

    test('should return 404 for non-existent bounty', async () => {
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost:3002/api/v1/bounties/invalid-id');
      const response = await getBounty(request, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(response.status).toBe(404);
    });
  });
});