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
      dragAreaRef.current.classList.add('border-dash-primary', 'bg-dash-primary-soft');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-dash-primary', 'bg-dash-primary-soft');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-dash-primary', 'bg-dash-primary-soft');
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
    <div className="space-y-5">
      {/* Upload Area */}
      <div
        ref={dragAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border border-dashed rounded-lg p-6 text-center transition-colors ${
          errors.images ? 'border-danger bg-danger-soft' : 'border-border bg-page hover:border-dash-primary/50'
        }`}
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

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-dash-primary-soft flex items-center justify-center">
            <Upload size={22} className="text-dash-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary mb-0.5">
              Upload Images
            </p>
            <p className="text-xs text-text-secondary mb-3">
              Drag & drop files here, or click to browse
            </p>
          </div>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary focus-visible:ring-offset-2"
          >
            <ImageIcon size={15} />
            Browse Files
          </button>
          <div className="text-xs text-text-secondary space-y-0.5">
            <p>Supported formats: JPEG, PNG, WebP</p>
            <p>Maximum file size: 5MB per image</p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images && images.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-primary">
              Uploaded Images ({images.length})
            </h4>
            <span className="text-xs text-text-secondary">
              Select cover image
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square rounded-lg overflow-hidden border transition-colors group ${
                  coverImage === image.id ? 'border-dash-primary ring-2 ring-dash-primary/20' : 'border-border'
                }`}
              >
                {/* Image Preview */}
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Badge */}
                {coverImage === image.id && (
                  <div className="absolute top-2 left-2 bg-dash-primary text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} />
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
                    <Check size={15} className="text-gray-900" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="p-2 bg-white/90 hover:bg-danger hover:text-white rounded-full transition-colors"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X size={15} className="text-gray-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-text-secondary">
            Images are optional but recommended
          </p>
        </div>
      )}

      {/* Error Message */}
      {errors.images && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={13} />
          {errors.images}
        </p>
      )}
    </div>
  );
}