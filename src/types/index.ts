export type Product = {
  id?: string; // Firestore document ID
  code: string;
  name: string;
  quantity: number;
  category: string;
  batch: string;
  expirationDate: string; // ISO 8601 date string
};

export type CatalogItem = {
  id?: string; // Firestore document ID
  code: string;
  name: string;
  category: string;
};
