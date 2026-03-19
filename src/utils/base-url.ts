export const BASE_URL = import.meta.env.BASE_URL;

export function asset(path: string): string {
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	const baseWithSlash = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
	return `${baseWithSlash}${cleanPath}`;
}
