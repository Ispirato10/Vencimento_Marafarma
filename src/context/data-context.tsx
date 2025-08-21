
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
import { isPast, parse as dateParse } from 'date-fns';

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
  importProducts: (products: Product[], onProgress?: (progress: {total: number, processed: number}) => void) => Promise<void>;
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  addCatalogItem: (item: CatalogItem) => Promise<void>;
  updateCatalogItem: (itemToUpdate: CatalogItem) => Promise<void>;
  deleteCatalogItem: (itemCode: string) => Promise<void>;
  importCatalog: (items: CatalogItem[], onProgress?: (progress: {total: number, processed: number}) => void) => Promise<void>;
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
  importProducts: async () => {},
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: async () => {},
  updateCatalogItem: async () => {},
  deleteCatalogItem: async () => {},
  importCatalog: async () => {},
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
      setCatalogState(catalogData);

      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProductsState(productsData);

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
      setProductsState(prev => [...prev, newProduct]);
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
            setCatalogState(prev => [...prev, newItem]);
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
  
  const importCatalog = async (items: CatalogItem[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    const existingCodes = new Set(catalog.map(c => c.code));
    const newItemsToCommit: CatalogItem[] = [];

    items.forEach(item => {
      if (!existingCodes.has(item.code)) {
        const docRef = doc(collection(db, 'catalog'));
        const newItem = { ...item, id: docRef.id };
        newItemsToCommit.push(newItem);
        existingCodes.add(item.code); 
      }
    });
    
    if (newItemsToCommit.length === 0) {
      onProgress?.({ total: 0, processed: 0 });
      return;
    }

    let processedCount = 0;
    for (let i = 0; i < newItemsToCommit.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchItems = newItemsToCommit.slice(i, i + BATCH_SIZE);
      batchItems.forEach(item => {
        const itemRef = doc(db, 'catalog', item.id!);
        batch.set(itemRef, item);
      });
      await batch.commit();
      processedCount += batchItems.length;
      onProgress?.({ total: newItemsToCommit.length, processed: processedCount });
    }

    setCatalogState(prev => [...prev, ...newItemsToCommit]);
  };

  const importProducts = async (productsToImport: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    let processedData;
    try {
        processedData = productsToImport.map(item => {
            if (!item.expirationDate || typeof item.expirationDate !== 'string') {
                throw new Error(`Data de vencimento inválida ou ausente para o produto ${item.name || item.code}`);
            }
            const parsedDate = dateParse(item.expirationDate, 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Formato de data inválido para "${item.expirationDate}" no produto ${item.name || item.code}. Use DD/MM/AAAA.`);
            }
            const docRef = doc(collection(db, 'products'));
            return {
                ...item,
                id: docRef.id,
                expirationDate: parsedDate.toISOString(),
            };
        });
    } catch (error) {
        // This will propagate the error to the calling function in settings page
        throw error;
    }
    
    const newProductsToCommit: Product[] = processedData;

    if (newProductsToCommit.length === 0) {
        onProgress?.({ total: 0, processed: 0 });
        return;
    }

    let processedCount = 0;
    for (let i = 0; i < newProductsToCommit.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchProducts = newProductsToCommit.slice(i, i + BATCH_SIZE);
        batchProducts.forEach(product => {
            const docRef = doc(db, 'products', product.id!);
            batch.set(docRef, product);
        });
        await batch.commit();
        processedCount += batchProducts.length;
        onProgress?.({ total: newProductsToCommit.length, processed: processedCount });
    }
    
    setProductsState(prev => [...prev, ...newProductsToCommit]);
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

    