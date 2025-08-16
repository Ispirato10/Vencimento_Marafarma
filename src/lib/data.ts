import type { Product, CatalogItem } from '@/types';
import { addDays, addMonths } from 'date-fns';

export const initialCatalog: CatalogItem[] = [
  { code: '7896094900118', name: 'Dipirona Monoidratada 500mg', category: 'Analgésico' },
  { code: '7891058001719', name: 'Paracetamol 750mg', category: 'Analgésico' },
  { code: '7896004706505', name: 'Amoxicilina 500mg', category: 'Antibiótico' },
  { code: '7896112122331', name: 'Nimesulida 100mg', category: 'Anti-inflamatório' },
  { code: '7897322703870', name: 'Loratadina 10mg', category: 'Antialérgico' },
];

export const initialProducts: Product[] = [
  {
    code: '7896094900118',
    name: 'Dipirona Monoidratada 500mg',
    quantity: 15,
    category: 'Analgésico',
    batch: 'A22-001',
    expirationDate: addDays(new Date(), 25).toISOString(), // Vence em 25 dias
  },
  {
    code: '7891058001719',
    name: 'Paracetamol 750mg',
    quantity: 30,
    category: 'Analgésico',
    batch: 'P22-005',
    expirationDate: addDays(new Date(), 50).toISOString(), // Vence em 50 dias
  },
  {
    code: '7896004706505',
    name: 'Amoxicilina 500mg',
    quantity: 8,
    category: 'Antibiótico',
    batch: 'AMX-012',
    expirationDate: addDays(new Date(), 80).toISOString(), // Vence em 80 dias
  },
  {
    code: '7897322703870',
    name: 'Loratadina 10mg',
    quantity: 22,
    category: 'Antialérgico',
    batch: 'LOR-001',
    expirationDate: addDays(new Date(), 15).toISOString(), // Vence em 15 dias
  },
  {
    code: '7896112122331',
    name: 'Nimesulida 100mg',
    quantity: 10,
    category: 'Anti-inflamatório',
    batch: 'NIM-089',
    expirationDate: addMonths(new Date(), 4).toISOString(), // Vence em 4 meses
  },
  {
    code: '7891058001719',
    name: 'Paracetamol 750mg',
    quantity: 18,
    category: 'Analgésico',
    batch: 'P23-001',
    expirationDate: addDays(new Date(), 95).toISOString(), // Vence em 95 dias
  },
];

// Default logo as a Base64 Data URI. 
// This is a simple placeholder.
export const initialLogo = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBhY2thZ2UiPjxwYXRoIGQ9Ik0xMi44OSA1LjcxYS45OTIuOTkyIDAgMCAwLTEuNzggMEw2LjI2IDExLjE5YTEgMSAwIDAgMCAuNDUgMS43N0gxMi4ybDQuNDQtNS45NmMuMzItLjQxLjMyLTEuMDQuMDQtMS40M1oiLz48cGF0aCBkPSJNNy43NiAxMmgxNi40OCIvPjxwYXRoIGQ9Im0xOCAxMi01LjQ1IDcuMzJhMiAyIDAgMCAxLTMuMSAwbC01LjQ1LTcuMzIiLz48cGF0aCBkPSJNNiAxMmgyLjIxYTQgNCAwIDAgMCAzLjc5LTEuODhsMS41NS0yLjkyYSAxIDEgMCAwIDEgMS43OCAwTDE2IDExLjdBNCA0IDAgMCAxIDE5Ljc5IDEySDIyIi8+PC9zdmc+`;

export const initialReportAuthor = 'By Rogério N. Nunes';
