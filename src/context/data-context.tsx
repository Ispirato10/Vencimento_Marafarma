
'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import type { Product, CatalogItem } from '@/types';
import { isPast } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';


interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (productToUpdate: Product) => Promise<void>;
  deleteProduct: (productCode: string, productBatch: string) => Promise<void>;
  deleteExpiredProducts: () => Promise<void>;
  catalog: CatalogItem[];
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  addCatalogItem: (item: CatalogItem) => Promise<void>;
  updateCatalogItem: (itemToUpdate: CatalogItem) => Promise<void>;
  deleteCatalogItem: (itemCode: string) => Promise<void>;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({
  products: [],
  setProducts: () => {},
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  deleteExpiredProducts: async () => {},
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: async () => {},
  updateCatalogItem: async () => {},
  deleteCatalogItem: async () => {},
  reportAuthor: null,
  setReportAuthor: () => {},
  loading: true,
});

// Helper function to safely get item from localStorage
const getStorageItem = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const item = window.localStorage.getItem(key);
        if (item === null || item === 'null' || item === 'undefined') return fallback;
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return fallback;
    }
};

// Helper function to safely set item in localStorage
const setStorageItem = (key: string, value: any) => {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error: any) {
        // Check if the error is a quota exceeded error
        if (error.name === 'QuotaExceededError' || (error.code && (error.code === 22 || error.code === 1014))) {
             toast({
                variant: 'destructive',
                title: 'Erro de Armazenamento',
                description: `Não foi possível salvar os dados. O armazenamento local do navegador está cheio. As alterações não serão mantidas se a página for atualizada.`,
                duration: 10000,
            });
        } else {
            console.error(`Error saving localStorage key "${key}":`, error);
        }
        return false;
    }
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Firestore on initial load
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productsData);

      // Fetch catalog
      const catalogSnapshot = await getDocs(collection(db, 'catalog'));
      const catalogData = catalogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CatalogItem[];
      setCatalog(catalogData);

    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível conectar ao banco de dados. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
     // Load non-Firestore data from localStorage
    const storedReportAuthor = getStorageItem('report_author_data', 'By Marafarma');
    setReportAuthorState(storedReportAuthor);
  }, [fetchData]);


  // Save non-Firestore data to localStorage
  useEffect(() => {
    setStorageItem('report_author_data', reportAuthor);
  }, [reportAuthor]);


  const addProduct = async (product: Product) => {
    try {
      // Use code + batch as a unique ID
      const docId = `${product.code}_${product.batch}`;
      const docRef = doc(db, 'products', docId);
      await setDoc(docRef, product);
      setProducts((prev) => [...prev, { ...product, id: docId }]);
    } catch (error) {
      console.error("Error adding product: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o produto.' });
    }
  };
  
  const updateProduct = async (productToUpdate: Product) => {
    try {
      const docId = `${productToUpdate.code}_${productToUpdate.batch}`;
      const docRef = doc(db, "products", docId);
      await updateDoc(docRef, productToUpdate);
      setProducts((prev) => prev.map((p) => (p.code === productToUpdate.code && p.batch === productToUpdate.batch ? productToUpdate : p)));
    } catch (error) {
       console.error("Error updating product: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o produto.' });
    }
  };

  const deleteProduct = async (productCode: string, productBatch: string) => {
     try {
      const docId = `${productCode}_${productBatch}`;
      await deleteDoc(doc(db, "products", docId));
      setProducts((prev) => prev.filter((p) => !(p.code === productCode && p.batch === productBatch)));
    } catch (error) {
      console.error("Error deleting product: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o produto.' });
    }
  };

  const deleteExpiredProducts = async () => {
    const expiredProducts = products.filter(p => isPast(new Date(p.expirationDate)));
    if (expiredProducts.length === 0) return;

    const batch = writeBatch(db);
    expiredProducts.forEach(product => {
      const docId = `${product.code}_${product.batch}`;
      const docRef = doc(db, "products", docId);
      batch.delete(docRef);
    });

    try {
        await batch.commit();
        setProducts((prev) => prev.filter(p => !isPast(new Date(p.expirationDate))));
    } catch (error) {
        console.error("Error deleting expired products: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir os produtos vencidos.' });
    }
  };

  const addCatalogItem = async (item: CatalogItem) => {
    try {
      const docRef = doc(db, 'catalog', item.code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
         // Item already exists, no need to add again
         return;
      }

      await setDoc(docRef, item);
      setCatalog((prev) => [...prev, item]);
    } catch (error) {
       console.error("Error adding catalog item: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o item ao catálogo.' });
    }
  }

  const updateCatalogItem = async (itemToUpdate: CatalogItem) => {
    try {
      const docRef = doc(db, "catalog", itemToUpdate.code);
      await setDoc(docRef, itemToUpdate, { merge: true });
      setCatalog((prev) => prev.map((item) => (item.code === itemToUpdate.code ? itemToUpdate : item)));
    } catch (error) {
      console.error("Error updating catalog item: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o item do catálogo.' });
    }
  }

  const deleteCatalogItem = async (itemCode: string) => {
    try {
      await deleteDoc(doc(db, "catalog", itemCode));
      setCatalog((prev) => prev.filter((item) => item.code !== itemCode));
    } catch (error) {
        console.error("Error deleting catalog item: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o item do catálogo.' });
    }
  };
  
  const setReportAuthor = (author: string) => {
      setReportAuthorState(author);
  }

  return (
    <DataContext.Provider value={{ 
        products, 
        setProducts, 
        addProduct, 
        updateProduct,
        deleteProduct,
        deleteExpiredProducts,
        catalog, 
        setCatalog, 
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        reportAuthor,
        setReportAuthor,
        loading,
    }}>
      {children}
    </DataContext.Provider>
  );
};
