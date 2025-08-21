
'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  writeBatch,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { isPast, parse } from 'date-fns';

import type { Product, CatalogItem } from '@/types';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface DataContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productToUpdate: Product) => Promise<void>;
  deleteProduct: (productCode: string, productBatch: string) => Promise<void>;
  deleteExpiredProducts: () => Promise<void>;
  importProducts: (products: any[], onProgress?: (progress: {total: number, processed: number}) => void) => Promise<any>;
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => Promise<void>;
  updateCatalogItem: (itemToUpdate: CatalogItem) => Promise<void>;
  deleteCatalogItem: (itemCode: string) => Promise<void>;
  importCatalog: (items: any[], onProgress?: (progress: {total: number, processed: number}) => void) => Promise<any>;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
  splashImage: string | null;
  setSplashImage: (image: string | null) => void;
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({
  products: [],
  setProducts: () => {},
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  deleteExpiredProducts: async () => {},
  importProducts: async () => ({ success: 0, failures: 0, total: 0 }),
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: async () => {},
  updateCatalogItem: async () => {},
  deleteCatalogItem: async () => {},
  importCatalog: async () => ({ success: 0, failures: 0, total: 0 }),
  reportAuthor: null,
  setReportAuthor: () => {},
  splashImage: null,
  setSplashImage: () => {},
  loading: true,
});

const getStorageItem = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return fallback;
    }
};

const setStorageItem = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
    }
};

const BATCH_SIZE = 1;

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProductsState] = useState<Product[]>([]);
  const [catalog, setCatalogState] = useState<CatalogItem[]>([]);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [splashImage, setSplashImageState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching data from Firebase...");
      const catalogQuery = query(collection(db, 'catalog'));
      const catalogSnapshot = await getDocs(catalogQuery);
      const catalogData = catalogSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CatalogItem));
      setCatalogState(catalogData.sort((a, b) => a.name.localeCompare(b.name)));
      console.log(`Fetched ${catalogData.length} catalog items.`);

      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProductsState(productsData.sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
      console.log(`Fetched ${productsData.length} products.`);

    } catch (error) {
      console.error("DEBUG: Erro ao buscar dados do Firebase:", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao Firebase. Verifique suas credenciais e conexão.',
      });
    } finally {
      setReportAuthorState(getStorageItem('report_author_data', ''));
      setSplashImageState(getStorageItem('splash_image_data', null));
      setLoading(false);
      console.log("Finished fetching initial data.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setProducts = (newProducts: Product[]) => setProductsState(newProducts);
  const setCatalog = (newCatalog: CatalogItem[]) => setCatalogState(newCatalog);
  
  const setReportAuthor = (author: string) => {
      setReportAuthorState(author);
      setStorageItem('report_author_data', author);
  }
  
  const setSplashImage = (image: string | null) => {
      setSplashImageState(image);
      setStorageItem('splash_image_data', image);
  }

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      console.log("DEBUG: Attempting to add product:", product);
      const docRef = await addDoc(collection(db, 'products'), product);
      const newProduct = { ...product, id: docRef.id };
      setProductsState(prev => [...prev, newProduct].sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
       console.log("DEBUG: Product added successfully with ID:", docRef.id);
    } catch (error) {
       console.error("DEBUG: Erro ao adicionar produto:", error);
       toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o produto.' });
       throw error;
    }
  };
  
  const updateProduct = async (productToUpdate: Product) => {
    if (!productToUpdate.id) {
       toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Produto sem ID para atualizar.' });
       return;
    }
    try {
      console.log("DEBUG: Attempting to update product:", productToUpdate);
      const { id, ...productData } = productToUpdate;
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, productData);
      setProductsState(prev => prev.map(p => p.id === id ? productToUpdate : p).sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
      console.log("DEBUG: Product updated successfully.");
    } catch (error) {
      console.error("DEBUG: Erro ao atualizar produto:", error);
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: 'Não foi possível atualizar o produto.' });
      throw error;
    }
  };

  const deleteProduct = async (productCode: string, productBatch: string) => {
    const productToDelete = products.find(p => p.code === productCode && p.batch === productBatch);
    if (!productToDelete || !productToDelete.id) return;
    try {
      console.log("DEBUG: Attempting to delete product:", productToDelete);
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setProductsState(prev => prev.filter(p => p.id !== productToDelete.id));
       console.log("DEBUG: Product deleted successfully.");
    } catch (error) {
      console.error("DEBUG: Erro ao excluir produto:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir o produto.' });
      throw error;
    }
  };
  
  const deleteExpiredProducts = async () => {
    const expiredProducts = products.filter(p => isPast(new Date(p.expirationDate)));
    if (expiredProducts.length === 0) return;

    try {
       console.log(`DEBUG: Deleting ${expiredProducts.length} expired products.`);
      const batch = writeBatch(db);
      expiredProducts.forEach(product => {
        if(product.id) {
          batch.delete(doc(db, 'products', product.id));
        }
      });
      await batch.commit();
      setProductsState(prev => prev.filter(p => !isPast(new Date(p.expirationDate))));
      console.log("DEBUG: Expired products deleted successfully.");
    } catch (error) {
      console.error("DEBUG: Erro ao excluir produtos vencidos:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir os produtos vencidos.' });
    }
  };

  const addCatalogItem = async (item: Omit<CatalogItem, 'id'>) => {
    const itemExists = catalog.some(c => c.code === item.code);
    if (itemExists) return;

    try {
        console.log("DEBUG: Attempting to add catalog item:", item);
        const docRef = await addDoc(collection(db, 'catalog'), item);
        const newItem = { ...item, id: docRef.id };
        setCatalogState(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        console.log("DEBUG: Catalog item added successfully with ID:", docRef.id);
    } catch (error) {
        console.error("DEBUG: Erro ao adicionar item ao catálogo:", error);
        toast({ variant: 'destructive', title: 'Erro ao Salvar Catálogo' });
        throw error;
    }
  }

  const updateCatalogItem = async (itemToUpdate: CatalogItem) => {
    if (!itemToUpdate.id) {
       toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Item de catálogo sem ID para atualizar.' });
       return;
    }
    try {
      console.log("DEBUG: Attempting to update catalog item:", itemToUpdate);
      const { id, ...itemData } = itemToUpdate;
      const itemRef = doc(db, 'catalog', id);
      await updateDoc(itemRef, itemData);
      setCatalogState(prev => prev.map(item => item.id === id ? itemToUpdate : item).sort((a,b) => a.name.localeCompare(b.name)));
      console.log("DEBUG: Catalog item updated successfully.");
    } catch (error) {
        console.error("DEBUG: Erro ao atualizar item do catálogo:", error);
        toast({ variant: 'destructive', title: 'Erro ao Atualizar Catálogo' });
        throw error;
    }
  }

  const deleteCatalogItem = async (itemCode: string) => {
    const itemToDelete = catalog.find(c => c.code === itemCode);
    if (!itemToDelete || !itemToDelete.id) return;
    try {
      console.log("DEBUG: Attempting to delete catalog item:", itemToDelete);
      await deleteDoc(doc(db, 'catalog', itemToDelete.id));
      setCatalogState(prev => prev.filter(item => item.code !== itemCode));
      console.log("DEBUG: Catalog item deleted successfully.");
    } catch(error) {
        console.error("DEBUG: Erro ao excluir item do catálogo:", error);
        toast({ variant: 'destructive', title: 'Erro ao Excluir do Catálogo' });
        throw error;
    }
  };
  
  const importCatalog = async (items: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    let successCount = 0;
    let failuresCount = 0;
    const totalCount = items.length;
    
    const existingCodes = new Set(catalog.map(c => c.code));
    const validItems: Omit<CatalogItem, 'id'>[] = [];

    for (const item of items) {
      const code = String(item.code || '').trim();
      if (!code || !item.name) {
        failuresCount++;
        continue;
      }
      if (existingCodes.has(code)) {
        failuresCount++;
        continue;
      }
      
      const newItem: Omit<CatalogItem, 'id'> = {
        code: code,
        name: String(item.name),
        category: String(item.category || ''),
      };
      validItems.push(newItem);
      existingCodes.add(code);
    }
    
    const newItemsForState: CatalogItem[] = [];
    let processedCount = 0;

    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchItems = validItems.slice(i, i + BATCH_SIZE);
        const batchItemsWithIds: CatalogItem[] = [];
        
        for (const item of batchItems) {
            const docRef = doc(collection(db, 'catalog'));
            batch.set(docRef, item);
            batchItemsWithIds.push({ ...item, id: docRef.id });
        }
      
        try {
            console.log(`DEBUG: Committing catalog batch ${i / BATCH_SIZE + 1}...`);
            await batch.commit();
            successCount += batchItems.length;
            newItemsForState.push(...batchItemsWithIds);
             console.log(`DEBUG: Catalog batch committed successfully.`);
        } catch (error) {
            console.error(`DEBUG: Erro ao salvar lote no catálogo (batch starting at index ${i}):`, error);
            failuresCount += batchItems.length;
        } finally {
            processedCount += batchItems.length;
            onProgress?.({ total: validItems.length, processed: processedCount });
        }
    }
    
    setCatalogState(prev => [...prev, ...newItemsForState].sort((a,b) => a.name.localeCompare(b.name)));
    
    return { success: successCount, failures: failuresCount, total: totalCount };
  };

  const importProducts = async (productsToImport: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    let successCount = 0;
    let failuresCount = 0;
    const totalCount = productsToImport.length;
    
    const validProducts: Omit<Product, 'id'>[] = [];
    
    for (const [index, item] of productsToImport.entries()) {
        try {
            if (!item.code || !item.name || !item.expirationDate) {
                throw new Error(`Dados essenciais faltando na linha ${index + 2}`);
            }
            const parsedDate = parse(String(item.expirationDate), 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Data inválida "${item.expirationDate}" na linha ${index + 2}.`);
            }

            const newProduct: Omit<Product, 'id'> = {
                code: String(item.code),
                name: String(item.name),
                quantity: Number(item.quantity || 0),
                category: String(item.category || ''),
                batch: String(item.batch || ''),
                expirationDate: parsedDate.toISOString(),
            };
            validProducts.push(newProduct);
        } catch (error: any) {
            console.error(error.message);
            toast({ variant: "destructive", title: "Erro na Validação", description: error.message, duration: 5000 });
            failuresCount++;
        }
    }
    
    const newProductsForState: Product[] = [];
    let processedCount = 0;

    for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchProducts = validProducts.slice(i, i + BATCH_SIZE);
        const batchProductsWithIds: Product[] = [];
       
        for (const product of batchProducts) {
            const docRef = doc(collection(db, 'products'));
            batch.set(docRef, product);
            batchProductsWithIds.push({ ...product, id: docRef.id });
        }
        
        try {
            console.log(`DEBUG: Committing product batch ${i / BATCH_SIZE + 1}...`);
            await batch.commit();
            successCount += batchProducts.length;
            newProductsForState.push(...batchProductsWithIds);
            console.log(`DEBUG: Product batch committed successfully.`);
        } catch (error) {
             console.error(`DEBUG: Erro ao salvar lote de produtos (batch starting at index ${i}):`, error);
            failuresCount += batchProducts.length;
        } finally {
            processedCount += batchProducts.length;
            onProgress?.({ total: validProducts.length, processed: processedCount });
        }
    }
    
    setProductsState(prev => [...prev, ...newProductsForState].sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));

    return { success: successCount, failures: failuresCount, total: totalCount };
  };

  return (
    <DataContext.Provider value={{ 
        products, 
        setProducts, 
        addProduct, 
        updateProduct,
        deleteProduct,
        deleteExpiredProducts,
        importProducts,
        catalog, 
        setCatalog, 
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        importCatalog,
        reportAuthor,
        setReportAuthor,
        splashImage,
        setSplashImage,
        loading,
    }}>
      {children}
    </DataContext.Provider>
  );
};

    