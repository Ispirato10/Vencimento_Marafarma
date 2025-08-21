
'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  writeBatch,
} from 'firebase/firestore';
import { isPast, parse } from 'date-fns';

import type { Product, CatalogItem } from '@/types';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface DataContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (productToUpdate: Product) => Promise<void>;
  deleteProduct: (productCode: string, productBatch: string) => Promise<void>;
  deleteExpiredProducts: () => Promise<void>;
  importProducts: (products: any[], onProgress?: (progress: {total: number, processed: number}) => void) => Promise<any>;
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  addCatalogItem: (item: CatalogItem) => Promise<void>;
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

// Helper function to safely get item from localStorage (for non-Firebase data)
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

// Helper function to safely set item in localStorage
const setStorageItem = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
    }
};

const BATCH_SIZE = 50;

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProductsState] = useState<Product[]>([]);
  const [catalog, setCatalogState] = useState<CatalogItem[]>([]);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [splashImage, setSplashImageState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const catalogQuery = query(collection(db, 'catalog'));
      const catalogSnapshot = await getDocs(catalogQuery);
      const catalogData = catalogSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CatalogItem));
      setCatalogState(catalogData.sort((a, b) => a.name.localeCompare(b.name)));

      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProductsState(productsData.sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));

    } catch (error) {
      console.error("Erro ao buscar dados do Firebase:", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao Firebase. Verifique suas credenciais e conexão.',
      });
    } finally {
      // Load non-firestore data from localStorage
      setReportAuthorState(getStorageItem('report_author_data', ''));
      setSplashImageState(getStorageItem('splash_image_data', null));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setProducts = (newProducts: Product[]) => {
    setProductsState(newProducts);
  }

  const setCatalog = (newCatalog: CatalogItem[]) => {
    setCatalogState(newCatalog);
  }
  
  const setReportAuthor = (author: string) => {
      setReportAuthorState(author);
      setStorageItem('report_author_data', author);
  }
  
  const setSplashImage = (image: string | null) => {
      setSplashImageState(image);
      setStorageItem('splash_image_data', image);
  }

  const addProduct = async (product: Product) => {
    try {
      const docRef = doc(collection(db, 'products'));
      const newProduct = { ...product, id: docRef.id };
      await setDoc(docRef, newProduct);
      setProductsState(prev => [...prev, newProduct].sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
    } catch (error) {
       console.error("Erro ao adicionar produto:", error);
       toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o produto.' });
    }
  };
  
  const updateProduct = async (productToUpdate: Product) => {
    if (!productToUpdate.id) return;
    try {
      const productRef = doc(db, 'products', productToUpdate.id);
      await setDoc(productRef, productToUpdate, { merge: true });
      setProductsState(prev => prev.map(p => p.id === productToUpdate.id ? productToUpdate : p));
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: 'Não foi possível atualizar o produto.' });
    }
  };

  const deleteProduct = async (productCode: string, productBatch: string) => {
    const productToDelete = products.find(p => p.code === productCode && p.batch === productBatch);
    if (!productToDelete || !productToDelete.id) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setProductsState(prev => prev.filter(p => p.id !== productToDelete.id));
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir o produto.' });
    }
  };
  
  const deleteExpiredProducts = async () => {
    const expiredProducts = products.filter(p => isPast(new Date(p.expirationDate)));
    if (expiredProducts.length === 0) return;

    try {
      const batch = writeBatch(db);
      expiredProducts.forEach(product => {
        if(product.id) {
          batch.delete(doc(db, 'products', product.id));
        }
      });
      await batch.commit();
      setProductsState(prev => prev.filter(p => !isPast(new Date(p.expirationDate))));
    } catch (error) {
      console.error("Erro ao excluir produtos vencidos:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível excluir os produtos vencidos.' });
    }
  };

  const addCatalogItem = async (item: CatalogItem) => {
    const itemExists = catalog.some(c => c.code === item.code);
    if (!itemExists) {
        try {
            const docRef = doc(collection(db, 'catalog'));
            const newItem = { ...item, id: docRef.id };
            await setDoc(docRef, newItem);
            setCatalogState(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Erro ao adicionar item ao catálogo:", error);
            toast({ variant: 'destructive', title: 'Erro ao Salvar Catálogo' });
        }
    }
  }

  const updateCatalogItem = async (itemToUpdate: CatalogItem) => {
    if (!itemToUpdate.id) return;
    try {
      const itemRef = doc(db, 'catalog', itemToUpdate.id);
      await setDoc(itemRef, itemToUpdate, { merge: true });
      setCatalogState(prev => prev.map(item => item.id === itemToUpdate.id ? itemToUpdate : item));
    } catch (error) {
        console.error("Erro ao atualizar item do catálogo:", error);
        toast({ variant: 'destructive', title: 'Erro ao Atualizar Catálogo' });
    }
  }

  const deleteCatalogItem = async (itemCode: string) => {
    const itemToDelete = catalog.find(c => c.code === itemCode);
    if (!itemToDelete || !itemToDelete.id) return;
    try {
      await deleteDoc(doc(db, 'catalog', itemToDelete.id));
      setCatalogState(prev => prev.filter(item => item.code !== itemCode));
    } catch(error) {
        console.error("Erro ao excluir item do catálogo:", error);
        toast({ variant: 'destructive', title: 'Erro ao Excluir do Catálogo' });
    }
  };
  
  const importCatalog = async (items: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    const totalCount = items.length;
    let successCount = 0;
    let processedCount = 0;
    
    const existingCodes = new Set(catalog.map(c => c.code));

    const validItems: CatalogItem[] = [];

    for (const item of items) {
      const code = String(item.code || '').trim();
      if (!code || !item.name) {
        console.warn('Item do catálogo ignorado por falta de código ou nome:', item);
        continue;
      }
      if (existingCodes.has(code)) {
        continue;
      }
      
      const newItem: CatalogItem = {
        code: code,
        name: String(item.name),
        category: String(item.category || ''),
      };
      validItems.push(newItem);
      existingCodes.add(code);
    }
    
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchItems = validItems.slice(i, i + BATCH_SIZE);
        const newCatalogItemsForState: CatalogItem[] = [];

        for (const item of batchItems) {
            const docRef = doc(collection(db, 'catalog'));
            const itemWithId = { ...item, id: docRef.id };
            batch.set(docRef, itemWithId);
            newCatalogItemsForState.push(itemWithId);
        }
      
        try {
            await batch.commit();
            successCount += batchItems.length;
            setCatalogState(prev => [...prev, ...newCatalogItemsForState].sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Erro ao salvar lote no catálogo:", error);
            throw new Error(`Falha ao salvar um lote no Firebase. Erro: ${(error as Error).message}`);
        } finally {
            processedCount += batchItems.length;
            onProgress?.({ total: validItems.length, processed: processedCount });
        }
    }
    return { success: successCount, failures: totalCount - successCount, total: totalCount };
  };

  const importProducts = async (productsToImport: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    const totalCount = productsToImport.length;
    let successCount = 0;
    let failuresCount = 0;
    let processedCount = 0;

    const validProducts: Product[] = [];

    for (const [index, item] of productsToImport.entries()) {
        try {
            if (!item.code || !item.name || !item.expirationDate) {
                throw new Error(`Dados essenciais faltando (código, nome, data)`);
            }
            const parsedDate = parse(item.expirationDate, 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Data inválida "${item.expirationDate}". Use o formato DD/MM/AAAA.`);
            }

            const newProduct: Product = {
                code: String(item.code),
                name: String(item.name),
                quantity: Number(item.quantity || 0),
                category: String(item.category || ''),
                batch: String(item.batch || ''),
                expirationDate: parsedDate.toISOString(),
            };
            validProducts.push(newProduct);
        } catch (error) {
            console.error(`Erro ao processar produto na linha ${index + 2}: ${(error as Error).message}`);
            failuresCount++;
        }
    }

    for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchProducts = validProducts.slice(i, i + BATCH_SIZE);
        const newProductsForState: Product[] = [];

        for (const product of batchProducts) {
            const docRef = doc(collection(db, 'products'));
            const productWithId = { ...product, id: docRef.id };
            batch.set(docRef, productWithId);
            newProductsForState.push(productWithId);
        }
        
        try {
            await batch.commit();
            successCount += batchProducts.length;
            setProductsState(prev => [...prev, ...newProductsForState].sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
        } catch (error) {
            console.error("Erro ao salvar lote de produtos:", error);
            failuresCount += batchProducts.length;
        } finally {
            processedCount += batchProducts.length;
            onProgress?.({ total: validProducts.length, processed: processedCount });
        }
    }
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
