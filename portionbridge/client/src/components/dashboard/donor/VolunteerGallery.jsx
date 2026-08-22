import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

/**
 * Volunteer Photo Gallery Component
 * Displays volunteer's photos with lightbox
 */
const VolunteerGallery = ({ volunteer }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const images = Array.isArray(volunteer?.photos) ? volunteer.photos : [];

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Photo Gallery</h2>
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Photo Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => handleImageClick(image)}
              className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
            >
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-xs">{image.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={handleCloseLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseLightbox();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {selectedImage.url ? (
              <img
                src={selectedImage.url}
                alt={selectedImage.caption}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div className="w-96 h-96 flex flex-col items-center justify-center text-gray-400 bg-gray-800 rounded-lg">
                <ImageIcon className="w-16 h-16 mb-4" />
                <span className="text-lg">{selectedImage.caption}</span>
                <span className="text-sm mt-2">Image not available</span>
              </div>
            )}
            <p className="text-white text-center mt-4">{selectedImage.caption}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default VolunteerGallery;
