// API client functions for community features

import { env } from "@/env";

const API_URL = env.NEXT_PUBLIC_API_URL;

// Like API functions
export async function createLike(data: {
  applicationId?: string;
  submissionId?: string;
}) {
  const response = await fetch(`${API_URL}/api/v1/likes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create like");
  }

  return response.json();
}

export async function removeLike(params: {
  applicationId?: string;
  submissionId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.applicationId)
    searchParams.append("applicationId", params.applicationId);
  if (params.submissionId)
    searchParams.append("submissionId", params.submissionId);

  const response = await fetch(`${API_URL}/api/v1/likes?${searchParams}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove like");
  }

  return response.json();
}

export async function checkLikes(params: {
  applicationIds?: string[];
  submissionIds?: string[];
}) {
  const searchParams = new URLSearchParams();
  if (params.applicationIds?.length) {
    searchParams.append("applicationIds", params.applicationIds.join(","));
  }
  if (params.submissionIds?.length) {
    searchParams.append("submissionIds", params.submissionIds.join(","));
  }

  const response = await fetch(
    `${API_URL}/api/v1/likes/check?${searchParams}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      // User not authenticated, return empty likes
      return { applications: {}, submissions: {} };
    }
    throw new Error("Failed to check likes");
  }

  return response.json();
}

// Comment API functions
export interface Comment {
  id: string;
  body: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
    name: string;
  };
  parentId: string | null;
  type: string;
  isEdited: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export async function getComments(params: {
  rfpId?: string;
  bountyId?: string;
  applicationId?: string;
  submissionId?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.append(key, value.toString());
  });

  const response = await fetch(`${API_URL}/api/v1/comments?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }

  return response.json() as Promise<{
    comments: Comment[];
    total: number;
    limit: number;
    offset: number;
  }>;
}

export async function createComment(data: {
  body: string;
  parentId?: string;
  rfpId?: string;
  bountyId?: string;
  applicationId?: string;
  submissionId?: string;
  type?: string;
}) {
  const response = await fetch(`${API_URL}/api/v1/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create comment");
  }

  return response.json();
}

export async function updateComment(id: string, body: string) {
  const response = await fetch(`${API_URL}/api/v1/comments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update comment");
  }

  return response.json();
}

export async function deleteComment(id: string) {
  const response = await fetch(`${API_URL}/api/v1/comments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete comment");
  }

  return response.json();
}

// Vote API functions
export async function getUserVotes(rfpIds: string[]) {
  const searchParams = new URLSearchParams();
  searchParams.append("rfpIds", rfpIds.join(","));

  const response = await fetch(`${API_URL}/api/v1/votes?${searchParams}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      // User not authenticated, return empty votes
      return { votes: {} };
    }
    throw new Error("Failed to fetch votes");
  }

  return response.json() as Promise<{ votes: Record<string, "UP" | "DOWN"> }>;
}

export async function createOrUpdateVote(
  rfpId: string,
  direction: "UP" | "DOWN"
) {
  const response = await fetch(`${API_URL}/api/v1/votes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ rfpId, direction }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to vote");
  }

  return response.json();
}

export async function removeVote(rfpId: string) {
  const response = await fetch(`${API_URL}/api/v1/votes?rfpId=${rfpId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove vote");
  }

  return response.json();
}
