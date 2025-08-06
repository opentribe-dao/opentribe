import { describe, expect, test, vi, beforeEach } from 'vitest';
import { POST as createSubmission } from '../app/api/v1/bounties/[id]/submissions/route';
import { POST as announceWinners } from '../app/api/v1/bounties/[id]/winners/route';
import { database } from '@packages/db';
import { auth } from '@packages/auth/server';

// Mock database
vi.mock('@packages/db', () => ({
  database: {
    bounty: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    submission: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

// Mock email package
vi.mock('@packages/email', () => ({
  sendEmail: vi.fn(),
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
        deadline: new Date('2025-12-31'),
      };

      const mockSubmission = {
        id: 'submission-1',
        bountyId: 'bounty-1',
        submitterId: 'user-123',
        title: 'My Submission',
        description: 'Submission description',
        submissionUrl: 'https://github.com/user/repo',
        attachments: [],
        responses: {},
        createdAt: new Date(),
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);
      vi.mocked(database.submission.create).mockResolvedValue(mockSubmission);

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
        },
      };

      const mockBounty = {
        id: 'bounty-1',
        status: 'CLOSED',
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);

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

      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

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
        organizationId: 'org-1',
        organization: {
          id: 'org-1',
          members: [
            {
              userId: 'org-admin',
              role: 'OWNER',
            },
          ],
        },
        winnersAnnouncedAt: null,
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);
      vi.mocked(database.submission.updateMany).mockResolvedValue({ count: 3 });
      vi.mocked(database.bounty.update).mockResolvedValue({
        ...mockBounty,
        winnersAnnouncedAt: new Date(),
      });

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
        organizationId: 'org-1',
        organization: {
          id: 'org-1',
          members: [
            {
              userId: 'org-admin',
              role: 'OWNER',
            },
          ],
        },
        winnersAnnouncedAt: new Date('2025-01-01'),
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.bounty.findUnique).mockResolvedValue(mockBounty);

      const body = JSON.stringify({
        winners: [
          { submissionId: 'sub-1', position: 1, amount: 500 },
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