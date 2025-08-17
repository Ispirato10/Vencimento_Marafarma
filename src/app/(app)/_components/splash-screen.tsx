
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
      {/* Always render the logo image to prevent hydration issues and flashing content */}
      {logo ? (
        <Image 
          src={logo} 
          alt="Logo da Empresa" 
          width={200} 
          height={200} 
          className={`mb-4 ${isLoading ? 'animate-pulse' : ''}`} 
          priority 
        />
      ) : (
        // Fallback loader if logo is somehow null, which should not happen with the new DataContext logic
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      )}
      {isLoading && <p className="text-lg text-muted-foreground">Carregando dados...</p>}
    </div>
  );
}
