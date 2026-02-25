import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Plus } from 'lucide-react';
import type { ImageFile } from '@/types';

interface VariableImagesUploaderProps {
  images: ImageFile[];
  onImagesAdd: (files: FileList | null) => void;
  onImageRemove: (id: string) => void;
  onClearAll: () => void;
  maxFiles: number;
}

export function VariableImagesUploader({
  images,
  onImagesAdd,
  onImageRemove,
  onClearAll,
  maxFiles,
}: VariableImagesUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const dataTransfer = new DataTransfer();
      acceptedFiles.forEach((file) => dataTransfer.items.add(file));
      onImagesAdd(dataTransfer.files);
    },
    [onImagesAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    noClick: images.length > 0,
    disabled: images.length >= maxFiles,
  });

  const getStatusColor = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'processing': return 'border-blue-500/50 bg-blue-500/5';
      case 'completed': return 'border-green-500/50 bg-green-500/5';
      case 'error': return 'border-red-500/50 bg-red-500/5';
      default: return 'border-white/10';
    }
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending': return <span className="text-yellow-400 text-xs">Pendiente</span>;
      case 'processing': return <span className="text-blue-400 text-xs">Procesando...</span>;
      case 'completed': return <span className="text-green-400 text-xs">Listo</span>;
      case 'error': return <span className="text-red-400 text-xs">Error</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          diva-upload aspect-video flex flex-col items-center justify-center cursor-pointer
          ${images.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragActive ? 'border-[#e91e63] bg-[#e91e63]/5' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Plus className="w-8 h-8 text-white/40" />
        </div>
        <p className="text-white/60 text-sm">
          {images.length >= maxFiles 
            ? 'Máximo de imágenes alcanzado' 
            : isDragActive 
              ? 'Soltar aquí' 
              : 'Agregar más prendas'
          }
        </p>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                relative aspect-square rounded-xl overflow-hidden border-2
                ${getStatusColor(image.status)}
              `}
            >
              <img
                src={image.preview}
                alt={image.file.name}
                className="w-full h-full object-cover"
              />
              
              {/* Status Badge */}
              <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
                {getStatusIcon(image.status)}
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => onImageRemove(image.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-[#e91e63] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear All */}
      {images.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-white/40 text-sm hover:text-[#e91e63] transition-colors"
        >
          Limpiar todo ({images.length})
        </button>
      )}
    </div>
  );
}
