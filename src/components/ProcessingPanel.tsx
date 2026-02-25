import type { ProcessingState } from '@/types';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProcessingPanelProps {
  state: ProcessingState;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
}

export function ProcessingPanel({
  state,
  pendingCount,
  completedCount,
  totalCount,
}: ProcessingPanelProps) {
  if (totalCount === 0) return null;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-white/60">
            Total: <span className="text-white font-semibold">{totalCount}</span>
          </span>
          <span className="text-white/60">
            Listas: <span className="text-green-400 font-semibold">{completedCount}</span>
          </span>
          <span className="text-white/60">
            Pendientes: <span className="text-yellow-400 font-semibold">{pendingCount}</span>
          </span>
        </div>
        {state.isProcessing && (
          <span className="text-[#e91e63] font-semibold">
            {state.currentIndex} / {state.total}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {state.isProcessing && (
        <div className="space-y-2">
          <div className="diva-progress h-2">
            <div 
              className="diva-progress-bar h-full"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="w-4 h-4 animate-spin text-[#e91e63]" />
            Procesando con Gemini 3 Pro...
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1 text-yellow-400">
          <Clock className="w-3 h-3" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400">
          <Loader2 className="w-3 h-3" />
          <span>Procesando</span>
        </div>
        <div className="flex items-center gap-1 text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Listo</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}
