
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const { ref } = useZxing({
    paused: hasPermission === false,
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

  const stopVideoStream = useCallback(() => {
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => {
            track.stop();
        });
        videoStreamRef.current = null;
    }
  }, []);
  
  const startVideoStream = useCallback(async (torchEnabled: boolean) => {
      stopVideoStream(); // Stop any existing stream
      try {
          const constraints: MediaStreamConstraints = {
              video: { 
                  facingMode: 'environment',
                  // @ts-ignore
                  focusMode: 'continuous',
                  // @ts-ignore
                  torch: torchEnabled,
              }
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoStreamRef.current = stream;

          if (ref.current) {
              ref.current.srcObject = stream;
          }

          // Check for torch support after stream is active
          const [videoTrack] = stream.getVideoTracks();
          // @ts-ignore
          const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
          // @ts-ignore
          if (capabilities.torch) {
              setIsTorchSupported(true);
          }
          
          setHasPermission(true);
          setError(null);

      } catch (err) {
          console.error('Camera permission or start error:', err);
          setHasPermission(false);
          if (err instanceof Error) {
              if (err.name === 'NotAllowedError') {
                   setError('A permissão para acessar a câmera foi negada. Verifique as configurações do seu navegador.');
              } else if (err.name === 'OverconstrainedError' && torchEnabled) {
                  // Fallback if torch is not supported
                  setIsTorchSupported(false);
                  setIsTorchOn(false);
                  await startVideoStream(false); // Retry without torch
              }
              else {
                   setError('A câmera não pôde ser iniciada. Verifique se não está sendo usada por outro aplicativo.');
              }
          }
      }
  }, [ref, stopVideoStream]);

  useEffect(() => {
      startVideoStream(isTorchOn);

      return () => {
          stopVideoStream();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTorch = async () => {
      const newTorchState = !isTorchOn;
      setIsTorchOn(newTorchState);
      await startVideoStream(newTorchState);
  };
  
  const handleDialogClose = () => {
      stopVideoStream();
      onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
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
                        onClick={handleToggleTorch}
                        variant={isTorchOn ? "default" : "outline"}
                    >
                        <Zap className="h-5 w-5" />
                        <span className="sr-only">Ligar/Desligar Lanterna</span>
                    </Button>
                 </div>
              )}
            </>
          )}
           {hasPermission === false && (
             <div className="absolute inset-0 flex items-center justify-center p-6">
                 <Alert variant="destructive">
                    <Barcode className="h-4 w-4" />
                    <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                    <AlertDescription>
                        {error || 'Por favor, habilite a permissão da câmera nas configurações do seu navegador para escanear.'}
                    </AlertDescription>
                </Alert>
            </div>
            )}
        </div>
        <div className="p-6 pt-2 space-y-4">
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

