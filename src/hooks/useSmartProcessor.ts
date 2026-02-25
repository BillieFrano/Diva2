import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageFile, ProcessingState } from '@/types';
import { processImageWithGemini, type ImageConfig } from '@/services/geminiService';
import {
  analizarPrenda,
  seleccionarImagenBase,
  generarPromptEnriquecido,
  guardarAnalisis,
  obtenerAnalisis,
  generarImageId,
  type AnalisisPrenda,
} from '@/services/smartAnalysisService';

const MAX_FILES = 200;

export interface SmartImageFile extends ImageFile {
  analisis?: AnalisisPrenda;
  imagenBaseSeleccionada?: string;
}

export function useSmartProcessor() {
  const [variableImages, setVariableImages] = useState<SmartImageFile[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentIndex: 0,
    total: 0,
    progress: 0,
  });
  const [imageConfig, setImageConfig] = useState<ImageConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vto_imageConfig');
      return saved ? JSON.parse(saved) : { aspectRatio: '16:9', imageSize: '2K' };
    }
    return { aspectRatio: '16:9', imageSize: '2K' };
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Guardar config en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vto_imageConfig', JSON.stringify(imageConfig));
    }
  }, [imageConfig]);

  // Agregar imágenes variables (prendas)
  const addVariableImages = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: SmartImageFile[] = [];
    const remainingSlots = MAX_FILES - variableImages.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageId = generarImageId(file);
          const analisisGuardado = obtenerAnalisis(imageId);

          const newImage: SmartImageFile = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: reader.result as string,
            status: 'pending',
            analisis: analisisGuardado || undefined,
          };
          newFiles.push(newImage);

          if (newFiles.length === Math.min(files.length, remainingSlots)) {
            setVariableImages((prev) => [...prev, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [variableImages.length]);

  const removeVariableImage = useCallback((id: string) => {
    setVariableImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearVariableImages = useCallback(() => {
    setVariableImages([]);
  }, []);

  // Analizar una imagen individual
  const analizarImagen = useCallback(async (
    image: SmartImageFile,
    apiKey: string
  ): Promise<AnalisisPrenda> => {
    // Si ya tiene análisis guardado, usarlo
    if (image.analisis) {
      return image.analisis;
    }

    // Analizar con Gemini
    const analisis = await analizarPrenda(image.preview, apiKey);

    // Guardar análisis
    const imageId = generarImageId(image.file);
    guardarAnalisis(imageId, analisis);

    // Actualizar la imagen con el análisis
    setVariableImages((prev) =>
      prev.map((img) =>
        img.id === image.id ? { ...img, analisis } : img
      )
    );

    return analisis;
  }, []);

  // Procesar todas las imágenes pendientes
  const startProcessing = useCallback(async (
    apiKey: string,
    customImageConfig?: ImageConfig
  ) => {
    if (variableImages.length === 0) return;

    const configToUse = customImageConfig || imageConfig;
    abortControllerRef.current = new AbortController();

    setProcessingState({
      isProcessing: true,
      currentIndex: 0,
      total: variableImages.length,
      progress: 0,
    });

    const pendingImages = variableImages.filter((img) => img.status === 'pending');
    console.log(`[Processor] Iniciando procesamiento. Total: ${variableImages.length}, Pendientes: ${pendingImages.length}`);

    for (let i = 0; i < pendingImages.length; i++) {
      if (abortControllerRef.current.signal.aborted) break;

      const image = pendingImages[i];
      const actualIndex = variableImages.findIndex((img) => img.id === image.id);
      console.log(`[Processor] Procesando ${image.file.name} - Índice en array: ${actualIndex}`);
      
      if (actualIndex === -1) {
        console.error('[Processor] ERROR: No se encontró la imagen en el array');
        continue;
      }

      // Actualizar estado a procesando
      setVariableImages((prev) =>
        prev.map((img, idx) =>
          idx === actualIndex ? { ...img, status: 'processing' } : img
        )
      );

      setProcessingState((prev) => ({
        ...prev,
        currentIndex: i + 1,
        progress: Math.round(((i + 1) / pendingImages.length) * 100),
      }));

      try {
        console.log(`[Processor] Procesando imagen ${i + 1}/${pendingImages.length}:`, image.file.name);
        
        // PASO 1: Analizar la prenda (si no está analizada)
        console.log('[Processor] Paso 1: Analizando prenda...');
        const analisis = await analizarImagen(image, apiKey);
        console.log('[Processor] Análisis:', analisis);

        // PASO 2: Seleccionar imagen base según pose
        const imagenBasePath = seleccionarImagenBase(analisis.poseDetectada);
        console.log('[Processor] Paso 2: Imagen base seleccionada:', imagenBasePath);

        // PASO 3: Cargar la imagen base
        console.log('[Processor] Paso 3: Cargando imagen base...');
        const imagenBaseResponse = await fetch(imagenBasePath);
        if (!imagenBaseResponse.ok) {
          throw new Error(`No se pudo cargar la imagen base: ${imagenBasePath}`);
        }
        const imagenBaseBlob = await imagenBaseResponse.blob();
        const imagenBaseDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imagenBaseBlob);
        });
        console.log('[Processor] Imagen base cargada correctamente');

        // PASO 4: Generar prompt enriquecido
        const promptEnriquecido = generarPromptEnriquecido(analisis);
        console.log('[Processor] Paso 4: Prompt generado');

        // PASO 5: Procesar con Gemini
        console.log('[Processor] Paso 5: Llamando a Gemini...');
        const result = await processImageWithGemini(
          imagenBaseDataUrl,
          image.preview,
          apiKey,
          promptEnriquecido,
          configToUse,
          abortControllerRef.current.signal
        );
        console.log('[Processor] Resultado recibido de Gemini, length:', result.length);

        // Actualizar con resultado
        console.log('[Processor] Actualizando estado con resultado...');
        setVariableImages((prev) => {
          console.log('[Processor] setVariableImages llamado, actualIndex:', actualIndex);
          return prev.map((img, idx) =>
            idx === actualIndex
              ? { ...img, status: 'completed', result, imagenBaseSeleccionada: imagenBasePath }
              : img
          );
        });
        console.log('[Processor] Estado actualizado');
      } catch (error) {
        console.error('[Processor] Error procesando imagen:', error);
        setVariableImages((prev) =>
          prev.map((img, idx) =>
            idx === actualIndex
              ? { ...img, status: 'error', error: error instanceof Error ? error.message : 'Error desconocido' }
              : img
          )
        );
      }
    }

    setProcessingState((prev) => ({
      ...prev,
      isProcessing: false,
    }));
  }, [variableImages, imageConfig, analizarImagen]);

  const stopProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    setProcessingState((prev) => ({
      ...prev,
      isProcessing: false,
    }));
  }, []);

  const resetCompleted = useCallback(() => {
    setVariableImages((prev) =>
      prev.map((img) =>
        img.status === 'completed'
          ? { ...img, status: 'pending', result: undefined, imagenBaseSeleccionada: undefined }
          : img
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setVariableImages([]);
    setProcessingState({
      isProcessing: false,
      currentIndex: 0,
      total: 0,
      progress: 0,
    });
  }, []);

  return {
    variableImages,
    processingState,
    imageConfig,
    setImageConfig,
    addVariableImages,
    removeVariableImage,
    clearVariableImages,
    startProcessing,
    stopProcessing,
    resetCompleted,
    clearAll,
    canProcess: variableImages.length > 0 && !processingState.isProcessing,
    completedCount: variableImages.filter((img) => img.status === 'completed').length,
    pendingCount: variableImages.filter((img) => img.status === 'pending').length,
  };
}
