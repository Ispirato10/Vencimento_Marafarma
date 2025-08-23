
'use client';

import { useState, useEffect, useRef } from 'react';
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
    let stream: MediaStream | null = null;
    const requestPermission = async () => {
      try {
        // Solicita permissão com restrições avançadas para a câmera do celular
        const constraints = {
          video: { 
            facingMode: 'environment', // Prefere a câmera traseira
            // @ts-ignore - focusMode é uma restrição válida mas nem sempre tipada
            focusMode: 'continuous'   // Pede foco automático contínuo
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (ref.current) {
          ref.current.srcObject = stream;
        }
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

    // Função de limpeza para parar a câmera ao desmontar o componente
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [ref]);

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
