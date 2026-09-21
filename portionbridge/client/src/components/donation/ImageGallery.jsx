import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from 'lucide-react';

/**
 * ImageGallery component for displaying donation images with premium grid and lightbox
 */
export function ImageGallery({ images = [], coverImage }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const allImages = coverImage ? [coverImage, ...(images || [])] : (images || []);

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-page/50 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-2 shadow-pb-subtle">
          <ImageIcon size={20} className="text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-secondary">No images uploaded</p>
        <p className="text-xs text-text-muted mt-0.5">The donor didn't attach photos for this item.</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allImages.map((image, index) => (
          <div
            key={index}
            onClick={() => handleImageClick(index)}
            className={`
              group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-border/60 bg-surface shadow-pb-subtle
              ${index === 0 && allImages.length > 1 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto sm:h-full' : ''}
              hover:border-dash-primary/50 transition-all duration-200 hover:shadow-pb-elevated
            `}
          >
            <img
              src={image}
              alt={`Donation item ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="p-2 rounded-full bg-white/90 text-text-primary shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                <Maximize2 size={16} />
              </span>
            </div>
            {index === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider">
                Cover Photo
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close image viewer"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <X size={20} />
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
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Main Focused Image */}
          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center p-2">
            <img
              src={allImages[selectedIndex]}
              alt={`Donation photo ${selectedIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Image Counter Badge */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-medium tracking-wide">
              {selectedIndex + 1} of {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

