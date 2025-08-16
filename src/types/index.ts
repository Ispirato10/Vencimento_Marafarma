export type Product = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  category: string;
  batch: string;
  expirationDate: Date;
};

export type CatalogItem = {
  code: string;
  name: string;
  category: string;
};
