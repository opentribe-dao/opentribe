import { describe, expect, test, vi, beforeEach } from 'vitest';
import { POST as createSubmission } from '../app/api/v1/bounties/[id]/submissions/route';
import { POST as announceWinners } from '../app/api/v1/bounties/[id]/winners/route';
import { database } from '@packages/db';
import { auth } from '@packages/auth/server';

// Mock email package
vi.mock('@packages/email', () => ({
  sendBountyWinnerEmail: vi.fn().mockResolvedValue(true),
}));

// Mock auth
vi.mock('@packages/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock email package
vi.mock('@packages/email', () => ({
  sendBountyFirstSubmissionEmail: vi.fn().mockResolvedValue(true),
  sendEmail: vi.fn().mockResolvedValue(true),
  emailTemplates: {},
}));

describe('Submission System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/bounties/[id]/submissions', () => {
    test('should create a new submission for authenticated user', async () => {
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
        visibility: 'PUBLISHED',
        organizationId: 'org-1',
        deadline: new Date('2025-12-31'),
      };

      const mockSubmission = {
        id: 'submission-1',
        bountyId: 'bounty-1',
        userId: 'user-123',
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
          avatarUrl: 'avatar.png',
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);
      vi.mocked(database.submission.findFirst).mockResolvedValue(null); // No existing submission
      vi.mocked(database.submission.create).mockResolvedValue(mockSubmission);
      vi.mocked(database.bounty.update).mockResolvedValue({ ...mockBounty, submissionCount: 1 });
      vi.mocked(database.submission.count).mockResolvedValue(1); // First submission
      vi.mocked(database.member.findMany).mockResolvedValue([]); // No members to email

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

      expect(response.status).toBe(201);
      expect(data.submission.id).toBe('submission-1');
      expect(data.submission.title).toBe('My Submission');
    });

    test('should reject submission for closed bounty', async () => {
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
        status: 'CLOSED',
        visibility: 'PUBLISHED',
        deadline: new Date('2025-12-31'),
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);

      const body = JSON.stringify({
        submissionUrl: 'https://github.com/user/repo',
        title: 'My Submission',
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createSubmission(request, { params: Promise.resolve({ id: 'bounty-1' }) });

      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const body = JSON.stringify({
        submissionUrl: 'https://github.com/user/repo',
        title: 'My Submission',
      });

      const request = new Request('http://localhost:3002/api/v1/bounties/bounty-1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createSubmission(request, { params: Promise.resolve({ id: 'bounty-1' }) });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/bounties/[id]/winners', () => {
    test('should announce winners for bounty', async () => {
      const mockSession = {
        user: {
          id: 'org-admin',
          email: 'admin@org.com',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        title: 'Test Bounty',
        status: 'REVIEWING',
        amount: 1000,
        winnings: { '1': 500, '2': 300, '3': 200 },
        token: 'USDT',
        organization: {
          id: 'org-1',
          members: [
            {
              userId: 'org-admin',
              role: 'admin',
            },
          ],
        },
      };

      const mockSubmissions = [
        {
          id: 'submission-1',
          bountyId: 'bounty-1',
          userId: 'user-1',
          status: 'SUBMITTED',
        },
        {
          id: 'submission-2',
          bountyId: 'bounty-1',
          userId: 'user-2',
          status: 'SUBMITTED',
        },
        {
          id: 'submission-3',
          bountyId: 'bounty-1',
          userId: 'user-3',
          status: 'SUBMITTED',
        },
      ];

      const mockUpdatedBounty = {
        ...mockBounty,
        status: 'COMPLETED',
        winnersAnnouncedAt: new Date(),
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

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);
      vi.mocked(database.submission.findMany).mockResolvedValue(mockSubmissions);
      vi.mocked(database.submission.updateMany).mockResolvedValue({ count: 3 });
      vi.mocked(database.bounty.update).mockResolvedValue(mockUpdatedBounty);
      // Mock the database transaction
      vi.mocked(database.$transaction).mockImplementation((fn) => fn(database));

      const body = JSON.stringify({
        winners: [
          { submissionId: 'submission-1', position: 1, amount: 500 },
          { submissionId: 'submission-2', position: 2, amount: 300 },
          { submissionId: 'submission-3', position: 3, amount: 200 },
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

      expect(response.status).toBe(200);
      expect(data.message).toBe('Winners announced successfully');
    });

    test('should prevent announcing winners twice', async () => {
      const mockSession = {
        user: {
          id: 'org-admin',
          email: 'admin@org.com',
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        title: 'Test Bounty',
        winnersAnnounced: true,
        organization: {
          id: 'org-1',
          members: [
            {
              userId: 'org-admin',
              role: 'admin',
            },
          ],
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);

      const body = JSON.stringify({
        winners: [
          { submissionId: 'submission-1', position: 1 },
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

      expect(response.status).toBe(400);
    });
  });
});
