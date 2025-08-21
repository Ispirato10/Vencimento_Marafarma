
"use client";

import { useRef, useContext, useState } from 'react';
import { FileUp, FileDown, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parse, isPast } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/app/(app)/_components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import type { CatalogItem, Product } from '@/types';
import { DataContext } from '@/context/data-context';
import { DeleteExpiredDialog } from './_components/delete-expired-dialog';

export default function SettingsPage() {
  const { toast } = useToast();
  const { 
    catalog, 
    products, 
    reportAuthor, 
    setReportAuthor, 
    deleteExpiredProducts, 
    splashImage, 
    setSplashImage,
    importCatalog,
    importProducts,
  } = useContext(DataContext);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const databaseImportRef = useRef<HTMLInputElement>(null);
  const splashImageImportRef = useRef<HTMLInputElement>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isDeleteExpiredDialogOpen, setIsDeleteExpiredDialogOpen] = useState(false);
  
  const expiredProductsCount = products.filter(p => isPast(new Date(p.expirationDate))).length;

  const handleExportCatalog = () => {
    if (catalog.length === 0) {
      toast({ variant: 'destructive', title: 'Nada para Exportar', description: 'Seu catálogo de produtos está vazio.' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(catalog.map(({ id, ...rest}) => rest)); // Remove ID
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
      id: undefined, // Remove ID
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    XLSX.writeFile(workbook, 'banco_de_dados_completo.xlsx');
    toast({ title: 'Sucesso!', description: 'Banco de dados completo exportado.' });
  };
  
  const handleConfirmDeleteExpired = async () => {
    await deleteExpiredProducts();
    toast({
      title: 'Produtos Vencidos Excluídos!',
      description: `${expiredProductsCount} itens foram removidos do estoque.`,
    });
    setIsDeleteExpiredDialogOpen(false);
  };
  
  const handleSplashImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result.length > 2 * 1024 * 1024) { // 2MB limit
          toast({ variant: 'destructive', title: 'Erro', description: 'A imagem é muito grande. O limite é 2MB.' });
          return;
        }
        setSplashImage(result);
        toast({ title: 'Sucesso!', description: 'Imagem de abertura atualizada.' });
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = '';
  };
  
   const processImportFile = async <T,>(
    file: File,
    requiredFields: (keyof T)[],
    importFunction: (data: T[]) => Promise<void>
  ) => {
    setIsImporting(true);
    setImportProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<T>(worksheet);

        if (json.length > 0) {
          const firstItemKeys = Object.keys(json[0] as any);
          const missingFields = requiredFields.filter(field => !firstItemKeys.includes(field as string));

          if (missingFields.length > 0) {
            throw new Error(`Arquivo inválido. Colunas faltando: ${missingFields.join(', ')}`);
          }
        }
        
        setImportProgress(33);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
        await importFunction(json);
        setImportProgress(100);

        toast({
          title: 'Importação Concluída!',
          description: `${json.length} itens foram importados com sucesso.`,
          variant: 'accent',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro na Importação',
          description: error.message || 'Ocorreu um erro ao processar o arquivo.',
        });
      } finally {
        setTimeout(() => setIsImporting(false), 1000);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleImportCatalog = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const requiredFields: (keyof CatalogItem)[] = ['code', 'name', 'category'];
    processImportFile<CatalogItem>(file, requiredFields, importCatalog);
    if(event.target) event.target.value = '';
  };
  
  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const requiredFields: (keyof Product)[] = ['code', 'name', 'quantity', 'category', 'batch', 'expirationDate'];
    const importFunction = async (data: any[]) => {
      const parsedData = data.map(item => ({
        ...item,
        expirationDate: parse(item.expirationDate, 'yyyy-MM-dd', new Date()).toISOString(),
      }));
      await importProducts(parsedData);
    };
    processImportFile<Product>(file, requiredFields, importFunction);
    if(event.target) event.target.value = '';
  };


  return (
    <>
    <div className="space-y-6 max-w-2xl mx-auto">
      <input 
        type="file"
        ref={splashImageImportRef}
        onChange={handleSplashImageChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
      <input 
          type="file"
          ref={catalogImportRef}
          onChange={handleImportCatalog}
          className="hidden"
          accept=".xlsx, .xls"
        />
        <input 
          type="file"
          ref={databaseImportRef}
          onChange={handleImportDatabase}
          className="hidden"
          accept=".xlsx, .xls"
        />
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de aparência e dados do aplicativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo, incluindo tema e tela de abertura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">Tema de Cores</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div className='flex flex-col gap-1'>
                <span className="font-medium">Imagem de Abertura</span>
                <span className="text-xs text-muted-foreground">Recomendado: PNG com fundo transparente</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => splashImageImportRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Alterar Imagem
            </Button>
          </div>
        </CardContent>
      </Card>
      
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
              placeholder="Ex: Por [Seu Nome]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
          <CardDescription>
            Importe ou exporte dados do sistema e limpe os produtos vencidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {isImporting && (
            <div className="space-y-2">
              <Label>Importando dados...</Label>
              <Progress value={importProgress} />
            </div>
          )}
          {!isImporting && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col p-4 border rounded-lg space-y-4 items-start">
                    <h3 className="font-medium">Catálogo</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => catalogImportRef.current?.click()}>
                            <FileUp className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCatalog}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col p-4 border rounded-lg space-y-4 items-start">
                    <h3 className="font-medium">Estoque Completo</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => databaseImportRef.current?.click()}>
                            <FileUp className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                         <Button variant="outline" size="sm" onClick={handleExportDatabase}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </div>
          )}
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

    