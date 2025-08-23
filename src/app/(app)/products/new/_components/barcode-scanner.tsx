
'use client';

import { useState } from 'react';
import { Barcode } from 'lucide-react';
import { useZxing } from 'react-zxing';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);

  const { ref } = useZxing({
    paused: hasPermission === false,
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(err) {
      // Ignore o erro que acontece quando nenhum código é encontrado
      if (err instanceof Error && err.name === 'NotFoundException') {
        return;
      }
      console.error('ZXing Error:', err);
    },
    onMediaStream(stream) {
        // Se recebermos um stream, significa que a permissão foi concedida.
        if (stream) {
            setHasPermission(true);
        }
    },
    onMediaError(err) {
        // Trata erros de permissão especificamente
        if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
            console.error('Camera permission denied:', err);
            setHasPermission(false);
        } else {
            console.error('Media Error:', err);
        }
    }
  });

  // O onClose do Dialog é chamado quando o usuário clica fora ou no 'X'
  const handleDialogClose = () => {
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Escanear Código de Barras</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black">
          {/* O vídeo só é renderizado se a permissão não for negada */}
          {hasPermission !== false && <video ref={ref} className="h-full w-full object-cover" />}
          
          {/* Overlay do Viewfinder */}
          {hasPermission === true && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
            </div>
          )}

          {/* Mensagem de Câmera Desligada ou Erro de Permissão */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Alert variant="destructive">
                <Barcode className="h-4 w-4" />
                <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                <AlertDescription>
                  Por favor, habilite a permissão da câmera nas configurações do seu navegador para escanear.
                </AlertDescription>
              </Alert>
            </div>
          )}
           {/* Estado inicial, antes de saber a permissão */}
          {hasPermission === undefined && (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-white">Solicitando acesso à câmera...</p>
             </div>
          )}
        </div>
        <div className="p-6 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              Aponte a câmera para o código de barras do produto.
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
