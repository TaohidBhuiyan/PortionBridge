const fs = require('fs');
const multer = require('multer');

/**
 * Known magic-byte signatures for the image types this app accepts.
 * multer's fileFilter can only see the client-reported Content-Type
 * header, which is trivially spoofable (e.g. a renamed .exe served with
 * an `image/png` mimetype would sail through it). Checking the actual
 * first bytes on disk after upload closes that gap without pulling in an
 * image-processing dependency.
 */
const IMAGE_SIGNATURES = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // WebP: 'RIFF' .... 'WEBP' — bytes 8-11 are a file-size field, so we
  // check the two fixed anchors (0-3 and 8-11) rather than a single
  // contiguous run.
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function matchesSignature(buffer, signatureBytes) {
  if (buffer.length < signatureBytes.length) return false;
  return signatureBytes.every((byte, i) => buffer[i] === byte);
}

/**
 * Reads the first 12 bytes of an uploaded file and verifies they match
 * a known-good signature for the file's declared mimetype. Deletes and
 * rejects the file if the content doesn't actually look like an image
 * of the claimed type (or any recognized image type at all) — this is
 * what stops a mismatched/fake image (e.g. an executable renamed with a
 * .png extension and a spoofed Content-Type) from being accepted.
 * @param {string} filePath - Absolute path to the file already written to disk
 * @param {string} declaredMimeType - The mimetype multer/the client reported
 * @returns {boolean} true if the file's actual bytes match a known image signature
 */
function hasValidImageSignature(filePath, declaredMimeType) {
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(12);
  fs.readSync(fd, header, 0, 12, 0);
  fs.closeSync(fd);

  const candidateSignatures = IMAGE_SIGNATURES[declaredMimeType];
  if (candidateSignatures && candidateSignatures.some((sig) => matchesSignature(header, sig))) {
    if (declaredMimeType === 'image/webp') {
      // Also confirm the 'WEBP' anchor at bytes 8-11 for RIFF containers,
      // since RIFF alone is shared by other formats (e.g. WAV, AVI).
      const webpAnchor = [0x57, 0x45, 0x42, 0x50];
      return webpAnchor.every((byte, i) => header[8 + i] === byte);
    }
    return true;
  }

  // Fall back to checking whether the bytes match ANY known image type,
  // in case the declared mimetype itself was wrong/missing but the file
  // content is still a genuine, acceptable image.
  return Object.values(IMAGE_SIGNATURES).some((sigs) => sigs.some((sig) => matchesSignature(header, sig)));
}

/**
 * Middleware factory: verifies the file magic bytes for whatever file
 * Multer just wrote to `req.file`. Must run after a Multer upload
 * middleware in the chain. No-ops if no file was uploaded (e.g. for an
 * optional photo field) so it never blocks requests without a file.
 */
function verifyImageSignature(req, res, next) {
  if (!req.file) return next();

  const filePath = req.file.path;
  let isValid;
  try {
    isValid = hasValidImageSignature(filePath, req.file.mimetype);
  } catch (err) {
    // Fail closed: if we can't even read the file back, don't trust it.
    isValid = false;
  }

  if (!isValid) {
    fs.unlink(filePath, () => {});
    return next(new AppError('Uploaded file does not appear to be a valid image.', HTTP_STATUS.BAD_REQUEST));
  }

  next();
}

const { HTTP_STATUS, UPLOAD_LIMITS } = require('../constants');
const AppError = require('../utils/AppError');
const { createUploader, UPLOAD_SUBFOLDERS } = require('../utils/uploadConfig');

/**
 * Wraps a single-file multer middleware so that Multer's own errors
 * (file too large, unsupported type via fileFilter, unexpected field name,
 * etc.) are converted into the project's standard AppError -> errorHandler
 * flow instead of surfacing as raw Multer errors or generic 500s.
 * @param {import('multer').Multer} multerInstance
 * @param {string} fieldName - form field name the file is expected under
 */
function singleFileUpload(multerInstance, fieldName) {
  const upload = multerInstance.single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(
              `File too large. Maximum allowed size is ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB.`,
              HTTP_STATUS.BAD_REQUEST
            )
          );
        }
        return next(new AppError(`Upload error: ${err.message}`, HTTP_STATUS.BAD_REQUEST));
      }

      // Errors thrown from fileFilter's cb(new Error(...)) land here.
      return next(new AppError(err.message, HTTP_STATUS.BAD_REQUEST));
    });
  };
}

const donationImageUploader = createUploader(UPLOAD_SUBFOLDERS.DONATIONS);
const profilePhotoUploader = createUploader(UPLOAD_SUBFOLDERS.PROFILES);

function chain(...middlewares) {
  return (req, res, next) => {
    let i = 0;
    const run = (err) => {
      if (err) return next(err);
      const mw = middlewares[i++];
      if (!mw) return next();
      mw(req, res, run);
    };
    run();
  };
}

module.exports = {
  uploadDonationImageMiddleware: chain(singleFileUpload(donationImageUploader, 'photo'), verifyImageSignature),
  uploadProfilePhotoMiddleware: chain(singleFileUpload(profilePhotoUploader, 'photo'), verifyImageSignature),
  verifyImageSignature,
};
