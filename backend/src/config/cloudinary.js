import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/ApiError.js';

const FOLDER = 'vibepost/posts';

/**
 * Image storage is optional at boot: the API runs perfectly well without
 * credentials, text-only posts keep working, and only an attempted upload
 * reports the problem. That keeps a missing Cloudinary account from taking the
 * whole application down.
 */
export function isImageStorageConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

let configured = false;

function configure() {
  if (configured) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
}

/**
 * Uploads an in-memory image buffer and resolves with its hosted URL.
 *
 * The binary never touches MongoDB or the server's filesystem: Render's disk is
 * ephemeral, so an uploaded file would disappear on the next deploy.
 *
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer) {
  if (!isImageStorageConfigured()) {
    throw new ApiError(503, 'Image uploads are not configured on this server.');
  }

  configure();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error || !result?.secure_url) {
          // The provider's own message is not shown to the user.
          console.error('[cloudinary] upload failed:', error?.message ?? 'no result returned');
          reject(new ApiError(502, 'Uploading your image failed. Please try again.'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
}

/**
 * Removes an uploaded image. Used to clean up when a post fails to save after
 * its image has already been stored, which would otherwise orphan the file.
 */
export async function destroyImage(publicId) {
  if (!publicId || !isImageStorageConfigured()) return;

  try {
    configure();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Cleanup is best-effort — never turn it into a user-facing failure.
    console.error('[cloudinary] cleanup failed:', error.message);
  }
}
