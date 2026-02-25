// Servicio de análisis inteligente para DIVA
// Analiza la imagen variable y selecciona la pose base correcta

// API Key hardcodeada
const API_KEY = 'AIzaSyDuz0aretbrMrWTqVwM4OdMoTOuM1uUzaI';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Las 4 poses del modelo base (pre-cargadas en el sistema)
export const MODELO_BASE_POSES = {
  frontal: '/modelos/pose_frontal.jpg',
  medio_perfil: '/modelos/pose_medio_perfil.jpg',
  espalda: '/modelos/pose_espalda.jpg',
  detalle_pantalon: '/modelos/pose_detalle_pantalon.jpg',
} as const;

export type PoseType = keyof typeof MODELO_BASE_POSES;

// Interfaz del análisis
export interface AnalisisPrenda {
  poseDetectada: PoseType;
  tipoPrenda: string;
  material: string;
  color: string;
  detalles: string;
  timestamp: string;
}

// Prompt de análisis
const PROMPT_ANALISIS = `Analiza esta imagen de una prenda de ropa y responde EXACTAMENTE en este formato JSON:

{
  "poseDetectada": "frontal" | "medio_perfil" | "espalda" | "detalle_pantalon",
  "tipoPrenda": "descripción del tipo de prenda",
  "material": "descripción del material/textura",
  "color": "color principal",
  "detalles": "detalles importantes: botones, bolsillos, etiquetas, estampados, costuras, etc"
}

INSTRUCCIONES PARA DETECTAR POSE (MUY IMPORTANTE):

1. "detalle_pantalon" - USA ESTA CUANDO:
   - La imagen muestra SOLO la parte inferior del cuerpo (cintura para abajo)
   - Es un primer plano/crop de pantalón, jeans o falda
   - NO se ve la cara, cabeza, torso completo ni hombros
   - Solo se ven piernas, cadera y cintura
   - El encuadre está cortado por arriba de la cintura

2. "frontal" - USA ESTA CUANDO:
   - La persona mira directo a cámara
   - Se ve el cuerpo COMPLETO o al menos desde la cintura hacia arriba
   - Se ve la cara o el torso completo

3. "medio_perfil" - USA ESTA CUANDO:
   - La persona está de 3/4, entre frontal y perfil (45° aprox)
   - Se ve el cuerpo COMPLETO o al menos desde la cintura hacia arriba

4. "espalda" - USA ESTA CUANDO:
   - La persona está de espaldas
   - Se ve el cuerpo COMPLETO o al menos desde la cintura hacia arriba

REGLA DE ORO: Si la imagen está cortada y solo muestra pantalón/piernas (sin cara ni torso completo), SIEMPRE usa "detalle_pantalon".

Sé muy específico y detallado. Responde SOLO el JSON, sin texto adicional.`;

// Función para analizar la imagen variable
export async function analizarPrenda(
  imagenDataUrl: string,
  _apiKey: string // ignorado, usamos la hardcodeada
): Promise<AnalisisPrenda> {
  const imageBase64 = imagenDataUrl.split(',')[1];
  const mimeType = imagenDataUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: PROMPT_ANALISIS,
          },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      responseModalities: ['Text'],
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extraer JSON de la respuesta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear el análisis');
    }

    const analisis: AnalisisPrenda = JSON.parse(jsonMatch[0]);
    analisis.timestamp = new Date().toISOString();

    return analisis;
  } catch (error) {
    console.error('Error en análisis:', error);
    // Fallback: asumir frontal
    return {
      poseDetectada: 'frontal' as const,
      tipoPrenda: 'prenda de vestir',
      material: 'no especificado',
      color: 'no especificado',
      detalles: 'no especificado',
      timestamp: new Date().toISOString(),
    };
  }
}

// Función para seleccionar la imagen base según la pose
export function seleccionarImagenBase(poseDetectada: string): string {
  // Normalizar la pose detectada
  const poseNormalizada = poseDetectada.toLowerCase().trim();

  // Mapeo de poses variantes a las 4 poses base
  // Prioridad: detalle_pantalon primero
  if (
    poseNormalizada.includes('detalle_pantalon') || 
    poseNormalizada.includes('detalle pantalon') ||
    poseNormalizada.includes('primer plano') ||
    poseNormalizada.includes('primer_plano') ||
    poseNormalizada.includes('crop') ||
    poseNormalizada.includes('closeup') ||
    poseNormalizada.includes('close-up')
  ) {
    return MODELO_BASE_POSES.detalle_pantalon;
  }

  if (poseNormalizada.includes('frontal') || poseNormalizada.includes('frente')) {
    return MODELO_BASE_POSES.frontal;
  }

  if (
    poseNormalizada.includes('medio') ||
    poseNormalizada.includes('3/4') ||
    poseNormalizada.includes('tres cuartos') ||
    poseNormalizada.includes('perfil')
  ) {
    return MODELO_BASE_POSES.medio_perfil;
  }

  if (poseNormalizada.includes('espalda') || poseNormalizada.includes('atras') || poseNormalizada.includes('atrás')) {
    return MODELO_BASE_POSES.espalda;
  }

  // Default: frontal
  return MODELO_BASE_POSES.frontal;
}

// Función para generar el prompt enriquecido
export function generarPromptEnriquecido(analisis: AnalisisPrenda): string {
  const detallesPrenda = `

DETALLES DE LA PRENDA A REPLICAR:
- Tipo: ${analisis.tipoPrenda}
- Material/Textura: ${analisis.material}
- Color: ${analisis.color}
- Características: ${analisis.detalles}`;

  return `editar la imagen que dice BASE, mantener todo exactamente igual, misma iluminacion, mismo fondo, mismo aspect ratio, camara color gradient, balance de blancos, iluminacion. BORRAR LA PALABRA BASE. pero cambiar toda su ropa por la de la segunda imagen. ADEMAS transferir el calzado (zapatos, botas, zapatillas) de la segunda imagen a la imagen BASE${detallesPrenda}`;
}

// Guardar análisis en localStorage
export function guardarAnalisis(imageId: string, analisis: AnalisisPrenda): void {
  const key = `diva_analisis_${imageId}`;
  localStorage.setItem(key, JSON.stringify(analisis));
}

// Recuperar análisis de localStorage
export function obtenerAnalisis(imageId: string): AnalisisPrenda | null {
  const key = `diva_analisis_${imageId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

// Generar ID único para imagen
export function generarImageId(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}
