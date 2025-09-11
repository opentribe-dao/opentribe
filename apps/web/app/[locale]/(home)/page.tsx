"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroSection } from "./components/hero-section";
import { ContentSection } from "./components/content-section";
import { Sidebar } from "./components/sidebar";
import { useSkillsFilter } from "@/hooks/use-skills-filter";
import { useHomepageStats, useHomepageContent } from "@/hooks/use-homepage-data";
import { queryClientConfig } from "@/hooks/react-query";

const queryClient = new QueryClient(queryClientConfig);

function HomePageContent() {
  const skillsFilter = useSkillsFilter();
  const homepageStats = useHomepageStats();
  const contentQueries = useHomepageContent(skillsFilter.selectedSkills);

  const [bountiesQuery, grantsQuery, rfpsQuery] = contentQueries;

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <ContentSection
              bounties={bountiesQuery.data?.bounties || []}
              grants={grantsQuery.data?.grants || []}
              rfps={rfpsQuery.data?.rfps || []}
              loading={{
                bounties: bountiesQuery.isLoading,
                grants: grantsQuery.isLoading,
                rfps: rfpsQuery.isLoading,
              }}
              error={{
                bounties: bountiesQuery.error,
                grants: grantsQuery.error,
                rfps: rfpsQuery.error,
              }}
              selectedSkills={skillsFilter.selectedSkills}
              hasActiveFilters={skillsFilter.hasActiveFilters}
              onClearFilters={skillsFilter.clearSkills}
            />
          </div>

          <Sidebar
            data={homepageStats.data}
            selectedSkills={skillsFilter.selectedSkills}
            onSkillToggle={skillsFilter.toggleSkill}
            loading={homepageStats.isLoading}
            error={homepageStats.error}
          />
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePageContent />
    </QueryClientProvider>
  );
}
