
'use client';

import { useState } from 'react';
import { Barcode, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useZxing } from 'react-zxing';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(err) {
      if (err instanceof Error && err.name !== 'NotFoundException') {
          console.error('Barcode scanner error:', err);
          setError('Não foi possível iniciar a câmera. Verifique as permissões no seu navegador.');
      }
    },
    constraints: { 
        video: { 
            facingMode: 'environment' 
        } 
    },
    timeBetweenDecodingAttempts: 300,
    reader: new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 300,
      delayBetweenScanSuccess: 500,
    })
  });

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Escanear Código de Barras</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black">
          <video ref={ref} className="h-full w-full object-cover" />
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
          </div>
          {error && (
            <div className="absolute bottom-0 w-full bg-destructive/80 p-2 text-center text-sm text-destructive-foreground">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 pt-2 text-center text-sm text-muted-foreground">
          Aponte a câmera para o código de barras do produto.
        </div>
      </DialogContent>
    </Dialog>
  );
}
