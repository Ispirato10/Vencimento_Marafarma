
'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import type { Product, CatalogItem } from '@/types';
import { initialProducts, initialCatalog, initialReportAuthor } from '@/lib/data';
import { isPast } from 'date-fns';
import { toast } from '@/hooks/use-toast';


interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => void;
  updateProduct: (productToUpdate: Product) => void;
  deleteProduct: (productCode: string, productBatch: string) => void;
  deleteExpiredProducts: () => void;
  catalog: CatalogItem[];
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  addCatalogItem: (item: CatalogItem) => void;
  updateCatalogItem: (itemToUpdate: CatalogItem) => void;
  deleteCatalogItem: (itemCode: string) => void;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
  logo: string | null;
  setLogo: (logo: string | null) => void;
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
  logo: null,
  setLogo: () => {},
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
                description: `Não foi possível salvar os dados de "${key}". O arquivo é muito grande para o armazenamento local do navegador. As alterações não serão mantidas se a página for atualizada.`,
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
  const [logo, setLogo] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from localStorage on the client side after initial render
  useEffect(() => {
    const storedProducts = getStorageItem('products_data', initialProducts);
    const storedCatalog = getStorageItem('catalog_data', initialCatalog);
    const storedReportAuthor = getStorageItem('report_author_data', initialReportAuthor);
    const storedLogo = getStorageItem('company_logo_data', null);
    
    setProducts(storedProducts);
    setCatalog(storedCatalog);
    setReportAuthorState(storedReportAuthor);
    if(storedLogo) {
      setLogo(storedLogo);
    }
    setDataLoaded(true);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!dataLoaded) return;
    setStorageItem('products_data', products);
  }, [products, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    setStorageItem('catalog_data', catalog);
  }, [catalog, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    setStorageItem('report_author_data', reportAuthor);
  }, [reportAuthor, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    setStorageItem('company_logo_data', logo);
  }, [logo, dataLoaded]);

  const addProduct = (product: Product) => {
    setProducts((prevProducts) => [...prevProducts, product]);
  };
  
  const updateProduct = (productToUpdate: Product) => {
    setProducts((prevProducts) => 
        prevProducts.map((p) => 
            p.code === productToUpdate.code && p.batch === productToUpdate.batch ? productToUpdate : p
        )
    );
  };

  const deleteProduct = (productCode: string, productBatch: string) => {
     setProducts((prevProducts) => 
        prevProducts.filter((p) => !(p.code === productCode && p.batch === productBatch))
    );
  };

  const deleteExpiredProducts = () => {
    setProducts((prevProducts) => 
        prevProducts.filter(p => !isPast(new Date(p.expirationDate)))
    );
  };

  const addCatalogItem = (item: CatalogItem) => {
    setCatalog((prevCatalog) => {
      if (prevCatalog.some(i => i.code === item.code)) {
        return prevCatalog;
      }
      return [...prevCatalog, item];
    });
  }

  const updateCatalogItem = (itemToUpdate: CatalogItem) => {
     setCatalog((prevCatalog) => 
        prevCatalog.map((item) => 
            item.code === itemToUpdate.code ? itemToUpdate : item
        )
    );
  }

  const deleteCatalogItem = (itemCode: string) => {
    setCatalog((prevCatalog) => prevCatalog.filter((item) => item.code !== itemCode));
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
        logo,
        setLogo,
    }}>
      {children}
    </DataContext.Provider>
  );
};
