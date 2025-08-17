
'use client';

import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
    logo: string | null;
    isLoading: boolean;
}

export function SplashScreen({ logo, isLoading }: SplashScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      {/* Only show logo if loading is complete and logo exists, otherwise show spinner */}
      {!isLoading && logo ? (
        <Image src={logo} alt="Logo da Empresa" width={200} height={200} className="mb-4 animate-pulse" priority />
      ) : (
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      )}
      <p className="text-lg text-muted-foreground">Carregando dados...</p>
    </div>
  );
}
