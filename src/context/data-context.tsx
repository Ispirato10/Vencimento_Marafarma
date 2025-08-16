
'use client';

import { createContext, useState, ReactNode } from 'react';
import type { Product, CatalogItem } from '@/types';
import { initialProducts, initialCatalog } from '@/lib/data';

interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => void;
  catalog: CatalogItem[];
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  addCatalogItem: (item: CatalogItem) => void;
}

export const DataContext = createContext<DataContextType>({
  products: [],
  setProducts: () => {},
  addProduct: () => {},
  catalog: [],
  setCatalog: () => {},
  addCatalogItem: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalog, setCatalog] = useState<CatalogItem[]>(initialCatalog);

  const addProduct = (product: Product) => {
    setProducts((prevProducts) => [...prevProducts, product]);
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

  return (
    <DataContext.Provider value={{ products, setProducts, addProduct, catalog, setCatalog, addCatalogItem }}>
      {children}
    </DataContext.Provider>
  );
};
