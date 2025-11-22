import { SchemeMode } from '../types';

/**
 * Fetches a color scheme based on a seed hex color and a mode.
 * Uses https://www.thecolorapi.com
 */
export const fetchColorScheme = async (hex: string, mode: SchemeMode, count: number = 6): Promise<string[]> => {
  // Remove hash if present
  const cleanHex = hex.replace('#', '');
  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=${mode}&count=${count}&format=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Color API Error: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Extract hex values from response
    if (data.colors && Array.isArray(data.colors)) {
        return data.colors.map((c: any) => c.hex.value);
    }
    return [`#${cleanHex}`];
  } catch (error) {
    console.warn('Failed to fetch color scheme, falling back to seed color:', error);
    return [`#${cleanHex}`];
  }
};
