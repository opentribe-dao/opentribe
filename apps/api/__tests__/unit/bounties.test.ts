import { describe, expect, test, vi, beforeEach } from 'vitest';
import { database } from '@packages/db';
import { auth } from '@packages/auth/server';

// Import the actual route handlers
import { GET as getBounties } from '../../app/api/v1/bounties/route';
import { GET as getBounty } from '../../app/api/v1/bounties/[id]/route';

describe('Bounty API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/bounties', () => {
    test('should return list of public bounties', async () => {
      // Arrange
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
          skills: ['React', 'TypeScript'],
          winnings: {},
          deadline: new Date('2025-12-31'),
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: 'org-1',
          publishedAt: new Date(),
          winnersAnnouncedAt: null,
          organization: {
            id: 'org-1',
            name: 'Test Org',
            slug: 'test-org',
            logo: null,
            location: 'Remote',
            industry: ['Tech'],
          },
          _count: {
            submissions: 5,
          },
        },
      ];

      // Mock the database call
      (database.bounty.findMany as any).mockResolvedValue(mockBounties);

      // Act
      const request = new Request('http://localhost:3002/api/v1/bounties');
      const response = await getBounties(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.bounties).toHaveLength(1);
      expect(data.bounties[0].title).toBe('Test Bounty 1');
      expect(database.bounty.findMany).toHaveBeenCalledTimes(1);
    });

    test('should filter bounties by status', async () => {
      // Arrange
      const mockBounties = [
        {
          id: 'bounty-1',
          title: 'Open Bounty',
          status: 'OPEN',
          visibility: 'PUBLIC',
          slug: 'open-bounty',
          description: 'Test',
          amount: 1000,
          token: 'USD',
          skills: [],
          winnings: {},
          deadline: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: 'org-1',
          publishedAt: new Date(),
          winnersAnnouncedAt: null,
          organization: {
            id: 'org-1',
            name: 'Org',
            slug: 'org',
            logo: null,
            location: null,
            industry: [],
          },
          _count: { submissions: 0 },
        },
      ];

      (database.bounty.findMany as any).mockResolvedValue(mockBounties);

      // Act
      const request = new Request('http://localhost:3002/api/v1/bounties?status=OPEN');
      const response = await getBounties(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.bounties[0].status).toBe('OPEN');
      expect(database.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'OPEN',
          }),
        })
      );
    });
  });

  describe('GET /api/v1/bounties/[id]', () => {
    test('should return bounty details with submissions', async () => {
      // Arrange
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
        skills: ['JavaScript', 'React'],
        deadline: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'org-1',
        publishedAt: new Date(),
        winnersAnnouncedAt: null,
        screening: [],
        resources: [],
        organization: {
          id: 'org-1',
          name: 'Test Organization',
          slug: 'test-org',
          logo: null,
          location: 'Remote',
          industry: ['Tech'],
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
              avatarUrl: null,
            },
          },
        ],
        _count: {
          submissions: 1,
        },
      };

      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);

      // Act
      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1');
      const response = await getBounty(request, { params: Promise.resolve({ id: 'bounty-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.bounty.id).toBe('bounty-1');
      expect(data.bounty.title).toBe('Test Bounty');
      expect(data.bounty.submissions).toHaveLength(1);
      expect(database.bounty.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            OR: [
              { id: 'bounty-1' },
              { slug: 'bounty-1' }
            ]
          },
        })
      );
    });

    test('should return 404 for non-existent bounty', async () => {
      // Arrange
      (database.bounty.findFirst as any).mockResolvedValue(null);

      // Act
      const request = new Request('http://localhost:3002/api/v1/bounties/invalid-id');
      const response = await getBounty(request, { params: Promise.resolve({ id: 'invalid-id' }) });

      // Assert
      expect(response.status).toBe(404);
      expect(database.bounty.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});