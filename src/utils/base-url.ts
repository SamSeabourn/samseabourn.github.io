export const BASE_URL = import.meta.env.BASE_URL;

/**
 * Helper to build asset URLs with the correct base path
 * Works in both dev (/) and prod (/portfolio/)
 */
export function asset(path: string): string {
	// Remove leading slash if present
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	// Ensure BASE_URL ends with slash
	const baseWithSlash = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
	return `${baseWithSlash}${cleanPath}`;
}
