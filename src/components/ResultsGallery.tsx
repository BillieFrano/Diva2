import { useState } from 'react';
import { Download, X, ZoomIn } from 'lucide-react';
import type { ImageFile } from '@/types';

interface ResultsGalleryProps {
  images: ImageFile[];
}

export function ResultsGallery({ images }: ResultsGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

  const completedImages = images.filter((img) => img.result);

  if (completedImages.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <p>Aún no hay resultados. Empezá a procesar prendas.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {completedImages.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.result}
              alt={`Resultado ${image.file.name}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#e91e63] transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="max-w-4xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.result}
              alt="Resultado"
              className="max-w-full max-h-[85vh] rounded-lg"
            />

            <div className="mt-4 flex justify-center gap-3">
              <a
                href={selectedImage.result}
                download={`diva-resultado-${selectedImage.file.name}`}
                className="flex items-center gap-2 px-4 py-2 bg-[#e91e63] text-white rounded-lg hover:bg-[#d81b60] transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
