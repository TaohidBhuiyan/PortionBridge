const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { UPLOAD_LIMITS } = require('../constants');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const UPLOAD_SUBFOLDERS = {
  DONATIONS: 'donations',
  PROFILES: 'profiles',
  CHAT: 'chat',
};

/**
 * Ensures every required uploads subfolder exists on disk.
 * Called once at server startup — safe to call repeatedly (no-op if folders exist).
 */
function ensureUploadDirsExist() {
  Object.values(UPLOAD_SUBFOLDERS).forEach((folder) => {
    const fullPath = path.join(UPLOAD_ROOT, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`[Uploads] Created missing directory: ${fullPath}`);
    }
  });
}

/**
 * Factory that builds a configured multer instance for a specific upload type.
 * Keeps file storage rules (destination, naming, size, allowed types) in one place
 * so controllers just call the pre-built middleware, e.g. uploadDonationImage.single('photo').
 *
 * @param {string} subfolder - one of UPLOAD_SUBFOLDERS values
 */
function createUploader(subfolder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOAD_ROOT, subfolder));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${subfolder}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (UPLOAD_LIMITS.ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${UPLOAD_LIMITS.ALLOWED_IMAGE_MIME_TYPES.join(', ')}`));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES },
  });
}

module.exports = {
  UPLOAD_ROOT,
  UPLOAD_SUBFOLDERS,
  ensureUploadDirsExist,
  createUploader,
};
