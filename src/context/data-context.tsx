
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

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [logo, setLogoState] = useState<string | null>(null);
  const [reportAuthor, setReportAuthorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from localStorage or fallback to initialData
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('products');
      const storedCatalog = localStorage.getItem('catalog');
      const storedLogo = localStorage.getItem('logo');
      const storedReportAuthor = localStorage.getItem('reportAuthor');

      setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
      setCatalog(storedCatalog ? JSON.parse(storedCatalog) : initialCatalog);
      setLogoState(storedLogo || initialLogo);
      setReportAuthorState(storedReportAuthor || initialReportAuthor);


    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      // Fallback to initial data if localStorage fails
      setProducts(initialProducts);
      setCatalog(initialCatalog);
      setLogoState(initialLogo);
      setReportAuthorState(initialReportAuthor);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isLoading]);

  useEffect(() => {
     if (!isLoading) {
      localStorage.setItem('catalog', JSON.stringify(catalog));
    }
  }, [catalog, isLoading]);

  useEffect(() => {
    if (logo && !isLoading) {
      localStorage.setItem('logo', logo);
    }
  }, [logo, isLoading]);

  useEffect(() => {
    if (reportAuthor !== null && !isLoading) {
        localStorage.setItem('reportAuthor', reportAuthor);
    }
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
