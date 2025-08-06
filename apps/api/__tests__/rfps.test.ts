import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GET as getRFPs } from '../app/api/v1/rfps/route';
import { GET as getRFP } from '../app/api/v1/rfps/[id]/route';
import { POST as createRFP } from '../app/api/v1/organizations/[organizationId]/rfps/route';
import { database } from '@packages/db';
import { auth } from '@packages/auth/server';

// Mock database
vi.mock('@packages/db', () => ({
  database: {
    rfp: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
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

describe('RFP Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/rfps', () => {
    test('should return list of public RFPs', async () => {
      const mockRFPs = [
        {
          id: 'rfp-1',
          title: 'Test RFP 1',
          slug: 'test-rfp-1',
          description: 'RFP Description',
          status: 'OPEN',
          visibility: 'PUBLIC',
          grant: {
            id: 'grant-1',
            title: 'Test Grant',
            slug: 'test-grant',
            organization: {
              id: 'org-1',
              name: 'Test Org',
              slug: 'test-org',
            },
          },
          _count: {
            votes: 10,
            comments: 5,
            applications: 3,
          },
        },
      ];

      vi.mocked(database.rfp.findMany).mockResolvedValue(mockRFPs);

      const request = new Request('http://localhost:3002/api/v1/rfps');
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfps).toHaveLength(1);
      expect(data.rfps[0].title).toBe('Test RFP 1');
      expect(data.rfps[0]._count.votes).toBe(10);
    });

    test('should filter RFPs by status', async () => {
      const mockRFPs = [
        {
          id: 'rfp-1',
          title: 'Open RFP',
          status: 'OPEN',
          visibility: 'PUBLIC',
          grant: {
            id: 'grant-1',
            title: 'Grant',
            organization: { id: 'org-1', name: 'Org', slug: 'org' },
          },
          _count: { votes: 0, comments: 0, applications: 0 },
        },
      ];

      vi.mocked(database.rfp.findMany).mockResolvedValue(mockRFPs);

      const request = new Request('http://localhost:3002/api/v1/rfps?status=OPEN');
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfps[0].status).toBe('OPEN');
    });
  });

  describe('GET /api/v1/rfps/[id]', () => {
    test('should return RFP details with votes and comments', async () => {
      const mockRFP = {
        id: 'rfp-1',
        title: 'Test RFP',
        slug: 'test-rfp',
        description: 'Detailed RFP description',
        status: 'OPEN',
        visibility: 'PUBLIC',
        viewCount: 100,
        grant: {
          id: 'grant-1',
          title: 'Test Grant',
          slug: 'test-grant',
          organization: {
            id: 'org-1',
            name: 'Test Organization',
            slug: 'test-org',
          },
        },
        votes: [
          {
            id: 'vote-1',
            userId: 'user-1',
            value: 1,
            user: {
              id: 'user-1',
              username: 'voter1',
            },
          },
        ],
        comments: [
          {
            id: 'comment-1',
            content: 'Great RFP!',
            authorId: 'user-2',
            author: {
              id: 'user-2',
              username: 'commenter1',
              firstName: 'John',
              lastName: 'Doe',
            },
            createdAt: new Date(),
          },
        ],
        _count: {
          votes: 1,
          comments: 1,
          applications: 0,
        },
      };

      vi.mocked(database.rfp.findFirst).mockResolvedValue(mockRFP);

      const request = new Request('http://localhost:3002/api/v1/rfps/rfp-1');
      const response = await getRFP(request, { params: Promise.resolve({ id: 'rfp-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfp.id).toBe('rfp-1');
      expect(data.rfp.votes).toHaveLength(1);
      expect(data.rfp.comments).toHaveLength(1);
    });
  });

  describe('POST /api/v1/organizations/[organizationId]/rfps', () => {
    test('should create RFP for organization member', async () => {
      const mockSession = {
        user: {
          id: 'member-1',
          email: 'member@org.com',
        },
      };

      const mockOrganization = {
        id: 'org-1',
        name: 'Test Org',
        members: [
          {
            userId: 'member-1',
            role: 'MEMBER',
          },
        ],
      };

      const mockRFP = {
        id: 'rfp-new',
        title: 'New RFP',
        slug: 'new-rfp',
        description: 'New RFP description',
        grantId: 'grant-1',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        createdAt: new Date(),
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.organization.findUnique).mockResolvedValue(mockOrganization);
      vi.mocked(database.rfp.create).mockResolvedValue(mockRFP);

      const body = JSON.stringify({
        title: 'New RFP',
        description: 'New RFP description',
        grantId: 'grant-1',
        visibility: 'PUBLIC',
      });

      const request = new Request('http://localhost:3002/api/v1/organizations/org-1/rfps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createRFP(request, { params: Promise.resolve({ organizationId: 'org-1' }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.rfp.title).toBe('New RFP');
    });

    test('should require organization membership', async () => {
      const mockSession = {
        user: {
          id: 'non-member',
          email: 'user@example.com',
        },
      };

      const mockOrganization = {
        id: 'org-1',
        name: 'Test Org',
        members: [],
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.organization.findUnique).mockResolvedValue(mockOrganization);

      const body = JSON.stringify({
        title: 'New RFP',
        description: 'Description',
        grantId: 'grant-1',
      });

      const request = new Request('http://localhost:3002/api/v1/organizations/org-1/rfps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const response = await createRFP(request, { params: Promise.resolve({ organizationId: 'org-1' }) });

      expect(response.status).toBe(403);
    });
  });
});