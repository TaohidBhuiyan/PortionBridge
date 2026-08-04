import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';

/**
 * Step 4 - Images Upload
 * Drag & drop, multiple images, cover image selection, preview
 */
export function Step4Images({ formData, errors, onChange, onValidationChange }) {
  const { images, coverImage } = formData;
  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);

  // Validation - images are optional
  React.useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add('border-purple-500', 'bg-purple-50', 'dark:bg-purple-950/20');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-950/20');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-950/20');
    }

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are allowed');
        return false;
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    onChange('images', [...(images || []), ...newImages]);
  };

  const handleRemoveImage = (imageId) => {
    const updatedImages = (images || []).filter(img => img.id !== imageId);
    onChange('images', updatedImages);
    
    // If cover image was removed, reset it
    if (coverImage === imageId) {
      onChange('coverImage', null);
    }
  };

  const handleSetCoverImage = (imageId) => {
    onChange('coverImage', imageId);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        ref={dragAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${errors.images 
            ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-400 dark:hover:border-purple-500'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload images"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
            <Upload size={32} className="text-purple-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Upload Images
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag & drop files here, or click to browse
            </p>
          </div>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ImageIcon size={18} />
            Browse Files
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Supported formats: JPEG, PNG, WebP</p>
            <p>Maximum file size: 5MB per image</p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images && images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Uploaded Images ({images.length})
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Select cover image
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 group
                  ${coverImage === image.id
                    ? 'border-purple-500 ring-2 ring-purple-500/20'
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {/* Image Preview */}
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Badge */}
                {coverImage === image.id && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Check size={12} />
                    Cover
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(image.id)}
                    className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                    title="Set as cover"
                    aria-label="Set as cover image"
                  >
                    <Check size={16} className="text-gray-900" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="p-2 bg-white/90 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X size={16} className="text-gray-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Images State */}
      {(!images || images.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <ImageIcon size={24} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No images uploaded yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Images are optional but recommended
          </p>
        </div>
      )}

      {/* Error Message */}
      {errors.images && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={14} />
          {errors.images}
        </p>
      )}
    </div>
  );
}
