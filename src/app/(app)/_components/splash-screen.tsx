
'use client';

import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  logo: string | null;
}

export function SplashScreen({ logo }: SplashScreenProps) {
  const [progress, setProgress] = useState(13)
 
  useEffect(() => {
    const timer = setTimeout(() => setProgress(80), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {logo ? (
          <Image
            src={logo}
            alt="Logo da Empresa"
            width={150}
            height={150}
            className="object-contain"
            priority
          />
        ) : (
          <div className="h-[150px] w-[150px]"></div> // Placeholder to prevent layout shift
        )}
        <div className="w-64 mt-4">
            <Progress value={progress} className="w-full" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
      </div>
    </div>
  );
}
