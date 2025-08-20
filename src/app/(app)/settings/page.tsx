
"use client";

import { useRef, useContext, useState } from 'react';
import { FileUp, FileDown, Trash2, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parse, isPast } from 'date-fns';
import Image from 'next/image';
import { writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/app/(app)/_components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import type { CatalogItem, Product } from '@/types';
import { DataContext } from '@/context/data-context';
import { DeleteExpiredDialog } from './_components/delete-expired-dialog';
import { db } from '@/lib/firebase';


export default function SettingsPage() {
  const { toast } = useToast();
  const { catalog, products, setCatalog, setProducts, reportAuthor, setReportAuthor, deleteExpiredProducts } = useContext(DataContext);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const databaseImportRef = useRef<HTMLInputElement>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isDeleteExpiredDialogOpen, setIsDeleteExpiredDialogOpen] = useState(false);
  
  const expiredProductsCount = products.filter(p => isPast(new Date(p.expirationDate))).length;


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
  
  const processInChunks = async <T,>(items: any[], processChunk: (chunk: any[]) => T[], onComplete: (results: T[]) => void, onSkipped: (item: any) => void = () => {}) => {
    setIsImporting(true);
    setImportProgress(0);
    
    let i = 0;
    const totalItems = items.length;
    const results: T[] = [];

    const step = async () => {
        if (i < totalItems) {
            const chunk = items.slice(i, i + 1);
            const processedChunk = processChunk(chunk);
            if (processedChunk.length > 0) {
               results.push(...processedChunk);
            } else {
               onSkipped(chunk[0]);
            }
            const progress = Math.round(((i + 1) / totalItems) * 100);
            setImportProgress(progress);
            i += 1;
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

        let skippedCount = 0;

        const processCatalogChunk = (chunk: any[]): CatalogItem[] => {
            const item = chunk[0];
            if (item.code && item.name) {
                return [{
                    code: String(item.code),
                    name: String(item.name),
                    category: String(item.category || ''),
                }];
            }
            return [];
        };

        const onCatalogImportComplete = async (processedCatalog: CatalogItem[]) => {
            if (processedCatalog.length > 0) {
                // Here we batch write to firestore
                setCatalog(processedCatalog);
                toast({
                    title: 'Importação Concluída!',
                    description: `${processedCatalog.length} itens do catálogo foram importados.`,
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
        };

        await processInChunks(
            json, 
            processCatalogChunk, 
            onCatalogImportComplete,
            () => { skippedCount++; }
        );
      
      } catch (error) {
        console.error('Erro ao importar arquivo de catálogo:', error);
        toast({ variant: 'destructive', title: 'Erro de Importação' });
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleImportDatabaseClick = () => {
    databaseImportRef.current?.click();
  };

  const handleDatabaseFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, dateNF: 'yyyy-mm-dd' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        let skippedCount = 0;

        const processProductChunk = (chunk: any[]): Product[] => {
            const item = chunk[0];
            let expirationDate: Date | null = null;
            const dateValue = item.expirationDate;

            if (item.code && item.name && item.quantity !== undefined && dateValue) {
                if (typeof dateValue === 'string') {
                    expirationDate = parse(dateValue, 'yyyy-MM-dd', new Date());
                    if (isNaN(expirationDate.getTime())) {
                        expirationDate = parse(dateValue, 'dd/MM/yyyy', new Date());
                    }
                } else if (typeof dateValue === 'number') {
                    // Handle Excel serial date
                    expirationDate = new Date(1899, 11, 30 + dateValue);
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
            return [];
        };

        const onDatabaseImportComplete = (processedProducts: Product[]) => {
            if (processedProducts.length > 0) {
                setProducts(processedProducts);
                toast({
                  title: 'Importação Concluída!',
                  description: `${processedProducts.length} produtos foram importados.`,
                  variant: 'accent'
                });
            }

            if (skippedCount > 0) {
                toast({
                  variant: 'destructive',
                  title: 'Itens Ignorados',
                  description: `${skippedCount} itens ignorados por dados inválidos.`,
                });
            }
        };
        
        await processInChunks(
            json, 
            processProductChunk, 
            onDatabaseImportComplete,
            () => { skippedCount++; }
        );

      } catch (error) {
        console.error('Erro ao importar banco de dados:', error);
        toast({ variant: 'destructive', title: 'Erro de Importação' });
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };
  
  const handleConfirmDeleteExpired = async () => {
    await deleteExpiredProducts();
    toast({
      title: 'Produtos Vencidos Excluídos!',
      description: `${expiredProductsCount} itens foram removidos do estoque.`,
    });
    setIsDeleteExpiredDialogOpen(false);
  };


  return (
    <>
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
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de aparência e dados do aplicativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
           <CardDescription>
            Personalize as informações exibidas no rodapé dos relatórios em PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="report-author">Descrição do Rodapé</Label>
            <Input 
              id="report-author"
              value={reportAuthor || ''}
              onChange={(e) => setReportAuthor(e.target.value)}
              placeholder="Ex: By Fulano de Tal"
            />
          </div>
        </CardContent>
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
            Importe, exporte ou limpe os dados do sistema.
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
           <div className="flex flex-col p-4 border rounded-lg space-y-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-destructive">Ações Perigosas</h3>
                <p className="text-sm text-destructive/80">
                  Exclua permanentemente todos os produtos vencidos do estoque.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setIsDeleteExpiredDialogOpen(true)} 
                  disabled={expiredProductsCount === 0 || isImporting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Vencidos ({expiredProductsCount})
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
    
    <DeleteExpiredDialog 
        isOpen={isDeleteExpiredDialogOpen}
        onClose={() => setIsDeleteExpiredDialogOpen(false)}
        onConfirm={handleConfirmDeleteExpired}
        expiredCount={expiredProductsCount}
    />
    </>
  );
}
