
'use client';

import Image from 'next/image';
import { LoaderCircle } from 'lucide-react';

interface SplashScreenProps {
  logo: string | null;
}

export function SplashScreen({ logo }: SplashScreenProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      {logo ? (
        <Image 
          src={logo} 
          alt="Logo da Empresa" 
          width={200} 
          height={200}
          className="mb-4 animate-pulse"
          priority
        />
      ) : (
        <LoaderCircle className="h-16 w-16 animate-spin text-primary mb-4" />
      )}
      <p className="text-lg text-muted-foreground">Carregando dados...</p>
    </div>
  );
}
