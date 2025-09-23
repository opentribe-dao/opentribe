"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { GrantsFilters } from './use-grants-data';

export function useGrantsFilters() {
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
  const filters = useMemo((): GrantsFilters => {
    const params = new URLSearchParams(searchParams);
    
    return {
      status: params.get('status') || 'OPEN',
      skills: params.get('skills')?.split(',').filter(Boolean) || [],
      search: params.get('search') || '',
      sortBy: params.get('sort') || 'newest',
      priceRange: [
        Number.parseInt(params.get('minAmount') || '0'),
        Number.parseInt(params.get('maxAmount') || '100000')
      ] as [number, number],
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
    
    
    // Sort filter (if not default "newest")
    if (filters.sortBy && filters.sortBy !== 'newest') {
      count++;
    }
    
    // Price range filter (if not default 0-100000)
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000)) {
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
    
    
    if (updatedFilters.sortBy && updatedFilters.sortBy !== 'newest') {
      params.set('sort', updatedFilters.sortBy);
    } else {
      params.delete('sort');
    }
    
    if (updatedFilters.priceRange && (updatedFilters.priceRange[0] > 0 || updatedFilters.priceRange[1] < 100000)) {
      params.set('minAmount', updatedFilters.priceRange[0].toString());
      params.set('maxAmount', updatedFilters.priceRange[1].toString());
    } else {
      params.delete('minAmount');
      params.delete('maxAmount');
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


  const clearAllFilters = useCallback(() => {
    const defaultFilters: GrantsFilters = {
      status: 'OPEN',
      skills: [],
      search: '',
      sortBy: 'newest',
      priceRange: [0, 100000],
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
    clearAllFilters,
    clearAllSkills,
    hasActiveFilters: activeFiltersCount > 0,
  };
}
