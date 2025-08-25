
'use client';

import Image from 'next/image';
import { Package, LoaderCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SplashScreenProps {
  customImage: string | null;
}

export function SplashScreen({ customImage }: SplashScreenProps) {
    const { resolvedTheme } = useTheme();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background animate-pulse">
            <div className="flex flex-col items-center justify-center gap-6">
                {customImage ? (
                    <Image 
                        src={customImage} 
                        alt="Logo de Abertura" 
                        width={128} 
                        height={128} 
                        className="h-32 w-32 object-contain"
                        priority
                    />
                ) : (
                    <Package 
                        className="h-32 w-32 text-primary" 
                        style={{ filter: resolvedTheme === 'dark' ? 'drop-shadow(0 0 10px hsl(var(--primary)))' : 'none' }}
                    />
                )}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Controle de Vencimentos
                    </h1>
                    <p className="text-muted-foreground">Carregando dados do Sistema...</p>
                </div>
                <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        </div>
    );
}
