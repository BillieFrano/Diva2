import { useState, useEffect, useCallback } from 'react';
import { useSmartProcessor, type SmartImageFile } from '@/hooks/useSmartProcessor';
import { VariableImagesUploader } from '@/components/VariableImagesUploader';
import { ProcessingPanel } from '@/components/ProcessingPanel';
import { ResultsGallery } from '@/components/ResultsGallery';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { DebugPanel, checkDebugAccess } from '@/components/DebugPanel';
import { ASPECT_RATIOS, IMAGE_SIZES } from '@/services/geminiService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { 
  User,
  Settings, 
  Download,
  Sparkles,
  Bug,
  Monitor,
  Zap,
  ArrowRight,
  Crown,
  Brain,
  Shirt
} from 'lucide-react';
import './App.css';

// API Key hardcodeada
const DEFAULT_API_KEY = 'AIzaSyDuz0aretbrMrWTqVwM4OdMoTOuM1uUzaI';

function App() {
  const [apiKey, setApiKey] = useState<string>(DEFAULT_API_KEY);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  const {
    variableImages,
    processingState,
    imageConfig,
    setImageConfig,
    addVariableImages,
    removeVariableImage,
    clearVariableImages,
    startProcessing,
    completedCount,
    pendingCount,
  } = useSmartProcessor();

  useEffect(() => {
    const hasDebugAccess = checkDebugAccess();
    setIsDebugMode(hasDebugAccess);
  }, []);

  const addDebugLog = useCallback((type: string, data: unknown) => {
    const log = { type, data, timestamp: new Date().toISOString() };
    const event = new CustomEvent('debug-log', { detail: log });
    window.dispatchEvent(event);
  }, []);

  const handleStartProcessing = async () => {
    const keyToUse = apiKey || DEFAULT_API_KEY;
    
    console.log('[App] Iniciando procesamiento con API key:', keyToUse.substring(0, 15) + '...');
    
    if (!keyToUse || keyToUse.length < 10) {
      setShowApiModal(true);
      return;
    }
    
    if (variableImages.length === 0) {
      toast.error('Por favor sube al menos una prenda');
      return;
    }
    
    addDebugLog('info', {
      action: 'start_processing',
      apiKey: keyToUse.substring(0, 10) + '...',
      variableImagesCount: variableImages.length,
      pendingCount,
      imageConfig,
    });
    
    try {
      await startProcessing(keyToUse, imageConfig);
      toast.success('¡Procesamiento completado!');
      addDebugLog('info', { action: 'processing_completed' });
    } catch (error) {
      toast.error('Error en el procesamiento');
      addDebugLog('error', { action: 'processing_error', error });
    }
  };

  const handleDownloadAll = async () => {
    const completed = variableImages.filter((img: SmartImageFile) => img.result);
    if (completed.length === 0) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    completed.forEach((img, index) => {
      if (img.result) {
        const base64Data = img.result.split(',')[1];
        zip.file(`diva-resultado-${index + 1}.png`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const { saveAs } = await import('file-saver');
    saveAs(content, 'diva-resultados.zip');
    
    toast.success(`¡${completed.length} imágenes descargadas!`);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#e91e63]" />
            <span className="text-xl font-bold tracking-wider text-white">DIVA</span>
            <span className="ml-2 px-2 py-0.5 bg-[#e91e63]/20 text-[#e91e63] text-xs rounded-full flex items-center gap-1">
              <Brain className="w-3 h-3" />
              SMART
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {isDebugMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebugPanel(true)}
                className="text-[#e91e63] hover:bg-[#e91e63]/10 h-8 w-8"
              >
                <Bug className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowApiModal(true)}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e91e63] to-[#f06292] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        {/* Hero Section - Compact */}
        <section className="py-6 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              VIRTUAL <span className="text-[#e91e63]">TRY-ON</span>
            </h1>
            <p className="text-white/50 text-sm">
              Análisis de prendas con IA
            </p>
          </div>
        </section>

        {/* Upload + Model Section - Side by Side */}
        <section className="py-4 px-6 bg-[#1a1a1a]">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              {/* Upload Section */}
              <div className="diva-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#e91e63]/20 flex items-center justify-center">
                    <Shirt className="w-3.5 h-3.5 text-[#e91e63]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Subir Prendas</h3>
                    <p className="text-white/40 text-xs">
                      {variableImages.length > 0 
                        ? `${variableImages.length} prenda${variableImages.length > 1 ? 's' : ''}`
                        : 'Agregá prendas'
                      }
                    </p>
                  </div>
                </div>
                
                <VariableImagesUploader
                  images={variableImages}
                  onImagesAdd={addVariableImages}
                  onImageRemove={removeVariableImage}
                  onClearAll={clearVariableImages}
                  maxFiles={200}
                />

                {/* Start Button */}
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      if (variableImages.length === 0) {
                        toast.error('Por favor sube al menos una prenda');
                        return;
                      }
                      handleStartProcessing();
                    }}
                    disabled={processingState.isProcessing}
                    className="diva-btn w-full py-4 text-sm rounded-xl"
                  >
                    {processingState.isProcessing ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Iniciar Procesamiento
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* ANA Model */}
              <div className="diva-card p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white/60 text-xs uppercase tracking-wider">Modelo</span>
                </div>
                
                <div className="relative">
                  <div className="w-36 h-48 md:w-40 md:h-52 rounded-xl overflow-hidden border border-white/10">
                    <img 
                      src="/modelos/ana.jpg" 
                      alt="ANA - Modelo DIVA" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* ANA Name - Cool style below */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#e91e63]/50" />
                  <span className="text-[#e91e63] font-bold text-sm tracking-widest uppercase">ANA</span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#e91e63]/50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="py-4 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-white/40" />
                <Select
                  value={imageConfig.aspectRatio}
                  onValueChange={(value) => setImageConfig(prev => ({ ...prev, aspectRatio: value }))}
                >
                  <SelectTrigger className="diva-input w-28 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value} className="text-xs">
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-white/40" />
                <Select
                  value={imageConfig.imageSize}
                  onValueChange={(value) => setImageConfig(prev => ({ ...prev, imageSize: value }))}
                >
                  <SelectTrigger className="diva-input w-28 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {IMAGE_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-xs">
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {variableImages.length > 0 && (
          <section className="py-8 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#e91e63]" />
                Resultados
              </h2>
              
              <ProcessingPanel
                state={processingState}
                pendingCount={pendingCount}
                completedCount={completedCount}
                totalCount={variableImages.length}
              />
              
              <div className="mt-4">
                <ResultsGallery images={variableImages} />
              </div>
              
              {completedCount > 0 && !processingState.isProcessing && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleDownloadAll}
                    className="diva-btn px-6 py-3 text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Todo ({completedCount})
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />

      {/* Debug Panel */}
      {isDebugMode && (
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          currentPrompt="Smart Analysis Mode"
          imageConfig={imageConfig}
        />
      )}
    </div>
  );
}

export default App;
