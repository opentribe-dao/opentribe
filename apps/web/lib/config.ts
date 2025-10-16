/**
 * Matches an optional locale prefix at the start of a pathname.
 * Examples:
 *   "/en/bounties" => "/bounties"
 *   "/en-US/bounties" => "/bounties"
 */
export const LOCALE_PREFIX_REGEX = /^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/;
