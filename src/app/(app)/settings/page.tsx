
"use client";

import { useRef, useContext } from 'react';
import { FileUp, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parse } from 'date-fns';

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
  const { catalog, products, setCatalog, setProducts } = useContext(DataContext);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const databaseImportRef = useRef<HTMLInputElement>(null);

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
        
        // Basic validation
        if (!json.every(item => 'code' in item && 'name' in item && 'category' in item)) {
          throw new Error('O arquivo de catálogo parece ter colunas inválidas. Verifique se as colunas "code", "name" e "category" existem.');
        }

        setCatalog(json);

        toast({
          title: 'Sucesso!',
          description: `${json.length} itens do catálogo foram importados.`,
          variant: 'accent'
        });
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao ler o arquivo. Verifique se o formato está correto.';
        toast({ variant: 'destructive', title: 'Erro de Importação', description: errorMessage });
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
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, dateNF: 'yyyy-mm-dd' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const processedProducts: Product[] = [];
        const skippedRows: string[] = [];

        json.forEach((item: any, index) => {
          let expirationDate: Date | null = null;
          const dateValue = item.expirationDate;
          
          const hasAllColumns = item.code && item.name && item.category && item.quantity !== undefined && item.batch && dateValue;
          
          if (hasAllColumns) {
             if (typeof dateValue === 'string') {
                expirationDate = parse(dateValue, 'yyyy-MM-dd', new Date());
                if (isNaN(expirationDate.getTime())) {
                    expirationDate = parse(dateValue, 'dd/MM/yyyy', new Date());
                }
             } else if (typeof dateValue === 'number') {
                expirationDate = excelSerialDateToJSDate(dateValue);
             }

             if (expirationDate && !isNaN(expirationDate.getTime())) {
                processedProducts.push({
                    code: String(item.code),
                    name: String(item.name),
                    category: String(item.category),
                    quantity: Number(item.quantity),
                    batch: String(item.batch),
                    expirationDate: expirationDate.toISOString(),
                });
             } else {
                skippedRows.push(item.name || item.code || `Linha ${index + 2}`);
             }
          } else {
             skippedRows.push(item.name || item.code || `Linha ${index + 2}`);
          }
        });

        if (processedProducts.length > 0) {
            setProducts(processedProducts);
            toast({
              title: 'Importação Concluída!',
              description: `${processedProducts.length} produtos foram importados para o estoque.`,
              variant: 'accent'
            });
        }

        if (skippedRows.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Alguns Itens Foram Ignorados',
              description: `Não foi possível importar ${skippedRows.length} itens por falta de dados. Verifique o arquivo.`,
            });
        }

        if (processedProducts.length === 0 && skippedRows.length > 0) {
             toast({
              variant: 'destructive',
              title: 'Importação Falhou',
              description: 'Nenhum produto foi importado. Verifique se as colunas do arquivo estão corretas.',
            });
        }

      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao ler o arquivo. Verifique se o formato e as colunas estão corretos.';
        toast({ variant: 'destructive', title: 'Erro de Importação', description: errorMessage });
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
