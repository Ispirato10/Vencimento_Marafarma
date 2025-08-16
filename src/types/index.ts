export type Product = {
  code: string;
  name: string;
  quantity: number;
  category: string;
  batch: string;
  expirationDate: string; // ISO 8601 date string
};

export type CatalogItem = {
  code: string;
  name: string;
  category: string;
};
