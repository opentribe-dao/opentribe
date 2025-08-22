import { describe, expect, test, vi, beforeEach } from 'vitest';
import { database } from '@packages/db';
import { auth } from '@packages/auth/server';
import { POST as createSubmission } from '../../app/api/v1/bounties/[id]/submissions/route';
import { POST as announceWinners } from '../../app/api/v1/bounties/[id]/winners/route';

// Mock email package
vi.mock('@packages/email', () => ({
  sendBountyFirstSubmissionEmail: vi.fn().mockResolvedValue(true),
  sendBountyWinnerEmail: vi.fn().mockResolvedValue(true),
}));

describe('Submission System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/bounties/[id]/submissions', () => {
    test('should create a submission for authenticated user', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'submitter@example.com',
          username: 'submitter',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        title: 'Test Bounty',
        status: 'OPEN',
        visibility: 'PUBLISHED', // Correct field name
        organizationId: 'org-1',
        deadline: new Date('2025-12-31'),
      };

      const mockSubmission = {
        id: 'submission-1',
        bountyId: 'bounty-1',
        userId: 'user-123', // Correct field name
        title: 'My Submission',
        description: 'Submission description',
        submissionUrl: 'https://github.com/user/repo',
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submitter: {
          id: 'user-123',
          username: 'submitter',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null); // No existing submission
      (database.submission.create as any).mockResolvedValue(mockSubmission);
      (database.bounty.update as any).mockResolvedValue({ ...mockBounty, submissionCount: 1 });
      (database.submission.count as any).mockResolvedValue(1);
      (database.member.findMany as any).mockResolvedValue([]); // No members to email

      // Act
      const body = JSON.stringify({
        submissionUrl: 'https://github.com/user/repo',
        title: 'My Submission',
        description: 'Submission description',
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createSubmission(request, { params: Promise.resolve({ id: 'bounty-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.submission.id).toBe('submission-1');
      expect(data.submission.title).toBe('My Submission');
      expect(database.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bountyId: 'bounty-1',
            userId: 'user-123', // Correct field name
            submissionUrl: 'https://github.com/user/repo',
            title: 'My Submission',
            description: 'Submission description',
          }),
        })
      );
    });

    test('should reject submission if user not authenticated', async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({
        submissionUrl: 'https://github.com/user/repo',
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createSubmission(request, { params: Promise.resolve({ id: 'bounty-1' }) });

      // Assert
      expect(response.status).toBe(401);
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test('should reject submission for closed bounty', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'submitter@example.com',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        status: 'CLOSED',
        visibility: 'PUBLISHED',
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        submissionUrl: 'https://github.com/user/repo',
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createSubmission(request, { params: Promise.resolve({ id: 'bounty-1' }) });

      // Assert
      expect(response.status).toBe(400);
      expect(database.submission.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/bounties/[id]/winners', () => {
    test('should announce winners for organization owner', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'org-admin',
          email: 'admin@org.com',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        organizationId: 'org-1',
        status: 'REVIEWING',
        amount: 1000,
        winnings: { '1': 500, '2': 300, '3': 200 },
        token: 'USDT',
        organization: {
          id: 'org-1',
          members: [
            {
              userId: 'org-admin',
              role: 'owner', // Lowercase as per the route check
            },
          ],
        },
      };

      const mockSubmissions = [
        { id: 'sub-1', bountyId: 'bounty-1', userId: 'user-1', status: 'SUBMITTED' },
        { id: 'sub-2', bountyId: 'bounty-1', userId: 'user-2', status: 'SUBMITTED' },
        { id: 'sub-3', bountyId: 'bounty-1', userId: 'user-3', status: 'SUBMITTED' },
      ];

      const mockUpdatedBounty = {
        ...mockBounty,
        winnersAnnouncedAt: new Date(),
        status: 'COMPLETED',
        organization: { id: 'org-1', name: 'Test Org', logo: null },
        _count: { submissions: 3, comments: 0 },
        submissions: mockSubmissions.map((s, i) => ({
          ...s,
          isWinner: true,
          position: i + 1,
          winningAmount: [500, 300, 200][i],
          submitter: { 
            id: s.userId, 
            username: `user${i + 1}`, 
            firstName: 'User', 
            lastName: `${i + 1}`, 
            email: `user${i + 1}@test.com`, 
            avatarUrl: null 
          },
        })),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.submission.findMany as any).mockResolvedValue(mockSubmissions);
      (database.submission.updateMany as any).mockResolvedValue({ count: 3 });
      (database.bounty.update as any).mockResolvedValue(mockUpdatedBounty);
      (database.$transaction as any).mockImplementation((fn) => fn(database));

      // Act
      const body = JSON.stringify({
        winners: [
          { submissionId: 'sub-1', position: 1, amount: 500 },
          { submissionId: 'sub-2', position: 2, amount: 300 },
          { submissionId: 'sub-3', position: 3, amount: 200 },
        ],
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await announceWinners(request, { params: Promise.resolve({ id: 'bounty-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Winners announced successfully');
      expect(database.submission.updateMany).toHaveBeenCalledTimes(1); // Reset existing winners
    });

    test('should prevent non-members from announcing winners', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'non-member',
          email: 'user@example.com',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        organizationId: 'org-1',
        organization: {
          id: 'org-1',
          members: [], // User not in members
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        winners: [{ submissionId: 'sub-1', position: 1, amount: 500 }],
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await announceWinners(request, { params: Promise.resolve({ id: 'bounty-1' }) });

      // Assert
      expect(response.status).toBe(403);
      expect(database.submission.updateMany).not.toHaveBeenCalled();
    });
  });
});
