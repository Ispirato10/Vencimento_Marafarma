
'use client';

import { useContext, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';

import { DataContext } from '@/context/data-context';
import type { CatalogItem } from '@/types';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

import { EditCatalogItemForm } from './_components/edit-catalog-item-form';
import { DeleteCatalogItemDialog } from './_components/delete-catalog-item-dialog';

export default function CatalogPage() {
  const { catalog, updateCatalogItem, deleteCatalogItem } = useContext(DataContext);
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (item: CatalogItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (item: CatalogItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCloseDialogs = () => {
    setSelectedItem(null);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleSaveItem = (updatedItem: CatalogItem) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      updateCatalogItem(updatedItem);
      toast({
        title: 'Item Atualizado!',
        description: `O item "${updatedItem.name}" foi atualizado com sucesso.`,
        variant: 'accent',
      });
      setIsSaving(false);
      handleCloseDialogs();
    }, 500);
  };

  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    deleteCatalogItem(selectedItem.code);
    toast({
        title: 'Item Excluído!',
        description: `O item "${selectedItem.name}" foi excluído do catálogo.`,
    });
    handleCloseDialogs();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Produtos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os itens do seu catálogo de produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((item, index) => (
                <TableRow key={`${item.code}-${index}`}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.code}</div>
                  </TableCell>
                  <TableCell>{item.category || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                        <Edit className="h-4 w-4" />
                         <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                         <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {catalog.length === 0 && (
                <div className="text-center text-muted-foreground py-8">Nenhum item no catálogo.</div>
            )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Item do Catálogo</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <EditCatalogItemForm 
              item={selectedItem}
              onSave={handleSaveItem}
              onCancel={handleCloseDialogs}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      {selectedItem && (
         <DeleteCatalogItemDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleCloseDialogs}
            onConfirm={handleConfirmDelete}
            itemName={selectedItem.name}
        />
      )}
    </>
  );
}
