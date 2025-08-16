import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, CalendarCheck } from 'lucide-react';

import { products } from '@/lib/data';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const getExpiringProducts = (days: number, comparison: 'lt' | 'between', days2?: number) => {
  const today = new Date();
  return products.filter((product) => {
    const daysUntilExpiration = differenceInDays(product.expirationDate, today);
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

const ExpiringProductsTable = ({ products }: { products: Product[] }) => {
  if (products.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhum produto neste intervalo.</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Lote</TableHead>
          <TableHead className="hidden md:table-cell">Categoria</TableHead>
          <TableHead className="text-right">Qtd.</TableHead>
          <TableHead className="text-right">Vencimento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={`${product.code}-${product.batch}`}>
            <TableCell>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.code}</div>
            </TableCell>
            <TableCell>{product.batch}</TableCell>
            <TableCell className="hidden md:table-cell">{product.category}</TableCell>
            <TableCell className="text-right">{product.quantity}</TableCell>
            <TableCell className="text-right">
              <Badge variant={differenceInDays(product.expirationDate, new Date()) <= 30 ? "destructive" : "secondary"}>
                {format(product.expirationDate, 'dd/MM/yyyy')}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default function DashboardPage() {
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
              <TabsList>
                <TabsTrigger value="30days">Próximos 30 dias</TabsTrigger>
                <TabsTrigger value="60days">Próximos 31-60 dias</TabsTrigger>
                <TabsTrigger value="90days">Próximos 61-90 dias</TabsTrigger>
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
