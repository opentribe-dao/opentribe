/**
 * Skills Parser Utility
 * 
 * Centralized utility for parsing skills data that can come in various formats:
 * - Array: ["Skill1", "Skill2"] 
 * - JSON String: '["Skill1", "Skill2"]'
 * - Object: { "Skill1": true, "Skill2": true }
 * - Null/Undefined: null, undefined
 */

export interface SkillsParserOptions {
  fallback?: string[];
  logErrors?: boolean;
}

/**
 * Parse skills data from any format into a string array
 * @param skills - Skills data in any format
 * @param options - Parser options
 * @returns Array of skill strings
 */
export function parseSkillsArray(
  skills: unknown,
  options: SkillsParserOptions = {}
): string[] {
  const { fallback = [], logErrors = false } = options;

  // Handle null/undefined
  if (skills === null || skills === undefined) {
    return fallback;
  }

  // If it's already an array, return it
  if (Array.isArray(skills)) {
    return skills.filter(skill => typeof skill === 'string' && skill.trim() !== '');
  }

  // If it's a string, try to parse it as JSON
  if (typeof skills === 'string') {
    try {
      const parsedSkills = JSON.parse(skills);
      if (Array.isArray(parsedSkills)) {
        return parsedSkills.filter(skill => typeof skill === 'string' && skill.trim() !== '');
      }
    } catch (error) {
      if (logErrors) {
        console.error('Failed to parse skills JSON:', error);
      }
    }
  }

  // If it's an object, return its keys
  if (typeof skills === 'object' && skills !== null) {
    return Object.keys(skills).filter(key => key.trim() !== '');
  }

  return fallback;
}

/**
 * Convert skills array to JSON string for API storage
 * @param skills - Array of skill strings
 * @returns JSON string representation
 */
export function stringifySkillsArray(skills: string[]): string {
  if (!Array.isArray(skills)) {
    return JSON.stringify([]);
  }
  
  const validSkills = skills.filter(skill => typeof skill === 'string' && skill.trim() !== '');
  return JSON.stringify(validSkills);
}

/**
 * Check if skills data is valid
 * @param skills - Skills data in any format
 * @returns True if skills data is valid
 */
export function isValidSkillsData(skills: unknown): boolean {
  if (skills === null || skills === undefined) {
    return true; // null/undefined is valid (empty skills)
  }

  if (Array.isArray(skills)) {
    return skills.every(skill => typeof skill === 'string' && skill.trim() !== '');
  }

  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) && parsed.every(skill => typeof skill === 'string' && skill.trim() !== '');
    } catch {
      return false;
    }
  }

  if (typeof skills === 'object' && skills !== null) {
    return Object.keys(skills).every(key => typeof key === 'string' && key.trim() !== '');
  }

  return false;
}

/**
 * Get skills count
 * @param skills - Skills data in any format
 * @returns Number of skills
 */
export function getSkillsCount(skills: unknown): number {
  return parseSkillsArray(skills).length;
}

/**
 * Check if skills array is empty
 * @param skills - Skills data in any format
 * @returns True if skills array is empty
 */
export function isEmptySkills(skills: unknown): boolean {
  return getSkillsCount(skills) === 0;
}

/**
 * Normalize skills array (remove duplicates, trim, filter empty)
 * @param skills - Skills data in any format
 * @returns Normalized skills array
 */
export function normalizeSkillsArray(skills: unknown): string[] {
  const parsed = parseSkillsArray(skills);
  const normalized = parsed
    .map(skill => skill.trim())
    .filter(skill => skill !== '');
  
  // Remove duplicates while preserving order
  return [...new Set(normalized)];
}
