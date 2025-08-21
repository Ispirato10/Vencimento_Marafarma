
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
  setDoc,
} from 'firebase/firestore';
import { isPast, parse } from 'date-fns';
import * as XLSX from 'xlsx';

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

    } catch (error: any) {
      console.error("DEBUG: Erro ao buscar dados do Firebase:", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Conexão',
        description: `Não foi possível ler dados do Firebase. Verifique suas regras de segurança e a conexão com a internet. Erro: ${error.message}`,
        duration: 9000
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

 const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    console.log("Attempting to add product...", product);
    try {
        const docRef = await addDoc(collection(db, 'products'), product);
        const newProduct = { ...product, id: docRef.id };
        setProductsState(prev => [...prev, newProduct].sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
        console.log("Product added successfully with ID:", docRef.id);
    } catch (error: any) {
        console.error("Error adding product to Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar Produto',
            description: `Falha ao salvar no Firebase: ${error.message}`,
        });
        throw error;
    }
}, []);
  
  const updateProduct = async (productToUpdate: Product) => {
    if (!productToUpdate.id) {
       toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Produto sem ID para atualizar.' });
       return;
    }
    try {
      const { id, ...productData } = productToUpdate;
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, productData);
      setProductsState(prev => prev.map(p => p.id === id ? productToUpdate : p).sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({ variant: 'destructive', title: 'Erro ao Atualizar', description: `Não foi possível atualizar o produto. Erro: ${error.message}` });
      throw error;
    }
  };

  const deleteProduct = async (productCode: string, productBatch: string) => {
    const productToDelete = products.find(p => p.code === productCode && p.batch === productBatch);
    if (!productToDelete || !productToDelete.id) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      setProductsState(prev => prev.filter(p => p.id !== productToDelete.id));
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: `Não foi possível excluir o produto. Erro: ${error.message}` });
      throw error;
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
    } catch (error: any) {
      console.error("Error deleting expired products:", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: `Não foi possível excluir os produtos vencidos. Erro: ${error.message}` });
    }
  };

  const addCatalogItem = useCallback(async (item: Omit<CatalogItem, 'id'>) => {
    const itemExists = catalog.some(c => c.code === item.code);
    if (itemExists) return Promise.resolve();

    console.log("Attempting to add catalog item...", item);
    try {
        await setDoc(doc(db, 'catalog', item.code), item);
        const newItem = { ...item, id: item.code };
        setCatalogState(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        console.log("Catalog item added successfully with ID:", item.code);
    } catch (error: any) {
        console.error("Error adding catalog item:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar no Catálogo',
            description: `Falha ao salvar no Firebase: ${error.message}`,
        });
        throw error;
    }
  }, [catalog]);

  const updateCatalogItem = async (itemToUpdate: CatalogItem) => {
    if (!itemToUpdate.id) {
       toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Item de catálogo sem ID para atualizar.' });
       return;
    }
    try {
      const { id, ...itemData } = itemToUpdate;
      const itemRef = doc(db, 'catalog', id);
      await updateDoc(itemRef, itemData);
      setCatalogState(prev => prev.map(item => item.id === id ? itemToUpdate : item).sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
        console.error("Error updating catalog item:", error);
        toast({ variant: 'destructive', title: 'Erro ao Atualizar Catálogo', description: `Erro: ${error.message}` });
        throw error;
    }
  }

  const deleteCatalogItem = async (itemCode: string) => {
    const itemToDelete = catalog.find(c => c.code === itemCode);
    if (!itemToDelete || !itemToDelete.id) return;
    try {
      await deleteDoc(doc(db, 'catalog', itemToDelete.id));
      setCatalogState(prev => prev.filter(item => item.code !== itemCode));
    } catch(error: any) {
        console.error("Error deleting catalog item:", error);
        toast({ variant: 'destructive', title: 'Erro ao Excluir do Catálogo', description: `Erro: ${error.message}` });
        throw error;
    }
  };
  
 const importCatalog = useCallback(async (itemsToImport: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    let successCount = 0;
    let failuresCount = 0;
    const totalCount = itemsToImport.length;
    let processedCount = 0;
    const importedItemsForState: CatalogItem[] = [];

    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const item of itemsToImport) {
        processedCount++;
        const code = String(item.code || '').trim();
        if (!code || !item.name) {
            failuresCount++;
            continue;
        }

        const newItemData: Omit<CatalogItem, 'id'> = {
            code: code,
            name: String(item.name),
            category: String(item.category || ''),
        };

        const docRef = doc(db, 'catalog', code);
        batch.set(docRef, newItemData, { merge: true });
        batchCount++;

        importedItemsForState.push({ ...newItemData, id: code });

        if (batchCount >= BATCH_SIZE) {
            try {
                await batch.commit();
                successCount += batchCount;
                onProgress?.({ total: totalCount, processed: successCount });
                batch = writeBatch(db);
                batchCount = 0;
            } catch (error) {
                console.error(`Error committing catalog batch:`, error);
                failuresCount += batchCount;
                batch = writeBatch(db);
                batchCount = 0;
            }
        }
    }

    if (batchCount > 0) {
        try {
            await batch.commit();
            successCount += batchCount;
            onProgress?.({ total: totalCount, processed: successCount });
        } catch (error) {
            console.error(`Error committing final catalog batch:`, error);
            failuresCount += batchCount;
        }
    }

    setCatalogState(prev => {
        const prevMap = new Map(prev.map(item => [item.code, item]));
        importedItemsForState.forEach(item => prevMap.set(item.code, item));
        return Array.from(prevMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    });

    return { success: successCount, failures: failuresCount, total: totalCount };
}, []);

  const importProducts = useCallback(async (productsToImport: any[], onProgress?: (progress: {total: number, processed: number}) => void) => {
    let successCount = 0;
    let failuresCount = 0;
    let processedInLoop = 0;
    const totalCount = productsToImport.length;
    const newProductsForState: Product[] = [];
    
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const item of productsToImport) {
        processedInLoop++;
        try {
            if (!item.code || !item.name || !item.expirationDate) {
                failuresCount++;
                continue;
            }
            const parsedDate = parse(String(item.expirationDate), 'dd/MM/yyyy', new Date());
            if (isNaN(parsedDate.getTime())) {
                failuresCount++;
                continue;
            }

            const newProduct: Omit<Product, 'id'> = {
                code: String(item.code),
                name: String(item.name),
                quantity: Number(item.quantity || 0),
                category: String(item.category || ''),
                batch: String(item.batch || `IMPORT-${Date.now()}`),
                expirationDate: parsedDate.toISOString(),
            };

            const docRef = doc(collection(db, 'products'));
            batch.set(docRef, newProduct);
            newProductsForState.push({ ...newProduct, id: docRef.id });
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                successCount += batchCount;
                batch = writeBatch(db);
                batchCount = 0;
                onProgress?.({ total: totalCount, processed: processedInLoop });
            }

        } catch (error: any) {
            console.error(`Error processing product:`, error);
            failuresCount++;
        }
    }

    if (batchCount > 0) {
        try {
            await batch.commit();
            successCount += batchCount;
            onProgress?.({ total: totalCount, processed: processedInLoop });
        } catch (error) {
            console.error('Error committing final product batch:', error);
            failuresCount += batchCount;
        }
    }
    
    setProductsState(prev => [...prev, ...newProductsForState].sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()));

    return { success: successCount, failures: failuresCount, total: totalCount };
  }, []);

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
