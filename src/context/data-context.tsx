
'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import type { Product, CatalogItem } from '@/types';
import { initialProducts, initialCatalog, initialLogo, initialReportAuthor } from '@/lib/data';
import { isPast } from 'date-fns';

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
  logo: string | null;
  setLogo: (logoData: string) => void;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
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
  logo: null,
  setLogo: () => {},
  reportAuthor: null,
  setReportAuthor: () => {},
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
    } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
        return false;
    }
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [logo, setLogoState] = useState<string | null>(null);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on the client side after initial render
  useEffect(() => {
    const storedProducts = getStorageItem('products_data', initialProducts);
    const storedCatalog = getStorageItem('catalog_data', initialCatalog);
    const storedLogo = getStorageItem('logo_data', initialLogo);
    const storedReportAuthor = getStorageItem('report_author_data', initialReportAuthor);
    
    setProducts(storedProducts);
    setCatalog(storedCatalog);
    setLogoState(storedLogo);
    setReportAuthorState(storedReportAuthor);
    
    setIsInitialized(true);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('products_data', products);
  }, [products, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!setStorageItem('catalog_data', catalog)) {
       console.warn('Could not save catalog to localStorage. It might be too large.');
    }
  }, [catalog, isInitialized]);
  
  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('logo_data', logo);
  }, [logo, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('report_author_data', reportAuthor);
  }, [reportAuthor, isInitialized]);

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

  const setLogo = (logoData: string) => {
    setLogoState(logoData);
  }
  
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
        logo,
        setLogo,
        reportAuthor,
        setReportAuthor,
    }}>
      {children}
    </DataContext.Provider>
  );
};
