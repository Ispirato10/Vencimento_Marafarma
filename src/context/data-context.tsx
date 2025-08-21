
'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import type { Product, CatalogItem } from '@/types';
import { isPast } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { initialCatalog, initialProducts, initialReportAuthor } from '@/lib/data';

interface DataContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productToUpdate: Product) => void;
  deleteProduct: (productCode: string, productBatch: string) => void;
  deleteExpiredProducts: () => void;
  catalog: CatalogItem[];
  setCatalog: (catalog: CatalogItem[]) => void;
  addCatalogItem: (item: CatalogItem) => void;
  updateCatalogItem: (itemToUpdate: CatalogItem) => void;
  deleteCatalogItem: (itemCode: string) => void;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
  splashImage: string | null;
  setSplashImage: (image: string | null) => void;
  loading: boolean;
}

export const DataContext = createContext<DataContextType>({
  products: [],
  setProducts: () => {},
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  deleteExpiredProducts: () => {},
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: () => {},
  updateCatalogItem: () => {},
  deleteCatalogItem: () => {},
  reportAuthor: null,
  setReportAuthor: () => {},
  splashImage: null,
  setSplashImage: () => {},
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
        // For initial data, if the storage is empty, use the seed data.
        if (item === '[]' && (key === 'catalog_data' || key === 'products_data')) {
            return fallback;
        }
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
  const [products, setProductsState] = useState<Product[]>([]);
  const [catalog, setCatalogState] = useState<CatalogItem[]>([]);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [splashImage, setSplashImageState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all data from localStorage on initial mount
  useEffect(() => {
    setLoading(true);
    const storedProducts = getStorageItem('products_data', initialProducts);
    const storedCatalog = getStorageItem('catalog_data', initialCatalog);
    const storedReportAuthor = getStorageItem('report_author_data', initialReportAuthor);
    const storedSplashImage = getStorageItem('splash_image_data', null);

    setProductsState(storedProducts);
    setCatalogState(storedCatalog);
    setReportAuthorState(storedReportAuthor);
    setSplashImageState(storedSplashImage);
    setLoading(false);
  }, []);

  const setProducts = (newProducts: Product[]) => {
    setProductsState(newProducts);
    setStorageItem('products_data', newProducts);
  }

  const setCatalog = (newCatalog: CatalogItem[]) => {
    setCatalogState(newCatalog);
    setStorageItem('catalog_data', newCatalog);
  }
  
  const setReportAuthor = (author: string) => {
      setReportAuthorState(author);
      setStorageItem('report_author_data', author);
  }
  
  const setSplashImage = (image: string | null) => {
      setSplashImageState(image);
      setStorageItem('splash_image_data', image);
  }

  const addProduct = (product: Product) => {
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
  };
  
  const updateProduct = (productToUpdate: Product) => {
    const updatedProducts = products.map((p) => (p.code === productToUpdate.code && p.batch === productToUpdate.batch ? productToUpdate : p));
    setProducts(updatedProducts);
  };

  const deleteProduct = (productCode: string, productBatch: string) => {
    const updatedProducts = products.filter((p) => !(p.code === productCode && p.batch === productBatch));
    setProducts(updatedProducts);
  };

  const deleteExpiredProducts = () => {
    const unexpiredProducts = products.filter(p => !isPast(new Date(p.expirationDate)));
    setProducts(unexpiredProducts);
  };

  const addCatalogItem = (item: CatalogItem) => {
    const itemExists = catalog.some(c => c.code === item.code);
    if (!itemExists) {
        const updatedCatalog = [...catalog, item];
        setCatalog(updatedCatalog);
    }
  }

  const updateCatalogItem = (itemToUpdate: CatalogItem) => {
    const updatedCatalog = catalog.map((item) => (item.code === itemToUpdate.code ? itemToUpdate : item));
    setCatalog(updatedCatalog);
  }

  const deleteCatalogItem = (itemCode: string) => {
    const updatedCatalog = catalog.filter((item) => item.code !== itemCode);
    setCatalog(updatedCatalog);
  };
  

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
        splashImage,
        setSplashImage,
        loading,
    }}>
      {children}
    </DataContext.Provider>
  );
};
