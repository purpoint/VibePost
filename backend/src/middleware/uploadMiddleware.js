import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Files are held in memory and streamed straight to Cloudinary — nothing is
 * written to the server's disk, which on Render is wiped on every deploy.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(ApiError.badRequest('Only JPG, PNG, WEBP and GIF images are supported'));
      return;
    }
    callback(null, true);
  },
});

/**
 * Accepts an optional `image` file on a multipart request.
 * A plain JSON request passes straight through with no file attached.
 */
export const uploadPostImage = upload.single('image');
