import { database } from "@packages/db";

export type ApplicationApplicant = {
  id: string;
  name: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  github: string | null;
  linkedin: string | null;
  website: string | null;
  isEcosystemProfile: boolean;
  ecosystemProfileSlug: string | null;
};

/**
 * Resolves the applicant for a GrantApplication, returning a normalized DTO.
 *
 * If the application has a linked User (userId not null), maps User fields.
 * If the application has no User (imported ecosystem data), queries
 * EcosystemContribution with role=APPLICANT and maps EcosystemProfile fields.
 */
export async function resolveApplicationApplicant(
  application: {
    id: string;
    userId: string | null;
    applicant: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
      image: string | null;
      bio?: string | null;
      location?: string | null;
      skills?: string[];
      github?: string | null;
      linkedin?: string | null;
      website?: string | null;
    } | null;
  },
): Promise<ApplicationApplicant> {
  // If the application has a linked User, map User fields
  if (application.applicant) {
    const user = application.applicant;
    return {
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Anonymous",
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      bio: user.bio ?? null,
      location: user.location ?? null,
      skills: Array.isArray(user.skills) ? user.skills : [],
      github: user.github ?? null,
      linkedin: user.linkedin ?? null,
      website: user.website ?? null,
      isEcosystemProfile: false,
      ecosystemProfileSlug: null,
    };
  }

  // No linked user — look up EcosystemContribution for this application
  const contribution = await database.ecosystemContribution.findFirst({
    where: {
      grantApplicationId: application.id,
      role: "APPLICANT",
    },
    include: {
      ecosystemProfile: true,
    },
  });

  if (contribution?.ecosystemProfile) {
    const profile = contribution.ecosystemProfile;
    return {
      id: profile.id,
      name: profile.displayName,
      username: null,
      firstName: null,
      lastName: null,
      email: profile.email ?? null,
      image: null,
      bio: profile.bio ?? null,
      location: profile.location ?? null,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      github: profile.github ?? null,
      linkedin: profile.linkedin ?? null,
      website: profile.website ?? null,
      isEcosystemProfile: true,
      ecosystemProfileSlug: profile.slug,
    };
  }

  // Fallback: no applicant info available
  return {
    id: application.id,
    name: "Unknown Applicant",
    username: null,
    firstName: null,
    lastName: null,
    email: null,
    image: null,
    bio: null,
    location: null,
    skills: [],
    github: null,
    linkedin: null,
    website: null,
    isEcosystemProfile: false,
    ecosystemProfileSlug: null,
  };
}

/**
 * Resolves applicants for a list of applications in a single batch query.
 * More efficient than calling resolveApplicationApplicant per item.
 */
export async function resolveApplicationApplicantBatch(
  applications: Array<{
    id: string;
    userId: string | null;
    applicant: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
      image: string | null;
      bio?: string | null;
      location?: string | null;
      skills?: string[];
      github?: string | null;
      linkedin?: string | null;
      website?: string | null;
    } | null;
  }>,
): Promise<Map<string, ApplicationApplicant>> {
  const result = new Map<string, ApplicationApplicant>();

  // Separate applications with users and without
  const withoutUser: string[] = [];

  for (const app of applications) {
    if (app.applicant) {
      const user = app.applicant;
      result.set(app.id, {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Anonymous",
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        bio: user.bio ?? null,
        location: user.location ?? null,
        skills: Array.isArray(user.skills) ? user.skills : [],
        github: user.github ?? null,
        linkedin: user.linkedin ?? null,
        website: user.website ?? null,
        isEcosystemProfile: false,
        ecosystemProfileSlug: null,
      });
    } else {
      withoutUser.push(app.id);
    }
  }

  // Batch query ecosystem contributions for applications without users
  if (withoutUser.length > 0) {
    const contributions = await database.ecosystemContribution.findMany({
      where: {
        grantApplicationId: { in: withoutUser },
        role: "APPLICANT",
      },
      include: {
        ecosystemProfile: true,
      },
    });

    const contributionMap = new Map<string, typeof contributions[number]>();
    for (const c of contributions) {
      if (c.grantApplicationId) {
        contributionMap.set(c.grantApplicationId, c);
      }
    }

    for (const appId of withoutUser) {
      const contribution = contributionMap.get(appId);
      if (contribution?.ecosystemProfile) {
        const profile = contribution.ecosystemProfile;
        result.set(appId, {
          id: profile.id,
          name: profile.displayName,
          username: null,
          firstName: null,
          lastName: null,
          email: profile.email ?? null,
          image: null,
          bio: profile.bio ?? null,
          location: profile.location ?? null,
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          github: profile.github ?? null,
          linkedin: profile.linkedin ?? null,
          website: profile.website ?? null,
          isEcosystemProfile: true,
          ecosystemProfileSlug: profile.slug,
        });
      } else {
        result.set(appId, {
          id: appId,
          name: "Unknown Applicant",
          username: null,
          firstName: null,
          lastName: null,
          email: null,
          image: null,
          bio: null,
          location: null,
          skills: [],
          github: null,
          linkedin: null,
          website: null,
          isEcosystemProfile: false,
          ecosystemProfileSlug: null,
        });
      }
    }
  }

  return result;
}
