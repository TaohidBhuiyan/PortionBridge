const multer = require('multer');
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

module.exports = {
  uploadDonationImageMiddleware: singleFileUpload(donationImageUploader, 'photo'),
  uploadProfilePhotoMiddleware: singleFileUpload(profilePhotoUploader, 'photo'),
};
