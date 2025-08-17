
'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import type { Product, CatalogItem } from '@/types';
import { initialProducts, initialCatalog, initialLogo, initialReportAuthor } from '@/lib/data';

interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => void;
  updateProduct: (productToUpdate: Product) => void;
  deleteProduct: (productCode: string, productBatch: string) => void;
  catalog: CatalogItem[];
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  addCatalogItem: (item: CatalogItem) => void;
  updateCatalogItem: (itemToUpdate: CatalogItem) => void;
  deleteCatalogItem: (itemCode: string) => void;
  logo: string | null;
  setLogo: (logoData: string) => void;
  reportAuthor: string | null;
  setReportAuthor: (author: string) => void;
  isLoading: boolean;
}

export const DataContext = createContext<DataContextType>({
  products: [],
  setProducts: () => {},
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: () => {},
  updateCatalogItem: () => {},
  deleteCatalogItem: () => {},
  logo: null,
  setLogo: () => {},
  reportAuthor: null,
  setReportAuthor: () => {},
  isLoading: true,
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalog, setCatalog] = useState<CatalogItem[]>(initialCatalog);
  const [logo, setLogoState] = useState<string | null>(initialLogo);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(initialReportAuthor);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on the client side after initial render
  useEffect(() => {
    setProducts(getStorageItem('products_data', initialProducts));
    setCatalog(getStorageItem('catalog_data', initialCatalog));
    setLogoState(getStorageItem('logo_data', initialLogo));
    setReportAuthorState(getStorageItem('report_author_data', initialReportAuthor));
    
    setIsLoading(false);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return;
    setStorageItem('products_data', products);
  }, [products, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!setStorageItem('catalog_data', catalog)) {
       console.warn('Could not save catalog to localStorage. It might be too large.');
    }
  }, [catalog, isLoading]);
  
  useEffect(() => {
    if (isLoading) return;
    
    const logoSizeInBytes = logo ? new Blob([logo]).size : 0;
    const MAX_LOGO_SIZE = 500 * 1024; // 500 KB limit
    if (logoSizeInBytes < MAX_LOGO_SIZE) {
      setStorageItem('logo_data', logo);
    } else {
      console.warn('Logo is too large to be saved in localStorage.');
    }
  }, [logo, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    setStorageItem('report_author_data', reportAuthor);
  }, [reportAuthor, isLoading]);

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
        catalog, 
        setCatalog, 
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        logo,
        setLogo,
        reportAuthor,
        setReportAuthor,
        isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
};
