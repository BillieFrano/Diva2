# DIVA Smart Try-On 🤖👗

Virtual Try-On con análisis inteligente de prendas usando Gemini AI.

## Features

- 📤 **Subida múltiple de prendas** - Arrastra y suelta hasta 200 imágenes
- 🧠 **Análisis con Gemini AI** - Detección automática de tipo de prenda
- 👤 **Modelo ANA** - 4 poses base seleccionadas automáticamente según la prenda
- 📐 **Configuración flexible** - Múltiples aspect ratios y resoluciones
- 💾 **Descarga en lote** - Exporta todos los resultados en ZIP

## Tecnologías

- React 19 + TypeScript
- Tailwind CSS
- Google Gemini API
- Vite

## Uso

1. Obtén tu API key de Gemini en [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sube fotos de prendas
3. La IA detecta automáticamente el tipo (remera, pantalón, vestido, etc.)
4. Selecciona la pose del modelo ANA apropiada
5. Genera imágenes del try-on

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

```bash
# 1. Git + GitHub
git init
git add .
git commit -m "Initial commit"
gh repo create diva-smart-tryon --public --source=. --push

# 2. Vercel
vercel --prod
```

---

Desarrollado con ❤️ por DIVA
