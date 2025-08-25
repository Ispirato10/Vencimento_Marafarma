
'use client';

import { useContext, useState, useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, CalendarClock, CalendarCheck } from 'lucide-react';

import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataContext } from '@/context/data-context';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 7;

const ExpiringProductsTable = ({ products }: { products: Product[] }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  if (products.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhum produto neste intervalo.</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden md:table-cell">Lote</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Vencimento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product, index) => (
              <TableRow key={`${product.code}-${product.batch}-${index}`}>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.code}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{product.batch}</TableCell>
                <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={differenceInDays(new Date(product.expirationDate), new Date()) <= 30 ? "destructive" : "secondary"}>
                    {format(new Date(product.expirationDate), 'dd/MM/yyyy')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{paginatedProducts.length}</strong> de <strong>{products.length}</strong> produtos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
        </div>
      )}
    </div>
  );
};


export default function DashboardPage() {
  const { products } = useContext(DataContext);
  
  const getExpiringProducts = (days: number, comparison: 'lt' | 'between', days2?: number) => {
    const today = new Date();
    return products.filter((product) => {
      const expirationDate = new Date(product.expirationDate);
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      if (daysUntilExpiration < 0) return false;

      if (comparison === 'lt') {
        return daysUntilExpiration >= 0 && daysUntilExpiration <= days;
      }
      if (comparison === 'between' && days2) {
        return daysUntilExpiration > days && daysUntilExpiration <= days2;
      }
      return false;
    });
  };

  const expiringIn30Days = getExpiringProducts(30, 'lt');
  const expiringIn60Days = getExpiringProducts(30, 'between', 60);
  const expiringIn90Days = getExpiringProducts(60, 'between', 90);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence em 30 dias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringIn30Days.length}</div>
            <p className="text-xs text-muted-foreground">Produtos com vencimento próximo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence em 31-60 dias</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringIn60Days.length}</div>
            <p className="text-xs text-muted-foreground">Produtos que vencem em breve</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence em 61-90 dias</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringIn90Days.length}</div>
            <p className="text-xs text-muted-foreground">Produtos com margem de segurança</p>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes de Vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="30days">
              <TabsList className="grid w-full grid-cols-3 h-auto flex-wrap">
                <TabsTrigger value="30days">Próx. 30 dias</TabsTrigger>
                <TabsTrigger value="60days">Próx. 31-60 dias</TabsTrigger>
                <TabsTrigger value="90days">Próx. 61-90 dias</TabsTrigger>
              </TabsList>
              <TabsContent value="30days">
                <ExpiringProductsTable products={expiringIn30Days} />
              </TabsContent>
              <TabsContent value="60days">
                <ExpiringProductsTable products={expiringIn60Days} />
              </TabsContent>
              <TabsContent value="90days">
                <ExpiringProductsTable products={expiringIn90Days} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
