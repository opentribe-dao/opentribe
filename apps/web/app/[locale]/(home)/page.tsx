"use client";
import { HeroSection } from "./components/hero-section";
import { ContentSection } from "./components/content-section";
import { Sidebar } from "./components/sidebar";
import { useSkillsFilter } from "@/hooks/use-home-skills-filter";
import { useHomepageStats, useHomepageContent } from "@/hooks/use-home-data";

export default function HomePage() {
  const skillsFilter = useSkillsFilter();
  const homepageStats = useHomepageStats();
  const contentQueries = useHomepageContent(skillsFilter.selectedSkills);

  const [bountiesQuery, grantsQuery, rfpsQuery] = contentQueries;

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="container mx-auto px-4 pb-20">
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
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
            />
          </div>

          <Sidebar
            data={homepageStats.data}
            selectedSkills={skillsFilter.selectedSkills}
            onSkillToggle={skillsFilter.toggleSkill}
            loading={homepageStats.isLoading}
            error={homepageStats.error}
            hasActiveFilters={skillsFilter.hasActiveFilters}
            onClearFilters={skillsFilter.clearSkills} 
          />
        </div>
      </section>
    </div>
  );
}