
'use client';

import { useState, useEffect, useRef } from 'react';
import { Barcode, LoaderCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

// Tipagem para a API nativa BarcodeDetector, pois pode não estar no TypeScript padrão
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [status, setStatus] = useState<'loading' | 'nosupport' | 'denied' | 'ready'>('loading');

  const stopVideoStream = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  };

  const handleClose = () => {
    stopVideoStream();
    onClose();
  };

  useEffect(() => {
    async function setupCamera() {
      if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
        setStatus('nosupport');
        console.error('Barcode Detector API não é suportada neste navegador.');
        return;
      }
      
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('ready');
        }

        const detect = async () => {
          try {
            if (videoRef.current && videoRef.current.readyState > 1) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue);
                toast({
                  title: "Código de Barras Encontrado!",
                  variant: 'accent'
                });
                handleClose();
              }
            }
          } catch (err) {
            console.error('Erro durante a detecção:', err);
          }
          animationFrameId.current = requestAnimationFrame(detect);
        };
        detect();

      } catch (err) {
        console.error('Erro ao acessar a câmera:', err);
        setStatus('denied');
      }
    }

    setupCamera();

    return () => {
      stopVideoStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Escanear Código de Barras</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black overflow-hidden">
          <video ref={videoRef} className="h-full w-full object-cover" muted autoPlay playsInline />
          
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
          </div>

          {status !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
              {status === 'loading' && (
                 <>
                    <LoaderCircle className="h-8 w-8 animate-spin text-white mb-4"/>
                    <p className="text-white">Iniciando a câmera...</p>
                 </>
              )}
              {status === 'nosupport' && (
                <Alert variant="destructive">
                  <Barcode className="h-4 w-4" />
                  <AlertTitle>Navegador Incompatível</AlertTitle>
                  <AlertDescription>
                    Seu navegador não suporta a leitura de código de barras. Tente usar o Chrome ou Safari mais recente.
                  </AlertDescription>
                </Alert>
              )}
               {status === 'denied' && (
                <Alert variant="destructive">
                  <Barcode className="h-4 w-4" />
                  <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                  <AlertDescription>
                    Por favor, habilite a permissão da câmera nas configurações do seu navegador para escanear.
                  </AlertDescription>
                </Alert>
              )}
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

