
'use client';

import { useState, useEffect, useRef } from 'react';
import { Barcode, Zap, ZapOff } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  
  // Função para parar o stream de vídeo
  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  // Hook para solicitar permissão e iniciar a câmera
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                // Tenta solicitar foco contínuo se suportado
                advanced: [{ autoFocus: true, focusMode: 'continuous' }]
            } 
        });
        
        setHasCameraPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Verifica se a lanterna é suportada
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.torch) {
              setIsTorchSupported(true);
          }

          const codeReader = codeReaderRef.current;
          codeReader.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result) {
              onScan(result.getText());
            }
            if (error && !(error instanceof NotFoundException)) {
              console.error('ZXing error:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    // Função de limpeza para ser executada quando o componente for desmontado
    return () => {
        stopVideoStream();
        codeReaderRef.current.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem

  const handleToggleTorch = async () => {
      if (!isTorchSupported || !videoRef.current?.srcObject) return;

      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      
      try {
        await videoTrack.applyConstraints({
            advanced: [{ torch: !isTorchOn }]
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error('Error toggling torch:', err);
        toast({
            variant: 'destructive',
            title: 'Erro na Lanterna',
            description: 'Não foi possível controlar a lanterna do dispositivo.',
        });
      }
  };

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
          <video ref={videoRef} className="h-full w-full object-cover" muted autoPlay playsInline />
          
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-1/2 w-5/6 rounded-lg border-2 border-dashed border-white/50" />
          </div>

          {hasCameraPermission === false && (
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

          {hasCameraPermission === undefined && (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-white">Solicitando acesso à câmera...</p>
             </div>
          )}

          {isTorchSupported && (
             <div className="absolute bottom-4 right-4 z-20">
                <Button onClick={handleToggleTorch} size="icon" variant={isTorchOn ? 'default' : 'secondary'}>
                    {isTorchOn ? <ZapOff /> : <Zap />}
                    <span className="sr-only">Toggle Flashlight</span>
                </Button>
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
