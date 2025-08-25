
"use client";

import { useRef, useContext, useState } from 'react';
import { FileUp, FileDown, Trash2, ImageIcon, Wifi } from 'lucide-react';
import * as XLSX from 'xlsx';
import { isPast } from 'date-fns';
import { getDocs, query, collection, limit } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { db } from '@/lib/firebase';
import { DeleteExpiredDialog } from './_components/delete-expired-dialog';
import { Separator } from '@/components/ui/separator';

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
  const [importMessage, setImportMessage] = useState('');
  const [isDeleteExpiredDialogOpen, setIsDeleteExpiredDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
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
      expirationDate: new Date(p.expirationDate).toLocaleDateString('pt-BR'),
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
    requiredFields: string[],
    importFunction: (data: T[], onProgress: (progress: {total: number, processed: number}) => void) => Promise<any>
  ) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportMessage('Lendo arquivo...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json<any>(worksheet, {
          raw: false,
          dateNF: 'dd/MM/yyyy'
        });

        if (json.length === 0) {
            throw new Error('O arquivo está vazio.');
        }
        
        setImportMessage(`Iniciando importação de ${json.length} itens...`);
        setImportProgress(50);

        const firstItemKeys = Object.keys(json[0] as any);
        const missingFields = requiredFields.filter(field => !firstItemKeys.includes(field as string));

        if (missingFields.length > 0) {
          throw new Error(`Arquivo inválido. Colunas faltando: ${missingFields.join(', ')}`);
        }
        
        const onProgress = (progress: {total: number, processed: number}) => {
            const baseProgress = 50; 
            const importProgressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 50 : 50;
            setImportProgress(baseProgress + importProgressPercentage);
            setImportMessage(`Salvando ${progress.processed} de ${progress.total} itens...`);
        };
        
        const result = await importFunction(json as T[], onProgress);
        
        setImportProgress(100);
        setImportMessage(`Importação Concluída! ${result.success} de ${result.total} itens importados.`);

        toast({
          title: 'Importação Concluída!',
          description: `${result.success} de ${result.total} itens foram importados. Falhas: ${result.failures}`,
          variant: result.failures > 0 ? 'destructive' : 'accent',
        });

      } catch (error: any) {
        setImportMessage('Erro na importação');
        setImportProgress(0);
        toast({
          variant: 'destructive',
          title: 'Erro na Importação',
          description: error.message || 'Ocorreu um erro ao processar o arquivo.',
        });
      } finally {
        setTimeout(() => {
          setIsImporting(false);
          setImportMessage('');
          setImportProgress(0);
        }, 5000);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleImportCatalog = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const requiredFields = ['code', 'name'];
    processImportFile<CatalogItem>(file, requiredFields, importCatalog);
    if(event.target) event.target.value = '';
  };
  
  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const requiredFields = ['code', 'name', 'quantity', 'expirationDate'];
    processImportFile<Product>(file, requiredFields, importProducts);
    if(event.target) event.target.value = '';
  };
  
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
        const testQuery = query(collection(db, 'catalog'), limit(1));
        const querySnapshot = await getDocs(testQuery);
        const count = querySnapshot.size;
        toast({
            variant: 'accent',
            title: 'Conexão Bem-Sucedida!',
            description: `O Firebase respondeu corretamente. ${count >= 0 ? 'Conexão OK.' : ''}`
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Falha na Conexão com o Firebase',
            description: `Não foi possível ler dados. Erro: ${error.message}`
        });
    } finally {
        setIsTestingConnection(false);
    }
  };


  return (
    <>
    <div className="space-y-6">
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className='flex flex-col gap-1'>
                <span className="font-medium">Imagem de Abertura</span>
                <span className="text-xs text-muted-foreground">Recomendado: PNG com fundo transparente, até 2MB</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => splashImageImportRef.current?.click()} className="self-start sm:self-auto">
                <ImageIcon className="mr-2 h-4 w-4" />
                Alterar Imagem
            </Button>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Conexão</CardTitle>
          <CardDescription>
            Verifique se a aplicação está se comunicando com o banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground flex-1">
              Esta ação tentará ler um item do seu banco de dados para confirmar que as chaves de API e as regras de segurança estão funcionando.
            </p>
            <Button variant="outline" onClick={handleTestConnection} disabled={isTestingConnection} className="self-start sm:self-auto">
                <Wifi className="mr-2 h-4 w-4" />
                {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
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
        <CardContent className="space-y-6">
           {isImporting && (
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>{importMessage}</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
            </div>
          )}
          {!isImporting && (
            <div className="space-y-6">
              <div className="flex flex-col p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Estoque Completo</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe ou exporte toda a sua base de produtos. Ideal para migração ou backup completo.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Atenção na Importação:</span> O arquivo <code className="bg-muted px-1 py-0.5 rounded">.xlsx</code> deve conter as colunas <code className="bg-muted px-1 py-0.5 rounded">code</code>, <code className="bg-muted px-1 py-0.5 rounded">name</code>, <code className="bg-muted px-1 py-0.5 rounded">quantity</code>, e <code className="bg-muted px-1 py-0.5 rounded">expirationDate</code> (formato DD/MM/AAAA).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 self-start">
                      <Button variant="outline" size="sm" onClick={() => databaseImportRef.current?.click()}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Importar Estoque
                      </Button>
                       <Button variant="outline" size="sm" onClick={handleExportDatabase}>
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar Estoque
                      </Button>
                  </div>
              </div>

               <div className="flex flex-col p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Catálogo de Produtos</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe ou exporte seu catálogo (código, nome, categoria).
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Atenção na Importação:</span> O arquivo <code className="bg-muted px-1 py-0.5 rounded">.xlsx</code> deve conter as colunas <code className="bg-muted px-1 py-0.5 rounded">code</code> e <code className="bg-muted px-1 py-0.5 rounded">name</code>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 self-start">
                      <Button variant="outline" size="sm" onClick={() => catalogImportRef.current?.click()}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Importar Catálogo
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportCatalog}>
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar Catálogo
                      </Button>
                  </div>
              </div>
            </div>
          )}
           <Separator />
           <div className="flex flex-col p-4 border rounded-lg space-y-4 bg-destructive/10 border-destructive/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-destructive">Excluir Produtos Vencidos</h3>
                <p className="text-sm text-destructive/80 mt-1">
                  Esta ação excluirá permanentemente todos os {expiredProductsCount} produto(s) vencido(s) do estoque.
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="self-start md:self-center"
                onClick={() => setIsDeleteExpiredDialogOpen(true)} 
                disabled={expiredProductsCount === 0 || isImporting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Vencidos ({expiredProductsCount})
              </Button>
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

    