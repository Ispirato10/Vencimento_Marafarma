
'use client';

import { useContext, useState, useMemo, useEffect, Fragment } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, PlusCircle, Search, Barcode, ChevronDown } from 'lucide-react';
import Link from 'next/link';

import { DataContext } from '@/context/data-context';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

import { EditProductForm } from './_components/edit-product-form';
import { DeleteProductDialog } from './_components/delete-product-dialog';
import { BarcodeScanner } from './new/_components/barcode-scanner';

// Custom hook for debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ITEMS_PER_PAGE = 15;

export default function ProductsPage() {
  const { products, updateProduct, deleteProduct } = useContext(DataContext);
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'name'>('code');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredProducts = useMemo(() => {
    setCurrentPage(1); // Reset page when filter changes
    if (!debouncedSearchQuery) {
      return products;
    }
    return products.filter((product) => {
      const query = debouncedSearchQuery.toLowerCase();
      if (searchType === 'name') {
        return product.name.toLowerCase().includes(query);
      }
      if (searchType === 'code') {
        return product.code.toLowerCase().includes(query);
      }
      return true;
    });
  }, [products, debouncedSearchQuery, searchType]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCloseDialogs = () => {
    setSelectedProduct(null);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      updateProduct(updatedProduct);
      toast({
        title: 'Produto Atualizado!',
        description: `O produto "${updatedProduct.name}" foi atualizado com sucesso.`,
        variant: 'accent',
      });
      setIsSaving(false);
      handleCloseDialogs();
    }, 500);
  };

  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    deleteProduct(selectedProduct.code, selectedProduct.batch || '');
    toast({
        title: 'Produto Excluído!',
        description: `O produto "${selectedProduct.name}" foi excluído do estoque.`,
    });
    handleCloseDialogs();
  };
  
  const handleScanSuccess = (scannedCode: string) => {
      setSearchType('code');
      setSearchQuery(scannedCode);
      setIsScannerOpen(false);
  };

  const toggleRow = (id: string) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
             <div>
                <CardTitle className="text-2xl">Estoque de Produtos</CardTitle>
                <CardDescription>
                  Visualize, gerencie e pesquise todos os produtos em seu estoque.
                </CardDescription>
             </div>
             <Button asChild size="sm" className="self-start md:self-auto">
                <Link href="/products/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Link>
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={`Pesquisar por ${searchType === 'name' ? 'nome...' : 'código...'}`}
                    className="w-full pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <div className="flex gap-2">
                {searchType === 'code' && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setIsScannerOpen(true)}
                    >
                    <Barcode className="h-5 w-5" />
                    <span className="sr-only">Escanear código de barras</span>
                </Button>
                )}
                <Select value={searchType} onValueChange={(value) => setSearchType(value as 'code' | 'name')}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue placeholder="Buscar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="code">Código</SelectItem>
                        <SelectItem value="name">Nome</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Vencimento</TableHead>
                  <TableHead className="w-[80px] text-center">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const rowId = `${product.code}-${product.batch}`;
                  return (
                    <Fragment key={rowId}>
                      <Collapsible asChild open={openRows[rowId] || false} onOpenChange={() => toggleRow(rowId)}>
                        <>
                          <TableRow>
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.code}</div>
                              {product.batch && <div className="text-xs text-muted-foreground mt-1">Lote: {product.batch}</div>}
                            </TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">
                              {format(new Date(product.expirationDate), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-center">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                  <span className="sr-only">Ver detalhes</span>
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <tr className="bg-muted/50">
                              <TableCell colSpan={4} className="p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-sm mb-1">Categoria</h4>
                                    <p className="text-sm text-muted-foreground">{product.category || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm mb-1">Ações</h4>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(product)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </tr>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
           {filteredProducts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto no estoque.'}
                </div>
            )}
        </CardContent>
         {totalPages > 1 && (
          <CardFooter className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{paginatedProducts.length}</strong> de <strong>{filteredProducts.length}</strong> produtos
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
          </CardFooter>
        )}
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <EditProductForm 
              product={selectedProduct}
              onSave={handleSaveProduct}
              onCancel={handleCloseDialogs}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      {selectedProduct && (
         <DeleteProductDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleCloseDialogs}
            onConfirm={handleConfirmDelete}
            productName={selectedProduct.name}
        />
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );
}
