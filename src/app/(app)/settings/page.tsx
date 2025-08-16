
"use client";

import { useRef, useContext, useState } from 'react';
import { FileUp, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parse } from 'date-fns';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/app/(app)/_components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import type { CatalogItem, Product } from '@/types';
import { DataContext } from '@/context/data-context';

// Helper function to convert Excel serial date to JS Date
// Excel stores dates as number of days since 1900-01-01.
const excelSerialDateToJSDate = (serial: number) => {
  if (typeof serial !== 'number') return null;
  // Excel's epoch starts on 1899-12-30, not 1900-01-01, due to a bug.
  // We subtract 1 to align with JS's epoch (which is day 0)
  const excelEpoch = new Date(1899, 11, 30);
  return new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
}


export default function SettingsPage() {
  const { toast } = useToast();
  const { catalog, products, setCatalog, setProducts, logo, setLogo } = useContext(DataContext);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const databaseImportRef = useRef<HTMLInputElement>(null);
  const logoImportRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleExportCatalog = () => {
    if (catalog.length === 0) {
      toast({ variant: 'destructive', title: 'Nada para Exportar', description: 'Seu catálogo de produtos está vazio.' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(catalog);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');
    XLSX.writeFile(workbook, 'catalogo_produtos.xlsx');
    toast({ title: 'Sucesso!', description: 'Catálogo de produtos exportado.' });
  };

  const handleExportDatabase = () => {
    if (products.length === 0) {
      toast({ variant: 'destructive', title: 'Nada para Exportar', description: 'Seu banco de dados de estoque está vazio.' });
      return;
    }
    const dataToExport = products.map(p => ({
      ...p,
      expirationDate: format(new Date(p.expirationDate), 'yyyy-MM-dd'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    XLSX.writeFile(workbook, 'banco_de_dados_completo.xlsx');
    toast({ title: 'Sucesso!', description: 'Banco de dados completo exportado.' });
  };
  
  const handleImportCatalogClick = () => {
    catalogImportRef.current?.click();
  };
  
  // To update the progress bar without freezing the UI
  const processInChunks = async <T,>(items: any[], processChunk: (chunk: any[]) => T[], onComplete: (results: T[]) => void) => {
    setIsImporting(true);
    setImportProgress(0);
    
    let i = 0;
    const totalItems = items.length;
    const results: T[] = [];

    const step = async () => {
        if (i < totalItems) {
            const chunk = items.slice(i, i + 1);
            const processedChunk = processChunk(chunk);
            results.push(...processedChunk);
            const progress = Math.round(((i + 1) / totalItems) * 100);
            setImportProgress(progress);
            i += 1;
            // Brief pause to allow UI to re-render
            await new Promise(resolve => setTimeout(resolve, 0));
            await step();
        } else {
            onComplete(results);
            setIsImporting(false);
        }
    }
    
    await step();
  };

  const handleCatalogFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum arquivo selecionado.' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const processCatalogChunk = (chunk: any[]): CatalogItem[] => {
            const item = chunk[0];
            // Basic validation for each item
            if (item.code && item.name) {
                return [{
                    code: String(item.code),
                    name: String(item.name),
                    category: String(item.category || ''),
                }];
            }
            return [];
        };

        const onCatalogImportComplete = (processedCatalog: CatalogItem[]) => {
            const validItems = processedCatalog.filter(c => c);
            const skippedCount = json.length - validItems.length;

            if (validItems.length > 0) {
                setCatalog(validItems);
                toast({
                    title: 'Importação Concluída!',
                    description: `${validItems.length} itens do catálogo foram importados.`,
                    variant: 'accent'
                });
            }

            if (skippedCount > 0) {
                toast({
                    variant: 'destructive',
                    title: 'Itens Ignorados',
                    description: `${skippedCount} itens foram ignorados por falta de 'código' ou 'nome'.`,
                });
            }

            if (validItems.length === 0 && skippedCount > 0) {
                toast({
                    variant: 'destructive',
                    title: 'Importação Falhou',
                    description: 'Nenhum item válido encontrado. Verifique as colunas do arquivo.',
                });
            }
        };

        await processInChunks(json, processCatalogChunk, onCatalogImportComplete);
      
      } catch (error) {
        console.error('Erro ao importar arquivo de catálogo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao ler o arquivo. Verifique se o formato está correto.';
        toast({ variant: 'destructive', title: 'Erro de Importação', description: errorMessage });
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo selecionado.' });
       setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
    
    event.target.value = '';
  };

  const handleImportDatabaseClick = () => {
    databaseImportRef.current?.click();
  };

  const handleDatabaseFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum arquivo selecionado.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, dateNF: 'yyyy-mm-dd' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const processProductChunk = (chunk: any[]): Product[] => {
            const item = chunk[0];
            let expirationDate: Date | null = null;
            const dateValue = item.expirationDate;

            const hasRequiredColumns = item.code && item.name && item.quantity !== undefined && dateValue;

            if (hasRequiredColumns) {
                if (typeof dateValue === 'string') {
                    expirationDate = parse(dateValue, 'yyyy-MM-dd', new Date());
                    if (isNaN(expirationDate.getTime())) {
                        expirationDate = parse(dateValue, 'dd/MM/yyyy', new Date());
                    }
                } else if (typeof dateValue === 'number') {
                    expirationDate = excelSerialDateToJSDate(dateValue);
                }

                if (expirationDate && !isNaN(expirationDate.getTime())) {
                    return [{
                        code: String(item.code),
                        name: String(item.name),
                        category: String(item.category || ''),
                        quantity: Number(item.quantity),
                        batch: String(item.batch || ''),
                        expirationDate: expirationDate.toISOString(),
                    }];
                }
            }
            return []; // Return empty for invalid rows
        };

        const onDatabaseImportComplete = (processedProducts: Product[]) => {
            const validProducts = processedProducts.filter(p => p);
            const skippedCount = json.length - validProducts.length;

            if (validProducts.length > 0) {
                setProducts(validProducts);
                toast({
                  title: 'Importação Concluída!',
                  description: `${validProducts.length} produtos foram importados para o estoque.`,
                  variant: 'accent'
                });
            }

            if (skippedCount > 0) {
                toast({
                  variant: 'destructive',
                  title: 'Alguns Itens Foram Ignorados',
                  description: `Não foi possível importar ${skippedCount} itens por falta de dados ou data inválida.`,
                });
            }

            if (validProducts.length === 0 && skippedCount > 0) {
                 toast({
                  variant: 'destructive',
                  title: 'Importação Falhou',
                  description: 'Nenhum produto foi importado. Verifique se as colunas do arquivo estão corretas.',
                });
            }
        };
        
        await processInChunks(json, processProductChunk, onDatabaseImportComplete);

      } catch (error) {
        console.error('Erro ao importar arquivo de banco de dados:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao ler o arquivo. Verifique se o formato e as colunas estão corretos.';
        toast({ variant: 'destructive', title: 'Erro de Importação', description: errorMessage });
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo selecionado.' });
       setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
    
    event.target.value = '';
  };
  
  const handleLogoImportClick = () => {
    logoImportRef.current?.click();
  }

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum arquivo selecionado.' });
      return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1 MB limit
        toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'Por favor, selecione um arquivo de imagem menor que 1MB.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
            setLogo(result);
            toast({ title: 'Sucesso!', description: 'Logo da empresa atualizado.', variant: 'accent' });
        }
    };
    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo de imagem.' });
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  }


  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <input 
        type="file"
        ref={catalogImportRef}
        onChange={handleCatalogFileChange}
        className="hidden"
        accept=".xlsx, .xls"
        disabled={isImporting}
      />
      <input 
        type="file"
        ref={databaseImportRef}
        onChange={handleDatabaseFileChange}
        className="hidden"
        accept=".xlsx, .xls"
        disabled={isImporting}
      />
      <input
        type="file"
        ref={logoImportRef}
        onChange={handleLogoFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/svg+xml"
      />


      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de aparência e dados do aplicativo.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
          <CardDescription>
            Faça o upload do logo que será exibido na tela inicial.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {logo && (
                <div className="flex justify-center items-center p-4 border rounded-md mb-4 bg-muted/40">
                    <Image src={logo} alt="Logo da Empresa" width={150} height={150} className="max-h-24 w-auto" />
                </div>
            )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleLogoImportClick}>Alterar Logo</Button>
        </CardFooter>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-medium">Tema</span>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
          <CardDescription>
            Importe ou exporte os dados do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Catálogo de Produtos</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe ou exporte o catálogo base de produtos.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleImportCatalogClick} disabled={isImporting}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Importar (XLSX)
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCatalog} disabled={isImporting}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar (XLSX)
                  </Button>
                </div>
              </div>
          </div>
          <div className="flex flex-col p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Banco de Dados Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Importe ou exporte todos os produtos em estoque.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleImportDatabaseClick} disabled={isImporting}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar (XLSX)
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportDatabase} disabled={isImporting}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar (XLSX)
                </Button>
              </div>
            </div>
          </div>
          {isImporting && (
            <div className="flex items-center gap-4 pt-4">
                <Progress value={importProgress} className="w-[60%]" />
                <span className="text-sm font-medium text-muted-foreground">{`Importando... ${importProgress}%`}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
