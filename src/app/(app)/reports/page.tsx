
"use client";

import { useState, useEffect } from 'react';
import { format, differenceInDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';

import { products as allProducts } from '@/lib/data';
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

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>('30');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const handleFilter = () => {
    const today = new Date();
    let results: Product[];

    if (period === 'custom') {
      if (dateRange?.from && dateRange?.to) {
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);
        results = allProducts.filter(p => p.expirationDate >= from && p.expirationDate <= to);
      } else {
        results = []; // No range selected for custom, show nothing.
      }
    } else {
      const days = parseInt(period);
      results = allProducts.filter(p => {
        const daysUntilExpiration = differenceInDays(p.expirationDate, today);
        return daysUntilExpiration >= 0 && daysUntilExpiration <= days;
      });
    }
    setFilteredProducts(results);
  };
  
  // biome-ignore lint/correctness/useExhaustiveDependencies: This should only run once on mount to load initial data.
  useEffect(() => {
    handleFilter();
  }, []);


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
                <Select value={period} onValueChange={(value) => { setPeriod(value); setDateRange(undefined); }}>
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
              <Button onClick={handleFilter} disabled={period === 'custom' && (!dateRange?.from || !dateRange?.to)}>Filtrar</Button>
               <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar (XLS)
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
                {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                    <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.code}</div>
                    </TableCell>
                    <TableCell>{product.batch}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">
                        {format(product.expirationDate, 'dd/MM/yyyy')}
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
