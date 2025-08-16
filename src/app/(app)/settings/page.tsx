
"use client";

import { useRef } from 'react';
import { FileUp, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/app/(app)/_components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { catalog, products } from '@/lib/data';
import type { CatalogItem, Product } from '@/types';


export default function SettingsPage() {
  const { toast } = useToast();
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const databaseImportRef = useRef<HTMLInputElement>(null);

  const handleExportCatalog = () => {
    const worksheet = XLSX.utils.json_to_sheet(catalog);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');
    XLSX.writeFile(workbook, 'catalogo_produtos.xlsx');
    toast({ title: 'Sucesso!', description: 'Catálogo de produtos exportado.' });
  };

  const handleExportDatabase = () => {
    const dataToExport = products.map(p => ({
      ...p,
      expirationDate: format(p.expirationDate, 'yyyy-MM-dd'),
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

  const handleCatalogFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum arquivo selecionado.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<CatalogItem>(worksheet);
        
        // Em um app real, aqui você atualizaria o estado ou enviaria para um backend
        console.log('Dados do catálogo importado:', json);

        toast({
          title: 'Sucesso!',
          description: `${json.length} itens do catálogo foram importados. (Simulado)`,
          variant: 'accent'
        });
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        toast({ variant: 'destructive', title: 'Erro de Importação', description: 'Ocorreu um erro ao ler o arquivo. Verifique se o formato está correto.' });
      }
    };
    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo selecionado.' });
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
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Product>(worksheet);
        
        // Converte as datas que podem vir como string para objetos Date
        const processedJson = json.map(item => ({
          ...item,
          expirationDate: typeof item.expirationDate === 'string' 
            ? parseISO(item.expirationDate) 
            : item.expirationDate
        }));

        // Em um app real, aqui você atualizaria o estado ou enviaria para um backend
        console.log('Dados do banco de dados importado:', processedJson);

        toast({
          title: 'Sucesso!',
          description: `${processedJson.length} produtos foram importados para o estoque. (Simulado)`,
          variant: 'accent'
        });
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        toast({ variant: 'destructive', title: 'Erro de Importação', description: 'Ocorreu um erro ao ler o arquivo. Verifique se o formato e as colunas estão corretos.' });
      }
    };
    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo selecionado.' });
    };
    reader.readAsArrayBuffer(file);
    
    event.target.value = '';
  };


  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <input 
        type="file"
        ref={catalogImportRef}
        onChange={handleCatalogFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <input 
        type="file"
        ref={databaseImportRef}
        onChange={handleDatabaseFileChange}
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
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Catálogo de Produtos</h3>
              <p className="text-sm text-muted-foreground">
                Importe ou exporte o catálogo base de produtos.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImportCatalogClick}>
                <FileUp className="mr-2 h-4 w-4" />
                Importar (XLSX)
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCatalog}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar (XLSX)
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Banco de Dados Completo</h3>
              <p className="text-sm text-muted-foreground">
                Importe ou exporte todos os produtos em estoque.
              </p>
            </div>
             <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImportDatabaseClick}>
                <FileUp className="mr-2 h-4 w-4" />
                Importar (XLSX)
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportDatabase}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar (XLSX)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
