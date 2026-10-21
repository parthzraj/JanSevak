import type { CivicPost } from '../types';

/**
 * Link that opens Google Maps (app or website, no API key needed).
 * Uses the exact pin when the report has GPS coordinates, otherwise searches the address text.
 */
export function googleMapsUrl(post: Pick<CivicPost, 'latitude' | 'longitude'> & { reporter: { wardOrArea: string } }): string {
  const hasPin = typeof post.latitude === 'number' && typeof post.longitude === 'number';
  const query = hasPin ? `${post.latitude},${post.longitude}` : `${post.reporter.wardOrArea}, Bengaluru`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
