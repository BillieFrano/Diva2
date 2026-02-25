import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bug, Trash2, Download } from 'lucide-react';
import type { ImageConfig } from '@/services/geminiService';

interface DebugLog {
  type: string;
  data: unknown;
  timestamp: string;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  imageConfig: ImageConfig;
}

export function checkDebugAccess(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('debug') === 'true';
}

export function DebugPanel({ isOpen, onClose, currentPrompt, imageConfig }: DebugPanelProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    const handleDebugLog = (event: Event) => {
      const customEvent = event as CustomEvent<DebugLog>;
      setLogs((prev) => [...prev, customEvent.detail]);
    };

    window.addEventListener('debug-log', handleDebugLog);
    return () => window.removeEventListener('debug-log', handleDebugLog);
  }, []);

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diva-debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-[#e91e63]" />
            Debug Panel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Config */}
          <div className="bg-[#121212] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Configuración Actual</h3>
            <div className="text-xs text-white/60 space-y-1">
              <p>Aspect Ratio: {imageConfig.aspectRatio}</p>
              <p>Image Size: {imageConfig.imageSize}</p>
              <p>Prompt: {currentPrompt}</p>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-[#121212] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white/80">Logs ({logs.length})</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadLogs}
                  className="h-7 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Descargar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="h-7 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpiar
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-white/40 text-xs">No hay logs aún</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono bg-black/30 rounded p-2"
                  >
                    <span className="text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    {' '}
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }>
                      [{log.type}]
                    </span>
                    <pre className="mt-1 text-white/60 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
