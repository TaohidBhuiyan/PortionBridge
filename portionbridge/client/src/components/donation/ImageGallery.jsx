import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ImageGallery component for displaying donation images
 */
export function ImageGallery({ images = [], coverImage }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const allImages = coverImage ? [coverImage, ...(images || [])] : (images || []);

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-page border border-border rounded-xl flex items-center justify-center">
        <p className="text-sm text-text-secondary">No images</p>
      </div>
    );
  }

  const handleImageClick = (index) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {allImages.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(index)}
            className={`
              aspect-square rounded-xl overflow-hidden cursor-pointer
              ${index === 0 ? 'col-span-2 row-span-2' : ''}
              hover:opacity-90 transition-opacity
            `}
          >
            <img
              src={image}
              alt={`Donation image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close image viewer"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Navigation Buttons */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                aria-label="Previous image"
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={allImages[selectedIndex]}
            alt={`Donation image ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {selectedIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
