import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, ExternalLink, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, apiKey, onApiKeyChange }: ApiKeyModalProps) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (!tempKey.trim()) {
      toast.error('Por favor ingresa una API key válida');
      return;
    }
    
    onApiKeyChange(tempKey.trim());
    toast.success('API key guardada');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="w-5 h-5 text-[#e91e63]" />
            API Key
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Ingresá tu API key de Google Gemini para usar DIVA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/80">Gemini API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="diva-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-white/40">
              Tu key se guarda localmente y nunca se envía a nuestros servidores.
            </p>
          </div>

          <div className="bg-[#121212] rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-white/80">Cómo obtener tu API key:</p>
            <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
              <li>Andá a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#e91e63] hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
              <li>Iniciá sesión con tu cuenta de Google</li>
              <li>Hacé clic en "Create API Key"</li>
              <li>Copiala y pegala aquí</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 diva-btn"
          >
            <Check className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
