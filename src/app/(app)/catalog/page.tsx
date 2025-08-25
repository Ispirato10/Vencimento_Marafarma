
'use client';

import { useContext, useState, useMemo, useEffect } from 'react';
import { Edit, Trash2, Search, Barcode } from 'lucide-react';

import { DataContext } from '@/context/data-context';
import type { CatalogItem } from '@/types';
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
import { useToast } from '@/hooks/use-toast';

import { EditCatalogItemForm } from './_components/edit-catalog-item-form';
import { DeleteCatalogItemDialog } from './_components/delete-catalog-item-dialog';
import { BarcodeScanner } from '../products/new/_components/barcode-scanner';

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

export default function CatalogPage() {
  const { catalog, updateCatalogItem, deleteCatalogItem } = useContext(DataContext);
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'name'>('code');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredCatalog = useMemo(() => {
    setCurrentPage(1); // Reset page when filter changes
    if (!debouncedSearchQuery) {
      return catalog;
    }
    return catalog.filter((item) => {
      const query = debouncedSearchQuery.toLowerCase();
      if (searchType === 'name') {
        return item.name.toLowerCase().includes(query);
      }
      if (searchType === 'code') {
        return item.code.toLowerCase().includes(query);
      }
      return true;
    });
  }, [catalog, debouncedSearchQuery, searchType]);

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCatalog.slice(startIndex, endIndex);
  }, [filteredCatalog, currentPage]);


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

  const handleScanSuccess = (scannedCode: string) => {
      setSearchType('code');
      setSearchQuery(scannedCode);
      setIsScannerOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Catálogo de Produtos</CardTitle>
          <CardDescription>
            Visualize, gerencie e pesquise todos os itens do seu catálogo de produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
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
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Buscar por" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="code">Código</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedCatalog.map((item, index) => (
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
          </div>
           {filteredCatalog.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'Nenhum item encontrado para sua busca.' : 'Nenhum item no catálogo.'}
                </div>
            )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Mostrando <strong>{paginatedCatalog.length}</strong> de <strong>{filteredCatalog.length}</strong> itens
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

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );
}
