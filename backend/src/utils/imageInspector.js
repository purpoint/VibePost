import { ApiError } from './ApiError.js';

/**
 * File signatures ("magic bytes") for the formats VibePost accepts.
 *
 * The Content-Type on an upload is supplied by the client and can say anything,
 * so it is treated as a hint only. This checks what the bytes actually are
 * before the file is sent on to the image host.
 */
const SIGNATURES = [
  { format: 'jpeg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    format: 'png',
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { format: 'gif', matches: (b) => b.subarray(0, 3).toString('ascii') === 'GIF' },
  {
    format: 'webp',
    matches: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

const MIN_HEADER_BYTES = 12;

/**
 * Returns the detected image format, or null if the bytes are not one of the
 * supported formats.
 */
export function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < MIN_HEADER_BYTES) return null;

  return SIGNATURES.find((signature) => signature.matches(buffer))?.format ?? null;
}

/**
 * Throws unless the buffer really is a supported image.
 */
export function assertIsRealImage(buffer) {
  if (!detectImageFormat(buffer)) {
    throw ApiError.badRequest('That file is not a valid JPG, PNG, WEBP or GIF image');
  }
}
