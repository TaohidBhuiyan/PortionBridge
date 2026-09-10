import React, { useRef } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  Star, 
  Sparkles, 
  Camera, 
  Info
} from 'lucide-react';

const MAX_IMAGES = 6;

/**
 * Step 4 - Images Upload
 * Drag & drop, multiple images, primary cover image selection, preview gallery
 * Ultra-premium dropzone with glowing borders and helpful photography tips.
 */
export function Step4Images({ formData, errors, onChange, onValidationChange }) {
  const { images = [], coverImage } = formData;
  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);

  // Validation - images are optional but recommended
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
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      alert(`You can upload a maximum of ${MAX_IMAGES} photos.`);
      return;
    }

    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPEG, PNG, and WebP images are supported');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Each image file size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    const updated = [...images, ...newImages];
    onChange('images', updated);

    // Auto-set the first uploaded image as cover if not set
    if (!coverImage && newImages[0]) {
      onChange('coverImage', newImages[0].id);
    }
  };

  const handleRemoveImage = (imageId) => {
    const updatedImages = images.filter((img) => img.id !== imageId);
    onChange('images', updatedImages);

    if (coverImage === imageId) {
      onChange('coverImage', updatedImages.length > 0 ? updatedImages[0].id : null);
    }
  };

  const handleSetCoverImage = (imageId) => {
    onChange('coverImage', imageId);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const isClothes = formData.category === 'clothes';

  return (
    <div className="space-y-7">
      {/* Ribbon Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-dash-primary-soft text-dash-primary flex items-center justify-center">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Verification Photos</h3>
            <p className="text-xs text-text-muted">
              {isClothes
                ? 'Upload clear photos showing clothing condition, labels, and clean folding'
                : 'Upload photos showing food packaging, freshness, and hygienic containers'}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
          Step 4 of 6
        </span>
      </div>

      {/* Upload Dropzone */}
      <div
        ref={dragAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 ${
          errors.images 
            ? 'border-danger bg-danger-soft/30' 
            : 'border-border/90 bg-surface hover:border-dash-primary/60 hover:bg-surface-hover/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload donation images"
        />

        <div className="flex flex-col items-center gap-3.5 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dash-primary-soft to-indigo-500/10 text-dash-primary flex items-center justify-center shadow-inner">
            <Upload size={28} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Drag & Drop Your Donation Photos Here
            </h4>
            <p className="text-xs text-text-secondary mt-1">
              or click the button below to browse from your device
            </p>
          </div>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs bg-dash-primary hover:bg-dash-primary-hover text-white font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
          >
            <ImageIcon size={15} />
            Browse Images
          </button>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-text-muted mt-1">
            <span>• Max {MAX_IMAGES} photos</span>
            <span>• Up to 5MB each</span>
            <span>• JPEG, PNG, or WebP</span>
          </div>
        </div>
      </div>

      {/* Image Previews & Cover Selection */}
      {images.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Uploaded Photos ({images.length} / {MAX_IMAGES})
              </h4>
              <span className="text-[11px] text-text-muted">
                (Click the star on any image to set it as Cover)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => {
              const isCover = coverImage === image.id || (!coverImage && index === 0);

              return (
                <div
                  key={image.id}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-page shadow-xs ${
                    isCover
                      ? 'border-dash-primary ring-2 ring-dash-primary/30 shadow-md'
                      : 'border-border/80 hover:border-dash-primary/40'
                  }`}
                >
                  {/* Photo Preview */}
                  <img
                    src={image.preview}
                    alt={`Donation photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Primary Cover Badge */}
                  {isCover && (
                    <div className="absolute top-2 left-2 bg-dash-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star size={10} className="fill-amber-300 text-amber-300" />
                      Main Cover
                    </div>
                  )}

                  {/* Interactive Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(image.id)}
                        className="px-2.5 py-1.5 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-dash-primary hover:text-white transition-colors flex items-center gap-1 shadow-sm"
                        title="Set as Main Cover"
                      >
                        <Star size={12} />
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="p-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border/70 text-text-secondary">
          <Info size={18} className="shrink-0 text-dash-primary" />
          <p className="text-xs leading-relaxed">
            Images are optional, but donations with clear photos are accepted by volunteers <span className="font-bold text-text-primary">3x faster</span>.
          </p>
        </div>
      )}

      {/* Photography Tips Card */}
      <div className="p-4 rounded-2xl bg-page border border-border/70 flex items-start gap-3">
        <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-text-muted space-y-1">
          <p className="font-semibold text-text-primary">
            {isClothes ? 'Clothing Photography Tips:' : 'Food Verification Photography Tips:'}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {isClothes ? (
              <>
                <li>Show full garment layout in good lighting.</li>
                <li>Capture visible brand, size, and care labels to help recipients.</li>
                <li>Verify clean, folded condition or bundle packaging.</li>
              </>
            ) : (
              <>
                <li>Show sealed, clean food containers and portion volume clearly.</li>
                <li>Include preparation or expiry date labels if available.</li>
                <li>Ensure food is kept hygienic and avoid opening in dusty areas.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {errors.images && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertCircle size={14} />
          {errors.images}
        </p>
      )}
    </div>
  );
}