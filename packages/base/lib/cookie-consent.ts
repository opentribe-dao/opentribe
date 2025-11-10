/**
 * Cookie Consent Management Utility
 *
 * Handles cookie consent preferences for GDPR, CCPA, and DPDP compliance.
 * Supports granular consent categories: strictly-necessary, functional, analytics
 */

export type CookieCategory = 'strictly-necessary' | 'functional' | 'analytics';

export interface CookieConsent {
  strictlyNecessary: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  timestamp: number;
  version: string;
}

const COOKIE_NAME = 'cookie-consent';
const COOKIE_VERSION = '1.0';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

/**
 * Default consent - only strictly necessary cookies
 */
export const DEFAULT_CONSENT: CookieConsent = {
  strictlyNecessary: true,
  functional: false,
  analytics: false,
  timestamp: Date.now(),
  version: COOKIE_VERSION,
};

/**
 * All cookies accepted
 */
export const ACCEPT_ALL_CONSENT: CookieConsent = {
  strictlyNecessary: true,
  functional: true,
  analytics: true,
  timestamp: Date.now(),
  version: COOKIE_VERSION,
};

/**
 * Get current cookie consent from cookie
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const consentCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${COOKIE_NAME}=`)
  );

  if (!consentCookie) return null;

  try {
    const value = consentCookie.split('=')[1];
    const decoded = decodeURIComponent(value);
    const consent = JSON.parse(decoded) as CookieConsent;

    // Ensure strictly necessary is always true
    consent.strictlyNecessary = true;

    return consent;
  } catch (error) {
    console.error('Failed to parse cookie consent:', error);
    return null;
  }
}

/**
 * Set cookie consent and save to cookie
 */
export function setCookieConsent(consent: Partial<CookieConsent>): void {
  const fullConsent: CookieConsent = {
    strictlyNecessary: true, // Always true
    functional: consent.functional ?? false,
    analytics: consent.analytics ?? false,
    timestamp: Date.now(),
    version: COOKIE_VERSION,
  };

  const encoded = encodeURIComponent(JSON.stringify(fullConsent));
  const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * 864e5).toUTCString();

  document.cookie = `${COOKIE_NAME}=${encoded}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Check if a specific category is consented
 */
export function hasCategoryConsent(category: CookieCategory): boolean {
  const consent = getCookieConsent();

  if (!consent) {
    // No consent given - only strictly necessary allowed
    return category === 'strictly-necessary';
  }

  switch (category) {
    case 'strictly-necessary':
      return true; // Always allowed
    case 'functional':
      return consent.functional;
    case 'analytics':
      return consent.analytics;
    default:
      return false;
  }
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  setCookieConsent(ACCEPT_ALL_CONSENT);

  // Reload to initialize analytics if needed
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Reject non-essential cookies
 */
export function rejectNonEssentialCookies(): void {
  setCookieConsent(DEFAULT_CONSENT);

  // Clear existing analytics cookies
  clearAnalyticsCookies();
}

/**
 * Update specific consent preferences
 */
export function updateCookieConsent(preferences: Partial<Omit<CookieConsent, 'strictlyNecessary' | 'timestamp' | 'version'>>): void {
  setCookieConsent(preferences);

  // If analytics was disabled, clear analytics cookies
  if (preferences.analytics === false) {
    clearAnalyticsCookies();
  }

  // Reload to apply changes
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Clear all analytics cookies
 */
function clearAnalyticsCookies(): void {
  const analyticsCookies = ['_ga', '_gid', '_gat', '_gat_gtag'];
  const postHogCookies = document.cookie
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(name => name.startsWith('ph_'));

  const allCookies = [...analyticsCookies, ...postHogCookies];

  for (const cookieName of allCookies) {
    // Delete for current domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Try to delete for parent domain as well
    const domain = window.location.hostname;
    const parts = domain.split('.');

    if (parts.length >= 2) {
      const parentDomain = `.${parts.slice(-2).join('.')}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${parentDomain}`;
    }
  }
}

/**
 * Reset all consent (for testing/debugging)
 */
export function resetConsent(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  clearAnalyticsCookies();
}

/**
 * React hook for cookie consent
 */
export function useCookieConsent() {
  if (typeof window === 'undefined') {
    return {
      consent: null,
      hasConsent: false,
      hasCategoryConsent: () => false,
      acceptAll: () => {},
      rejectNonEssential: () => {},
      updateConsent: () => {},
    };
  }

  return {
    consent: getCookieConsent(),
    hasConsent: hasConsent(),
    hasCategoryConsent,
    acceptAll: acceptAllCookies,
    rejectNonEssential: rejectNonEssentialCookies,
    updateConsent: updateCookieConsent,
  };
}
