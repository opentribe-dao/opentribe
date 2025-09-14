# Bounty Page UI Implementation Documentation

## Overview

This document outlines the current implementation of the OpenTribe bounty page and provides a roadmap for refactoring it to match the homepage UI implementation pattern. The bounty page currently has a monolithic structure that needs to be broken down into modular, reusable components following React Query patterns.

## Current Implementation Analysis

### Current File Structure
```
apps/web/app/[locale]/bounties/
├── page.tsx (747 lines - NEEDS REFACTORING)
├── components/
│   ├── sidebar.tsx (211 lines - PARTIALLY REFACTORED)
│   └── hero-section.tsx (91 lines - PARTIALLY REFACTORED)
└── hooks/
    ├── useBountiesData.ts (139 lines - CREATED)
    └── useSkillsFilter.ts (50 lines - SHARED WITH HOMEPAGE)
```

### Current State Assessment

#### ✅ COMPLETED COMPONENTS
1. **BountiesHeroSection** (`hero-section.tsx`)
   - ✅ Extracted from main page
   - ✅ Memoized with React.memo
   - ✅ Proper TypeScript interfaces
   - ✅ Search functionality with clear button
   - ✅ Mobile filter toggle

2. **BountiesSidebar** (`sidebar.tsx`)
   - ✅ Extracted from main page
   - ✅ Memoized with React.memo
   - ✅ Complete filter controls (status, sort, price range, additional filters)
   - ✅ Quick stats section with loading states
   - ✅ Proper TypeScript interfaces

3. **React Query Hooks** (`useBountiesData.ts`)
   - ✅ useBountiesData hook for fetching bounties with filters
   - ✅ useBountiesFilterOptions hook for filter options
   - ✅ useBountiesStats hook for statistics
   - ✅ Proper caching configuration
   - ✅ TypeScript interfaces

#### ❌ ISSUES IDENTIFIED

1. **Main Page Structure** (`page.tsx` - 747 lines)
   - ❌ Monolithic component with too much logic
   - ❌ Multiple useEffect hooks causing redundant API calls
   - ❌ Manual state management instead of React Query
   - ❌ Inline filter logic mixed with UI rendering
   - ❌ No QueryClientProvider wrapper
   - ❌ Missing BountiesContentSection component

2. **Data Management Issues**
   - ❌ Manual fetch functions instead of React Query hooks
   - ❌ Redundant API calls for filter options on every render
   - ❌ Complex state management for filters and pagination
   - ❌ No proper error boundaries or loading states

3. **Missing Components**
   - ❌ BountiesContentSection (main content area)
   - ❌ SkillsFilterSection (skills badges section)
   - ❌ ActiveFiltersSection (filter summary display)

## Target Architecture (Following Homepage Pattern)

### Proposed File Structure
```
apps/web/app/[locale]/bounties/
├── page.tsx (~100 lines - REFACTORED)
├── components/
│   ├── hero-section.tsx ✅ (COMPLETED)
│   ├── content-section.tsx ❌ (TO CREATE)
│   ├── sidebar.tsx ✅ (COMPLETED)
│   ├── skills-filter.tsx ❌ (TO CREATE)
│   └── active-filters.tsx ❌ (TO CREATE)
└── hooks/
    ├── useBountiesData.ts ✅ (COMPLETED)
    ├── useBountiesFilters.ts ❌ (TO CREATE)
    └── useSkillsFilter.ts ✅ (SHARED)
```

### Component Breakdown

#### 1. Main Page Component (`page.tsx`)
**Target: ~100 lines (currently 747 lines)**
```typescript
// Simplified structure following homepage pattern
export default function BountiesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BountiesPageContent />
    </QueryClientProvider>
  );
}

function BountiesPageContent() {
  const filtersHook = useBountiesFilters();
  const bountiesData = useBountiesData(filtersHook.filters);
  const filterOptions = useBountiesFilterOptions();
  const stats = useBountiesStats();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <BountiesHeroSection {...heroProps} />
        <SkillsFilterSection {...skillsProps} />
        <ActiveFiltersSection {...filtersProps} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <BountiesContentSection {...contentProps} />
          </div>
          <BountiesSidebar {...sidebarProps} />
        </div>
      </div>
    </div>
  );
}
```

#### 2. BountiesContentSection (`content-section.tsx`) - TO CREATE
**Purpose**: Handle main bounty listing, loading states, error states, and pagination
```typescript
interface BountiesContentSectionProps {
  bounties: Bounty[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}
```

#### 3. SkillsFilterSection (`skills-filter.tsx`) - TO CREATE  
**Purpose**: Horizontal scrollable skills badges with selection state
```typescript
interface SkillsFilterSectionProps {
  skills: string[];
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  onClearAll: () => void;
  loading: boolean;
}
```

#### 4. ActiveFiltersSection (`active-filters.tsx`) - TO CREATE
**Purpose**: Display active filter summary with clear options
```typescript
interface ActiveFiltersSectionProps {
  activeFilters: {
    skills: string[];
    status: string[];
    priceRange: [number, number];
    hasSubmissions: boolean;
    hasDeadline: boolean;
  };
  onClearAll: () => void;
  onClearFilter: (filterType: string) => void;
}
```

#### 5. useBountiesFilters Hook - TO CREATE
**Purpose**: Centralized filter state management with URL synchronization
```typescript
export function useBountiesFilters() {
  // Manage all filter state
  // URL synchronization
  // Filter change handlers
  // Active filters count
  return {
    filters,
    updateFilter,
    clearAllFilters,
    activeFiltersCount,
    // ... other filter utilities
  };
}
```

## React Query Integration

### Query Keys Configuration
```typescript
// In hooks/react-query.ts
export const bountyQueryKeys = {
  all: ['bounties'] as const,
  lists: () => [...bountyQueryKeys.all, 'list'] as const,
  list: (filters: BountiesFilters) => [...bountyQueryKeys.lists(), filters] as const,
  details: () => [...bountyQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...bountyQueryKeys.details(), id] as const,
  stats: () => [...bountyQueryKeys.all, 'stats'] as const,
  filterOptions: () => [...bountyQueryKeys.all, 'filterOptions'] as const,
};
```

### Cache Configuration
```typescript
// Proper cache times for different data types
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
};
```

## Performance Optimizations

### Memoization Strategy
- ✅ All components wrapped with React.memo
- ✅ Callback functions memoized with useCallback
- ✅ Complex computations memoized with useMemo
- ✅ Stable query keys for React Query

### Loading States
- ✅ Skeleton loading for initial load
- ✅ Progressive loading for pagination
- ✅ Individual loading states for different sections
- ✅ Error boundaries with retry functionality

## URL State Management

### Current URL Parameters
```typescript
// Supported URL parameters
interface URLParams {
  skills?: string;        // comma-separated skills
  status?: string;        // comma-separated statuses
  search?: string;        // search query
  sortBy?: string;        // sort option
  minAmount?: string;     // minimum amount filter
  maxAmount?: string;     // maximum amount filter
  hasSubmissions?: string; // boolean filter
  hasDeadline?: string;   // boolean filter
  page?: string;          // pagination
  limit?: string;         // items per page
}
```

## Refactoring Roadmap

### Phase 1: Component Extraction ⏳
1. ✅ Extract BountiesHeroSection (COMPLETED)
2. ✅ Extract BountiesSidebar (COMPLETED)
3. ❌ Create BountiesContentSection
4. ❌ Create SkillsFilterSection  
5. ❌ Create ActiveFiltersSection

### Phase 2: Data Management Migration ⏳
1. ✅ Create React Query hooks (COMPLETED)
2. ❌ Create useBountiesFilters hook
3. ❌ Replace manual fetch with React Query
4. ❌ Add QueryClientProvider wrapper
5. ❌ Remove redundant useEffect hooks

### Phase 3: State Management Cleanup ⏳
1. ❌ Centralize filter state management
2. ❌ Implement proper URL synchronization
3. ❌ Add proper error handling
4. ❌ Optimize loading states

### Phase 4: Performance & Polish ⏳
1. ❌ Add React.memo to all components
2. ❌ Implement proper memoization
3. ❌ Add error boundaries
4. ❌ Performance testing and optimization

## Expected Outcomes

### Code Metrics
- **Main page.tsx**: 747 lines → ~100 lines (85% reduction)
- **Component modularity**: Monolithic → 6 focused components
- **Maintainability**: Significantly improved
- **Performance**: Better caching and memoization

### Architecture Benefits
- **Separation of concerns**: Each component has a single responsibility
- **Reusability**: Components can be reused across different pages
- **Testability**: Smaller, focused components are easier to test
- **Developer experience**: Cleaner code structure and better TypeScript support

### User Experience Improvements
- **Faster loading**: React Query caching reduces API calls
- **Better error handling**: Proper error states and retry mechanisms
- **Smoother interactions**: Optimistic updates and loading states
- **URL persistence**: Filters and search state preserved in URL

## Implementation Notes

### Following Homepage Pattern
The refactoring should closely follow the homepage implementation pattern:
- Same React Query setup and configuration
- Similar component structure and naming conventions
- Consistent TypeScript interfaces and prop patterns
- Matching performance optimization strategies

### Backward Compatibility
- Maintain existing URL parameter structure
- Preserve current API integration
- Keep existing functionality intact during refactoring
- Ensure no breaking changes for users

### Testing Strategy
- Unit tests for individual components
- Integration tests for data flow
- E2E tests for critical user journeys
- Performance regression testing

---

**Status**: Ready for implementation
**Estimated Effort**: 2-3 days for complete refactoring
**Priority**: High (improves maintainability and performance significantly)
