// Photo upload size cap. Photos are stored as base64 data URLs in D1, so
// uncapped uploads can blow up the row size (D1 has a per-row hard cap) and
// bloat any page that re-renders dozens of tickets inline.
//
// 800,000 chars of base64 ≈ 600 KB raw image, comfortably enough for a
// 1200x900 JPEG at 0.7 quality.

export const MAX_PHOTO_BASE64_LEN = 800_000

export function photoOversize(photo: unknown): boolean {
  return typeof photo === 'string' && photo.length > MAX_PHOTO_BASE64_LEN
}
