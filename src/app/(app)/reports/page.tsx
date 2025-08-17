
"use client";

import { useState, useEffect, useContext } from 'react';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '@/context/data-context';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


export default function ReportsPage() {
  const { products: allProducts, reportAuthor } = useContext(DataContext);
  const [period, setPeriod] = useState<string>('30');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  const handleFilter = () => {
    const today = new Date();
    let results: Product[];

    if (period === 'custom') {
      if (dateRange?.from && dateRange?.to) {
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);
        results = allProducts.filter(p => {
            const expirationDate = new Date(p.expirationDate);
            return expirationDate >= from && expirationDate <= to
        });
      } else {
        results = []; // No range selected for custom, show nothing.
      }
    } else {
      const days = parseInt(period);
      results = allProducts.filter(p => {
        const daysUntilExpiration = differenceInDays(new Date(p.expirationDate), today);
        return daysUntilExpiration >= 0 && daysUntilExpiration <= days;
      });
    }
    setFilteredProducts(results.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
  };
  
  useEffect(() => {
    handleFilter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts, period, dateRange]);
  
  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum dado para exportar',
        description: 'Filtre alguns produtos antes de exportar.',
      });
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFontSize(16);
    doc.text('Relatório de Vencimentos', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 21);

    const tableColumns = ['Produto', 'Lote', 'Categoria', 'Qtd.', 'Vencimento'];
    
    const tableRows = filteredProducts.map(p => [
      `${p.name}\n${p.code}`,
      p.batch || 'N/A',
      p.category || 'N/A',
      p.quantity,
      format(new Date(p.expirationDate), 'dd/MM/yyyy')
    ]);

    doc.autoTable({
      startY: 28,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
       columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' }
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        
        // System Name & Author
        const footerTextLeft = `Controle de Vencimentos Marafarma | ${reportAuthor || ''}`;
        doc.text(footerTextLeft, data.settings.margin.left, doc.internal.pageSize.height - 8);

        // Page Number
        const footerTextRight = `Página ${data.pageNumber} de ${pageCount}`;
        const textWidth = doc.getStringUnitWidth(footerTextRight) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(footerTextRight, doc.internal.pageSize.width - data.settings.margin.right - textWidth, doc.internal.pageSize.height - 8);
      },
      margin: { top: 10, right: 12, bottom: 15, left: 12 },
    });

    doc.save('relatorio_vencimentos.pdf');

    toast({ title: 'Sucesso!', description: 'Relatório exportado para PDF.' });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Vencimento</CardTitle>
          <CardDescription>
            Filtre e visualize os produtos por período de vencimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="period-select">Período</Label>
                <Select value={period} onValueChange={(value) => { setPeriod(value); if (value !== 'custom') setDateRange(undefined); }}>
                    <SelectTrigger id="period-select">
                    <SelectValue placeholder="Filtrar por período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Próximos 30 dias</SelectItem>
                      <SelectItem value="60">Próximos 60 dias</SelectItem>
                      <SelectItem value="90">Próximos 90 dias</SelectItem>
                      <SelectItem value="custom">Período customizado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {period === 'custom' && (
              <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="date-range">Intervalo de datas</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                            </>
                        ) : (
                            format(dateRange.from, "dd/MM/y", { locale: ptBR })
                        )
                        ) : (
                        <span>Escolha um intervalo</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                    </PopoverContent>
                </Popover>
              </div>
            )}
            
            <div className="flex items-center gap-2">
               <Button variant="outline" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar (PDF)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
           <CardDescription>
            {filteredProducts.length} produto(s) encontrado(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Data de Vencimento</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredProducts.map((product, index) => (
                    <TableRow key={`${product.code}-${product.batch}-${index}`}>
                    <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.code}</div>
                    </TableCell>
                    <TableCell>{product.batch}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">
                        {format(new Date(product.expirationDate), 'dd/MM/yyyy')}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">Nenhum produto encontrado para os filtros selecionados.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
