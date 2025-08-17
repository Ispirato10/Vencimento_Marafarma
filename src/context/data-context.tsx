
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
        // Ensure that if the stored item is `null` (string), it's parsed correctly.
        if (item === null || item === 'null') return fallback;
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
        // This is where quota exceeded errors are caught.
        return false;
    }
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state directly from localStorage to avoid race conditions.
  const [products, setProducts] = useState<Product[]>(() => getStorageItem('products_data', initialProducts));
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => getStorageItem('catalog_data', initialCatalog));
  const [logo, setLogoState] = useState<string | null>(() => getStorageItem('logo_data', initialLogo));
  const [reportAuthor, setReportAuthorState] = useState<string | null>(() => getStorageItem('report_author_data', initialReportAuthor));
  const [isLoading, setIsLoading] = useState(true);
  
  // This effect now only controls the visibility of the splash screen.
  useEffect(() => {
    // A small timeout can ensure the UI has settled before removing the splash screen.
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    setStorageItem('products_data', products);
  }, [products]);

  useEffect(() => {
    if (!setStorageItem('catalog_data', catalog)) {
       console.warn('Could not save catalog to localStorage. It might be too large.');
    }
  }, [catalog]);

  useEffect(() => {
    // Avoid saving the initial null value back to storage.
    if (logo === null && !localStorage.getItem('logo_data')) return;
    
    const logoSizeInBytes = logo ? new Blob([logo]).size : 0;
    const MAX_LOGO_SIZE = 500 * 1024; // 500 KB limit
    if (logoSizeInBytes < MAX_LOGO_SIZE) {
      setStorageItem('logo_data', logo);
    } else {
      console.warn('Logo is too large to be saved in localStorage.');
    }
  }, [logo]);

  useEffect(() => {
    if (reportAuthor === null && !localStorage.getItem('report_author_data')) return;
    setStorageItem('report_author_data', reportAuthor);
  }, [reportAuthor]);

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
      // Prevent adding duplicates
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
