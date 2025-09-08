import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GET as getBounties } from '../app/api/v1/bounties/route';
import { GET as getBounty } from '../app/api/v1/bounties/[id]/route';
import { NextRequest } from 'next/server';
import { database } from '@packages/db';

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
          visibility: 'PUBLISHED',
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
          visibility: 'PUBLISHED',
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

      vi.mocked(database.bounty.findMany).mockResolvedValue(mockBounties as any);

      const request = new Request('http://localhost:3002/api/v1/bounties');
      const response = await getBounties(request as unknown as NextRequest);
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
          visibility: 'PUBLISHED',
          organization: { id: 'org-1', name: 'Org', slug: 'org' },
          _count: { submissions: 0 },
        },
      ];

      vi.mocked(database.bounty.findMany).mockResolvedValue(mockBounties as any);

      const request = new Request('http://localhost:3002/api/v1/bounties?status=OPEN');
      const response = await getBounties(request as unknown as NextRequest);
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
        visibility: 'PUBLISHED',
        deadline: new Date('2025-12-31'),
        winnersAnnouncedAt: new Date(), // This ensures submissions will be shown
        organization: {
          id: 'org-1',
          name: 'Test Organization',
          slug: 'test-org',
          logo: null,
          location: 'Test Location',
          industry: 'Tech',
        },
        submissions: [
          {
            id: 'sub-1',
            title: 'Submission 1',
            description: 'A great submission',
            submissionUrl: 'https://github.com/user/repo',
            position: 1,
            winningAmount: 500,
            isWinner: true,
            createdAt: new Date(),
            responses: {},
            status: 'SUBMITTED',
            likesCount: 5,
            submitter: {
              id: 'user-1',
              username: 'user1',
              firstName: 'John',
              lastName: 'Doe',
              avatarUrl: 'avatar.png',
            },
          },
        ],
        comments: [],
        _count: {
          submissions: 1,
          comments: 0,
        },
      };

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1');
      const response = await getBounty(request as unknown as NextRequest, { params: Promise.resolve({ id: 'bounty-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.id).toBe('bounty-1');
      expect(data.bounty.title).toBe('Test Bounty');
      expect(data.bounty.submissions).toHaveLength(1);
    });

    test('should return 404 for non-existent bounty', async () => {
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost:3002/api/v1/bounties/invalid-id');
      const response = await getBounty(request as unknown as NextRequest, { params: Promise.resolve({ id: 'invalid-id' }) });

      expect(response.status).toBe(404);
    });
  });
});
