"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { BountiesFilters } from './use-bounties-data';

export function useBountiesFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // debounce ref for priceRange updates
  const priceDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (priceDebounceRef.current) {
        window.clearTimeout(priceDebounceRef.current);
      }
    };
  }, []);

  // Parse current filters from URL
  const filters = useMemo((): BountiesFilters => {
    const params = new URLSearchParams(searchParams);
    
    return {
      status: params.get('status')?.split(',').filter(Boolean) || ['open'],
      skills: params.get('skills')?.split(',').filter(Boolean) || [],
      sortBy: params.get('sort') || 'newest',
      priceRange: [
        Number.parseInt(params.get('minAmount') || '0'),
        Number.parseInt(params.get('maxAmount') || '50000')
      ] as [number, number],
      hasSubmissions: params.get('hasSubmissions') === 'true',
      hasDeadline: params.get('hasDeadline') === 'true',
      search: params.get('search') || '',
      page: Number.parseInt(params.get('page') || '1'),
      limit: Number.parseInt(params.get('limit') || '10'),
    };
  }, [searchParams]);

  // Count active filters (excluding defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Status filter
    if (filters.status?.length) {
      count++;
    }
    
    // Skills filter
    if (filters.skills?.length) {
      count++;
    }
    
    // Sort filter (if not default "newest")
    if (filters.sortBy && filters.sortBy !== 'newest') {
      count++;
    }
    
    // Price range filter (if not default 0-50000)
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000)) {
      count++;
    }
    
    // Boolean filters
    if (filters.hasSubmissions) count++;
    if (filters.hasDeadline) count++;
    
    // // Search query
    // if (filters.search) count++;
    
    return count;
  }, [filters]);

  // Update URL with new filters
  const updateURL = useCallback((newFilters: Partial<BountiesFilters>, replace = true) => {
    const params = new URLSearchParams(searchParams);
    
    // Merge with current filters
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update URL parameters
    if (updatedFilters.status?.length && updatedFilters.status[0] !== '') {
      params.set('status', updatedFilters.status.join(','));
    } else {
      params.delete('status');
    }
    
    if (updatedFilters.skills?.length && updatedFilters.skills[0] !== '') {
      params.set('skills', updatedFilters.skills.join(','));
    } else {
      params.delete('skills');
    }
    
    if (updatedFilters.sortBy && updatedFilters.sortBy !== '') {
      params.set('sort', updatedFilters.sortBy);
    } else {
      params.delete('sort');
    }
    
    if (updatedFilters.priceRange && (updatedFilters.priceRange[0] > 0 || updatedFilters.priceRange[1] < 50000)) {
      params.set('minAmount', updatedFilters.priceRange[0].toString());
      params.set('maxAmount', updatedFilters.priceRange[1].toString());
    } else {
      params.delete('minAmount');
      params.delete('maxAmount');
    }
    
    if (updatedFilters.hasSubmissions && updatedFilters.hasSubmissions === true) {
      params.set('hasSubmissions', 'true');
    } else {
      params.delete('hasSubmissions');
    }
    
    if (updatedFilters.hasDeadline && updatedFilters.hasDeadline === true) {
      params.set('hasDeadline', 'true');
    } else {
      params.delete('hasDeadline');
    }
    
    if (updatedFilters.search) {
      params.set('search', updatedFilters.search);
    } else {
      params.delete('search');
    }
    
    if (updatedFilters.page && updatedFilters.page > 1) {
      params.set('page', updatedFilters.page.toString());
    } else {
      params.delete('page');
    }
    
    if (updatedFilters.limit && updatedFilters.limit !== 10) {
      params.set('limit', updatedFilters.limit.toString());
    } else {
      params.delete('limit');
    }
    
    const url = `${window.location.pathname}?${params.toString()}`;
    if (replace) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url, { scroll: false });
    }
  }, [searchParams, router, filters]);

  // Individual filter update functions
  const updateFilter = useCallback((key: keyof BountiesFilters, value: BountiesFilters[typeof key]) => {
    const updates: Partial<BountiesFilters> = { [key]: value };

    // Reset page when changing filters (except page itself)
    if (key !== 'page') {
      updates.page = 1;
    }

    // Debounce priceRange updates
    if (key === 'priceRange') {
      if (priceDebounceRef.current) {
        window.clearTimeout(priceDebounceRef.current);
      }
      priceDebounceRef.current = window.setTimeout(() => {
        updateURL(updates);
        priceDebounceRef.current = null;
      }, 300);
      return;
    }

    updateURL(updates);
  }, [updateURL]);

  const toggleStatus = useCallback((status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses.filter(s => s !== ''), status];
    
    updateFilter('status', newStatuses);
  }, [filters.status, updateFilter]);

  const toggleSkill = useCallback((skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills.filter(s => s !== ''), skill];
    
    updateFilter('skills', newSkills);
  }, [filters.skills, updateFilter]);

  const clearAllFilters = useCallback(() => {
    const defaultFilters: BountiesFilters = {
      status: [''],
      skills: [],
      sortBy: '',
      priceRange: [0, 50000],
      hasSubmissions: false,
      hasDeadline: false,
      search: '',
      page: 1,
      limit: 10,
    };
    
    updateURL(defaultFilters);
  }, [updateURL]);

  const clearAllSkills = useCallback(() => {
    updateFilter('skills', []);
  }, [updateFilter]);

  return {
    filters,
    activeFiltersCount,
    updateFilter,
    toggleStatus,
    toggleSkill,
    clearAllFilters,
    clearAllSkills,
    hasActiveFilters: activeFiltersCount > 0,
  };
}
