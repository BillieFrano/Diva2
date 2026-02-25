export interface ImageConfig {
  aspectRatio: string;
  imageSize: string;
}

export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 Cuadrado' },
  { value: '3:4', label: '3:4 Vertical' },
  { value: '4:3', label: '4:3 Horizontal' },
  { value: '16:9', label: '16:9 Panorámico' },
  { value: '9:16', label: '9:16 Stories' },
];

export const IMAGE_SIZES = [
  { value: '1K', label: '1K (1024x1024)' },
  { value: '2K', label: '2K (2048x2048)' },
  { value: '4K', label: '4K (4096x4096)' },
];

// Usar el modelo correcto para generación de imágenes
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';

export async function processImageWithGemini(
  baseImageDataUrl: string,
  garmentImageDataUrl: string,
  apiKey: string,
  prompt: string,
  imageConfig: ImageConfig,
  signal?: AbortSignal
): Promise<string> {
  console.log('[Gemini] Iniciando proceso...');
  console.log('[Gemini] API Key:', apiKey.substring(0, 10) + '...');
  console.log('[Gemini] Prompt:', prompt.substring(0, 100) + '...');
  
  const baseImageBase64 = baseImageDataUrl.split(',')[1];
  const garmentImageBase64 = garmentImageDataUrl.split(',')[1];
  
  if (!baseImageBase64 || !garmentImageBase64) {
    throw new Error('Error al extraer datos base64 de las imágenes');
  }
  
  const baseMimeType = baseImageDataUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const garmentMimeType = garmentImageDataUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

  const [width, height] = getImageDimensions(imageConfig.aspectRatio, imageConfig.imageSize);
  console.log('[Gemini] Dimensiones:', width, 'x', height);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: baseMimeType,
              data: baseImageBase64,
            },
          },
          {
            inlineData: {
              mimeType: garmentMimeType,
              data: garmentImageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      responseModalities: ['Text', 'Image'],
    },
  };

  console.log('[Gemini] Enviando request...');
  
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  console.log('[Gemini] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini] Error response:', errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }
    throw new Error(
      errorData?.error?.message || `Error HTTP ${response.status}`
    );
  }

  const data = await response.json();
  console.log('[Gemini] Response data:', JSON.stringify(data, null, 2).substring(0, 500));
  
  // Buscar imagen en la respuesta
  const candidate = data.candidates?.[0];
  if (!candidate) {
    console.error('[Gemini] No candidates found:', data);
    throw new Error('No se recibieron candidatos en la respuesta');
  }
  
  const parts = candidate.content?.parts;
  if (!parts || !Array.isArray(parts)) {
    console.error('[Gemini] No parts found:', candidate);
    throw new Error('No se encontraron partes en la respuesta');
  }
  
  const imagePart = parts.find(
    (part: { inlineData?: { data: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    console.error('[Gemini] No image data found. Parts:', parts);
    throw new Error('No se recibió imagen en la respuesta');
  }

  console.log('[Gemini] Imagen recibida correctamente');
  return `data:image/png;base64,${imagePart.inlineData.data}`;
}

function getImageDimensions(aspectRatio: string, size: string): [number, number] {
  const sizeMap: Record<string, number> = {
    '1K': 1024,
    '2K': 2048,
    '4K': 4096,
  };
  
  const baseSize = sizeMap[size] || 2048;
  
  const ratioMap: Record<string, [number, number]> = {
    '1:1': [baseSize, baseSize],
    '3:4': [Math.round(baseSize * 0.75), baseSize],
    '4:3': [baseSize, Math.round(baseSize * 0.75)],
    '16:9': [baseSize, Math.round(baseSize * 0.5625)],
    '9:16': [Math.round(baseSize * 0.5625), baseSize],
  };
  
  return ratioMap[aspectRatio] || [baseSize, baseSize];
}
