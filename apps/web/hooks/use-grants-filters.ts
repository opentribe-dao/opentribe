"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { GrantsFilters } from './use-grants-data';

export function useGrantsFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse current filters from URL
  const filters = useMemo((): GrantsFilters => {
    const params = new URLSearchParams(searchParams);
    
    return {
      status: params.get('status') || 'OPEN',
      skills: params.get('skills')?.split(',').filter(Boolean) || [],
      source: params.get('source') || 'ALL',
      search: params.get('search') || '',
      page: Number.parseInt(params.get('page') || '1'),
      limit: Number.parseInt(params.get('limit') || '9'),
    };
  }, [searchParams]);

  // Count active filters (excluding defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Status filter (if not default "OPEN")
    if (filters.status?.trim() && filters.status !== 'OPEN') {
      count++;
    }
    
    // Skills filter (if not empty)
    if (filters.skills && filters.skills.length > 0) {
      count++;
    }
    
    // Source filter (if not default "ALL")
    if (filters.source?.trim() && filters.source !== 'ALL') {
      count++;
    }
    
    // Search query (if not empty)
    if (filters.search?.trim()) {
      count++;
    }
    
    return count;
  }, [filters]);

  // Update URL with new filters
  const updateURL = useCallback((newFilters: Partial<GrantsFilters>, replace = true) => {
    const params = new URLSearchParams(searchParams);
    
    // Merge with current filters
    const updatedFilters = { ...filters, ...newFilters };
    
    // Update URL parameters
    if (updatedFilters.status && updatedFilters.status !== 'OPEN') {
      params.set('status', updatedFilters.status);
    } else {
      params.delete('status');
    }
    
    if (updatedFilters.skills && updatedFilters.skills.length > 0) {
      params.set('skills', updatedFilters.skills.join(','));
    } else {
      params.delete('skills');
    }
    
    if (updatedFilters.source && updatedFilters.source !== 'ALL') {
      params.set('source', updatedFilters.source);
    } else {
      params.delete('source');
    }
    
    if (updatedFilters.search?.trim()) {
      params.set('search', updatedFilters.search);
    } else {
      params.delete('search');
    }
    
    if (updatedFilters.page && updatedFilters.page > 1) {
      params.set('page', updatedFilters.page.toString());
    } else {
      params.delete('page');
    }
    
    if (updatedFilters.limit && updatedFilters.limit !== 9) {
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
  const updateFilter = useCallback((key: keyof GrantsFilters, value: GrantsFilters[typeof key]) => {
    const updates: Partial<GrantsFilters> = { [key]: value };

    // Reset page when changing filters (except page itself)
    if (key !== 'page') {
      updates.page = 1;
    }

    updateURL(updates);
  }, [updateURL]);

  const toggleStatus = useCallback((status: string) => {
    const newStatus = filters.status === status ? 'OPEN' : status;
    updateFilter('status', newStatus);
  }, [filters.status, updateFilter]);

  const toggleSkill = useCallback((skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills.filter(s => s !== ''), skill];
    
    updateFilter('skills', newSkills);
  }, [filters.skills, updateFilter]);

  const toggleSource = useCallback((source: string) => {
    const newSource = filters.source === source ? 'ALL' : source;
    updateFilter('source', newSource);
  }, [filters.source, updateFilter]);

  const clearAllFilters = useCallback(() => {
    const defaultFilters: GrantsFilters = {
      status: 'OPEN',
      skills: [],
      source: 'ALL',
      search: '',
      page: 1,
      limit: 9,
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
    toggleSource,
    clearAllFilters,
    clearAllSkills,
    hasActiveFilters: activeFiltersCount > 0,
  };
}
