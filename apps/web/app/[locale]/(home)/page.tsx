"use client";
import { useHomepageContent, useHomepageStats } from "@/hooks/use-home-data";
import { useSkillsFilter } from "@/hooks/use-home-skills-filter";
import { ContentSection } from "./components/content-section";
import { HeroSection } from "./components/hero-section";
import { Sidebar } from "./components/sidebar";

export default function HomePage() {
  const skillsFilter = useSkillsFilter();
  const homepageStats = useHomepageStats();
  const contentQueries = useHomepageContent(skillsFilter.selectedSkills);

  const [bountiesQuery, grantsQuery, rfpsQuery] = contentQueries;

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <ContentSection
              bounties={bountiesQuery.data?.bounties || []}
              error={{
                bounties: bountiesQuery.error,
                grants: grantsQuery.error,
                rfps: rfpsQuery.error,
              }}
              grants={grantsQuery.data?.grants || []}
              loading={{
                bounties: bountiesQuery.isLoading,
                grants: grantsQuery.isLoading,
                rfps: rfpsQuery.isLoading,
              }}
              rfps={rfpsQuery.data?.rfps || []}
              selectedSkills={skillsFilter.selectedSkills}
            />
          </div>

          <Sidebar
            data={homepageStats.data}
            error={homepageStats.error}
            hasActiveFilters={skillsFilter.hasActiveFilters}
            loading={homepageStats.isLoading}
            onClearFilters={skillsFilter.clearSkills}
            onSkillToggle={skillsFilter.toggleSkill}
            selectedSkills={skillsFilter.selectedSkills}
          />
        </div>
      </section>
    </div>
  );
}
