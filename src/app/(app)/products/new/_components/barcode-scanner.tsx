
'use client';

import { useState, useEffect, useRef } from 'react';
import { Barcode, Zap } from 'lucide-react';
import { useZxing } from 'react-zxing';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);

  const { ref } = useZxing({
    paused: !hasPermission,
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(err) {
       if (err instanceof Error && err.name !== 'NotFoundException') {
          console.error('ZXing Error:', err);
          setError('Ocorreu um erro ao tentar escanear.');
       }
    },
  });

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const constraints = {
          video: { 
            facingMode: 'environment',
            // @ts-ignore
            focusMode: 'continuous'
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (ref.current) {
          ref.current.srcObject = stream;
        }

        const [videoTrack] = stream.getVideoTracks();
        // @ts-ignore
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
            setIsTorchSupported(true);
        }

        setMediaStream(stream);
        setHasPermission(true);
      } catch (err) {
        console.error('Camera permission error:', err);
        setHasPermission(false);
        setError(
          'A permissão para acessar a câmera foi negada. Verifique as configurações do seu navegador.'
        );
      }
    };

    requestPermission();

    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const toggleTorch = async () => {
    if (mediaStream && isTorchSupported) {
      const [videoTrack] = mediaStream.getVideoTracks();
      try {
        await videoTrack.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: !isTorchOn }],
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error('Error toggling torch:', err);
        setError('Não foi possível controlar a lanterna da câmera.');
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Escanear Código de Barras</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black">
          <video ref={ref} className="h-full w-full object-cover" />
          {hasPermission && (
            <>
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
              </div>
              {isTorchSupported && (
                 <div className="absolute bottom-4 right-4 z-20">
                    <Button 
                        size="icon" 
                        onClick={toggleTorch}
                        variant={isTorchOn ? "default" : "outline"}
                    >
                        <Zap className="h-5 w-5" />
                        <span className="sr-only">Ligar/Desligar Lanterna</span>
                    </Button>
                 </div>
              )}
            </>
          )}
        </div>
        <div className="p-6 pt-2 space-y-4">
            {hasPermission === false && (
                 <Alert variant="destructive">
                    <Barcode className="h-4 w-4" />
                    <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                    <AlertDescription>
                        {error || 'Por favor, habilite a permissão da câmera nas configurações do seu navegador para escanear.'}
                    </AlertDescription>
                </Alert>
            )}
             {hasPermission && !error && (
                 <p className="text-center text-sm text-muted-foreground">
                    Aponte a câmera para o código de barras do produto.
                </p>
             )}
              {!!error && hasPermission && (
                 <Alert variant="destructive">
                    <AlertTitle>Erro no Scanner</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
