
'use client';

import { useContext, useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { DataContext } from '@/context/data-context';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

import { EditProductForm } from './_components/edit-product-form';
import { DeleteProductDialog } from './_components/delete-product-dialog';


export default function ProductsPage() {
  const { products, updateProduct, deleteProduct } = useContext(DataContext);
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Estoque de Produtos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os produtos em seu estoque.
            </CardDescription>
          </div>
           <Button asChild size="sm">
            <Link href="/products/new">
              <PlusCircle className="mr-2" />
              Adicionar Produto
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Vencimento</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={`${product.code}-${product.batch}-${index}`}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.code}</div>
                  </TableCell>
                  <TableCell>{product.batch || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">{product.category || 'N/A'}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">
                    {format(new Date(product.expirationDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                         <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {products.length === 0 && (
                <div className="text-center text-muted-foreground py-8">Nenhum produto no estoque.</div>
            )}
        </CardContent>
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
    </>
  );
}
