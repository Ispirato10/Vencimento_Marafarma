
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        videoStreamRef.current = stream; // Keep track of the stream
        if (ref.current) {
          ref.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error('Camera permission error:', err);
        setHasPermission(false);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                 setError('A permissão para acessar a câmera foi negada. Verifique as configurações do seu navegador.');
            } else {
                 setError('A câmera não pôde ser iniciada. Verifique se não está sendo usada por outro aplicativo.');
            }
        }
      }
    };

    getCameraPermission();

    // Cleanup function: this is called when the component unmounts
    return () => {
      stopVideoStream();
    };
  }, [ref, stopVideoStream]);

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
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
            </div>
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
